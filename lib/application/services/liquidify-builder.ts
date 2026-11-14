import type { DependencyTracker } from './dependency-tracker'
import { _match, _try } from 'funcio'
import { EventEmitter } from 'node:events'
import type { FSWatcher } from 'chokidar'
import { glob } from 'glob'
import chokidar from 'chokidar'
import path from 'node:path'
import type { LiquidifyPlugin, PluginStats } from '../../core/protocols/plugin'

import type { ComponentRegistry, DirectiveScanner } from './component-registry'
import type { BabelLiquidParser } from '../../infra/adapters/parsers/babel/babel-parser'
import type { ReactRuntimeBuilder } from '../../infra/adapters/compilers/react/runtime/runtime-builder'
import type { TranspileFileUseCase } from './transpile-file'
import type { IFileSystem } from '../../core/protocols/file-system'
import { LiquidifyError } from '../../core/errors/liquidify-error'
import type { Logger } from '../../shared/logger'
import { collectBuildStatistics } from './build-statistics'
import { processFilesInParallel } from './parallel-files'
import type { ProjectBuildResult, BuildRequest } from '../../core/entities/build-result'

const WATCH_EVENTS = ['add', 'change', 'unlink', 'addDir', 'unlinkDir'] as const

export class LiquidifyBuilder extends EventEmitter {
  private buildQueue: Promise<unknown> = Promise.resolve()
  private buildFiles: string[] = []
  private rebuiltFiles: string[] = []
  private watcher: FSWatcher | null = null
  private timer: NodeJS.Timeout | null = null
  private building = false
  private queued = false
  private disposed = false
  private registrySignature = ''
  private runtimeScript?: string
  private watchedDependencies = new Set<string>()
  private pluginContext: { onBuildEnd: (stats: PluginStats) => Promise<void> }[] = []

  constructor(
    private readonly options: { componentsDir: string; output: string; concurrency?: number },
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
    const callbacks: Array<(stats: PluginStats) => void | Promise<void>> = []
    const ctx = {
      onBuildEnd: (callback: (stats: PluginStats) => void | Promise<void>) => {
        callbacks.push(callback)
      },
    }
    plugin.setup(ctx)
    this.pluginContext.push({
      onBuildEnd: async (stats: PluginStats) => {
        for (const callback of callbacks) await callback(stats)
      },
    })
  }

  build(request: BuildRequest = {}): Promise<ProjectBuildResult> {
    if (this.disposed) return Promise.reject(new LiquidifyError('Cannot build a disposed builder.'))
    const pending = this.buildQueue.then(() => this.executeBuild(request))
    this.buildQueue = pending.catch(() => undefined)
    return pending
  }

  private async executeBuild(request: BuildRequest): Promise<ProjectBuildResult> {
    const startedAt = performance.now()
    try {
      request.signal?.throwIfAborted()
      this.emit('build:start')
      await this.buildProject(request)
      await this.notifyBuildEnd()
      const result: ProjectBuildResult = {
        durationMs: performance.now() - startedAt,
        files: [...this.buildFiles],
        rebuilt: [...this.rebuiltFiles],
        skipped: this.buildFiles.filter((file) => !this.rebuiltFiles.includes(file)),
        diagnostics: [],
      }
      this.emit('build:end', result)
      return result
    } catch (error) {
      return this.fail(error)
    }
  }

  private async notifyBuildEnd(): Promise<void> {
    if (this.pluginContext.length === 0) return
    const statistics = collectBuildStatistics(this.buildFiles, this.fileSystem, this.scanner)
    for (const plugin of this.pluginContext) await plugin.onBuildEnd(statistics)
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

  private async buildProject(request: BuildRequest): Promise<void> {
    const files = (await glob(path.join(this.options.componentsDir, '**/*.{tsx,jsx,ts,js}'))).map((file) => path.resolve(file)).sort()
    this.buildFiles = files
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
    await this.useCase.beginBuild(files, changed)
    this.rebuiltFiles = files.filter((file) => changed.has(file))
    const built = await _try.async(async () => {
      request.signal?.throwIfAborted()
      await this.refreshRuntime()
      await this.buildComponents(this.rebuiltFiles)
      request.signal?.throwIfAborted()
    })
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
    if (this.runtimeScript === undefined) this.runtimeScript = await this.runtimeBuilder.build()
    await this.useCase.stageRuntime(this.runtimeScript)
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
    concurrency = this.options.concurrency,
  ): Promise<Array<{ file: string; error?: unknown }>> {
    return processFilesInParallel(files, worker, concurrency)
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
    await this.buildQueue
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
