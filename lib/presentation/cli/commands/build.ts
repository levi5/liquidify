import type { DependencyTracker } from '../../../application/services/dependency-tracker'
import { _match, _try } from 'funcio'
import { EventEmitter } from 'node:events'
import os from 'node:os'
import type { FSWatcher } from 'chokidar'
import { glob } from 'glob'
import chokidar from 'chokidar'
import path from 'node:path'
import type { LiquidifyPlugin, PluginStats } from '../../../core/protocols/plugin'

import type { ComponentRegistry, DirectiveScanner } from '../../../application/services/component-registry'
import type { BabelLiquidParser } from '../../../infra/adapters/parsers/babel/babel-parser'
import type { ReactRuntimeBuilder } from '../../../infra/adapters/compilers/react/runtime/runtime-builder'
import type { TranspileFileUseCase } from '../../../application/services/transpile-file'
import type { IFileSystem } from '../../../core/protocols/file-system'
import { LiquidifyError } from '../../../core/errors/liquidify-error'
import type { Logger } from '../../../shared/logger'

const WATCH_EVENTS = ['add', 'change', 'unlink', 'addDir', 'unlinkDir'] as const

const availableParallelism = (): number => {
  const reported = typeof os.availableParallelism === 'function' ? os.availableParallelism() : os.cpus().length
  return Number.isFinite(reported) && reported > 0 ? reported : 1
}

export const BUILD_CONCURRENCY = Math.max(1, Math.min(8, availableParallelism()))

export class LiquidifyBuilder extends EventEmitter {
  private watcher: FSWatcher | null = null
  private timer: NodeJS.Timeout | null = null
  private building = false
  private queued = false
  private disposed = false
  private registrySignature = ''
  private runtimeScript?: string
  private watchedDependencies = new Set<string>()
  private pluginContext: { onBuildEnd: (stats: PluginStats) => void }[] = []

  constructor(
    private readonly options: { componentsDir: string; output: string },
    private readonly parser: BabelLiquidParser,
    private readonly useCase: TranspileFileUseCase,
    private readonly fileSystem: IFileSystem,
    private readonly dependencies: DependencyTracker,
    private readonly registry: ComponentRegistry,
    private readonly runtimeBuilder: ReactRuntimeBuilder,
    private readonly scanner: DirectiveScanner,
    private readonly logger: Logger,
  ) {
    super()
  }

  public registerPlugin(plugin: LiquidifyPlugin): void {
    const callbacks: Array<(stats: PluginStats) => void> = []
    const ctx = {
      onBuildEnd: (callback: (stats: PluginStats) => void) => {
        callbacks.push(callback)
      },
    }
    plugin.setup(ctx)
    this.pluginContext.push({
      onBuildEnd: (stats: PluginStats) => {
        for (const cb of callbacks) cb(stats)
      },
    })
  }

  async build() {
    this.emit('build:start')
    const result = await _try.async(() => this.buildProject())
    result.match({
      right: () => {
        this.emit('build:end')
        this.notifyBuildEnd()
      },
      left: (error) => this.fail(error),
    })
  }

  private notifyBuildEnd(): void {
    const stats = this.collectStats()
    for (const p of this.pluginContext) p.onBuildEnd(stats)
  }

  private collectStats(): PluginStats {
    const files = glob.sync(path.join(this.options.componentsDir, '**/*.{tsx,jsx,ts,js}'))
    const stats: PluginStats = {
      total: files.length,
      tsx: 0,
      jsx: 0,
      ts: 0,
      js: 0,
      byDirective: {},
    }
    for (const file of files) {
      if (file.endsWith('.tsx')) stats.tsx++
      else if (file.endsWith('.jsx')) stats.jsx++
      else if (file.endsWith('.ts')) stats.ts++
      else if (file.endsWith('.js')) stats.js++

      const source = this.fileSystem.readFileSync(path.resolve(file))
      const directives = this.scanner.scan(source, file)
      const active: string[] = []
      if (directives.isReact) active.push('use react')
      if (directives.isDom) active.push('use dom')
      if (directives.isSnippet) active.push('use snippets')
      if (directives.isSections) active.push('use sections')
      const label = active.length > 0 ? active.join(', ') : 'none'
      stats.byDirective[label] = (stats.byDirective[label] || 0) + 1
    }
    return stats
  }

  private fail(error: unknown): never {
    const buildError = _match(error instanceof LiquidifyError)
      .with(true, () => error as LiquidifyError)
      .with(false, () => new LiquidifyError(error instanceof Error ? error.message : String(error)))
      .exec() as LiquidifyError
    _match(this.listenerCount('error') > 0)
      .with(true, () => this.emit('error', buildError))
      .with(false, () => undefined)
      .exec()
    throw buildError
  }

  private async buildProject(): Promise<void> {
    const files = (await glob(path.join(this.options.componentsDir, '**/*.{tsx,jsx,ts,js}'))).map((file) => path.resolve(file)).sort()
    const planning = _try.sync(() => this.dependencies.plan(files))
    this.watchedDependencies = new Set(this.dependencies.watchedFiles)
    const plan = planning.match({
      right: (value) => value,
      left: (error) => {
        throw error
      },
    })
    if (this.watcher) this.watcher.add(this.watchTargets())
    const registry = await this.registry.scan(files, plan.changed)
    const signature = JSON.stringify([...registry].sort((a, b) => (a[0] < b[0] ? -1 : 1)))
    const changed = this.registrySignature !== '' && signature !== this.registrySignature ? new Set(files) : plan.changed
    this.parser.setReactRegistry(registry)
    await this.refreshRuntime()
    await this.useCase.beginBuild(files, changed)
    const built = await _try.async(() => this.buildComponents(files.filter((file) => changed.has(file))))
    await built.match({
      right: () => this.useCase.finishBuild(),
      left: (error: unknown) =>
        this.useCase.abortBuild().then(() => {
          throw error
        }),
    })
    this.registrySignature = signature
    plan.commit()
  }

  private async refreshRuntime(): Promise<void> {
    const assetsDir = path.join(this.options.output, 'assets')
    if (!this.fileSystem.existsSync(assetsDir)) this.fileSystem.mkdirSync(assetsDir, true)
    if (this.runtimeScript === undefined) this.runtimeScript = await this.runtimeBuilder.build()
    const runtimePath = path.join(assetsDir, 'react-runtime.js')
    const stale = _try
      .sync(() => (this.fileSystem.existsSync(runtimePath) ? this.fileSystem.readFileSync(runtimePath) : null))
      .match({
        right: (current) => current !== this.runtimeScript,
        left: () => true,
      })
    if (stale) this.fileSystem.writeFileSync(runtimePath, this.runtimeScript as string)
  }

  private async buildComponents(files: string[]) {
    const results = await this.processFilesInParallel(files, async (file) => {
      const filePath = path.resolve(file)
      const source = this.fileSystem.readFileSync(filePath)
      const directives = this.scanner.scan(source, filePath)
      const skippable = (filePath.endsWith('.ts') || filePath.endsWith('.js')) && !directives.isDom && !directives.isSnippet
      if (!skippable) await this.useCase.execute(source, filePath)
    })
    const failures: Array<{ file: string; error: unknown }> = []
    for (const result of results) {
      if (result.error !== undefined) failures.push({ file: result.file, error: result.error })
    }
    _match(true)
      .with(failures.length === 1, () => {
        const single = failures[0] as { file: string; error: unknown }
        if (single.error instanceof LiquidifyError) throw single.error
        throw new LiquidifyError(
          `Failed to compile ${single.file}: ${single.error instanceof Error ? single.error.message : String(single.error)}`,
          single.file,
        )
      })
      .with(failures.length > 0, () => {
        const detail = failures.map((f) => `  - ${f.file}: ${f.error instanceof Error ? f.error.message : String(f.error)}`).join('\n')
        throw new LiquidifyError(`Failed to compile ${failures.length} file(s):\n${detail}`)
      })
      .with(true, () => undefined)
      .exec()
  }

  private async processFilesInParallel(
    files: string[],
    worker: (file: string) => Promise<void>,
    concurrency = BUILD_CONCURRENCY,
  ): Promise<Array<{ file: string; error?: unknown }>> {
    const results: Array<{ file: string; error?: unknown }> = new Array(files.length)
    let cursor = 0
    const runNext = async (): Promise<void> => {
      while (cursor < files.length) {
        const index = cursor
        cursor += 1
        const file = files[index] as string
        try {
          await worker(file)
          results[index] = { file }
        } catch (error) {
          results[index] = { file, error }
        }
      }
    }
    const workers = Array.from({ length: Math.min(concurrency, files.length) }, () => runNext())
    await Promise.all(workers)
    return results
  }

  public watch() {
    _match(this.watcher !== null)
      .with(true, () => undefined)
      .with(false, () => this.startWatching())
      .exec()
  }

  private startWatching(): void {
    this.disposed = false
    this.watcher = chokidar.watch(this.watchTargets(), {
      ignoreInitial: true,
      ignored: (file) => !this.isWatchedPath(file),
    })
    WATCH_EVENTS.forEach((event) => {
      this.watcher?.on(event, (file) => this.schedule(file))
    })
  }

  private watchTargets(): string[] {
    const ancestors = Array.from(this.watchedDependencies, (file) => this.nearestExisting(file))
    return Array.from(new Set([path.resolve(this.options.componentsDir), ...this.watchedDependencies, ...ancestors]))
  }

  private nearestExisting(file: string): string {
    let current = file
    for (let i = 0; i < 100; i++) {
      if (this.fileSystem.existsSync(current) || path.dirname(current) === current) return current
      current = path.dirname(current)
    }
    return current
  }

  private isWatchedPath(file: string): boolean {
    const absolute = path.resolve(file)
    const components = path.resolve(this.options.componentsDir)
    const inside =
      absolute === components || absolute.startsWith(`${components}${path.sep}`) || components.startsWith(`${absolute}${path.sep}`)
    return inside ? true : this.isWatchedDependency(absolute)
  }

  private isWatchedDependency(absolute: string): boolean {
    for (const dependency of this.watchedDependencies) {
      if (dependency === absolute || dependency.startsWith(`${absolute}${path.sep}`)) return true
    }
    return false
  }

  private schedule(file: string): void {
    if (!this.disposed) this.enqueue(file)
  }

  private enqueue(file: string): void {
    this.emit('file:change', file)
    this.clearTimer()
    this.timer = setTimeout(() => void this.runSerialized(), 200)
  }

  private clearTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer)
    this.timer = null
  }

  private takeWatcher(): FSWatcher | null {
    const watcher = this.watcher
    this.watcher = null
    return watcher
  }

  private async runSerialized(): Promise<void> {
    if (!this.disposed) await this.enqueueOrRun()
  }

  private enqueueOrRun(): Promise<void> | void {
    if (this.building) {
      this.queued = true
      return
    }
    return this.drainQueue()
  }

  private async drainQueue(): Promise<void> {
    this.building = true
    const result = await _try.async(() => this.runNext())
    this.building = false
    result.match({
      right: () => undefined,
      left: (error) => {
        throw error
      },
    })
  }

  private async runNext(): Promise<void> {
    this.queued = false
    const result = await _try.async(() => this.build())
    result.match({
      right: () => undefined,
      left: (error) => this.emit('build:failed', error),
    })
    if (this.queued && !this.disposed) await this.runNext()
  }

  public async dispose(): Promise<void> {
    this.disposed = true
    this.queued = false
    this.clearTimer()
    const watcher = this.takeWatcher()
    this.watchedDependencies.clear()
    if (watcher) await watcher.close()
    this.runtimeScript = undefined
    this.registrySignature = ''
  }

  public disposeSync(): void {
    this.disposed = true
    this.queued = false
    this.clearTimer()
    const watcher = this.takeWatcher()
    this.watchedDependencies.clear()
    if (watcher) watcher.close().catch((error: unknown) => this.reportCloseError(error))
    this.runtimeScript = undefined
    this.registrySignature = ''
  }

  private reportCloseError(error: unknown): void {
    this.logger.error('Failed to close watcher:', error instanceof Error ? error.message : String(error))
  }
}
