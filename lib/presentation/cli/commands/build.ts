import type { DependencyTracker } from '../../../application/services/dependency-tracker'
import { _match, _try, _Array } from 'funcio'
import { EventEmitter } from 'node:events'
import type { FSWatcher } from 'chokidar'
import { glob } from 'glob'
import chokidar from 'chokidar'
import path from 'node:path'

import type { ComponentRegistry, DirectiveScanner } from '../../../application/services/component-registry'
import type { BabelLiquidParser } from '../../../infra/adapters/parsers/babel/babel-parser'
import type { ReactRuntimeBuilder } from '../../../infra/adapters/compilers/react/runtime/runtime-builder'
import type { TranspileFileUseCase } from '../../../application/services/transpile-file'
import type { IFileSystem } from '../../../core/protocols/file-system'
import { LiquidifyError } from '../../../core/errors/liquidify-error'
import type { Logger } from '../../../shared/logger'

const WATCH_EVENTS = ['add', 'change', 'unlink', 'addDir', 'unlinkDir'] as const

export class LiquidifyBuilder extends EventEmitter {
  private watcher: FSWatcher | null = null
  private timer: NodeJS.Timeout | null = null
  private building = false
  private queued = false
  private disposed = false
  private registrySignature = ''
  private runtimeScript?: string
  private watchedDependencies = new Set<string>()

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

  async build() {
    this.emit('build:start')
    const result = await _try.async(() => this.buildProject())
    result.match({
      right: () => this.emit('build:end'),
      left: (error) => this.fail(error),
    })
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
    const watcher = this.watcher
    _match(watcher === null)
      .with(true, () => undefined)
      .with(false, () => (watcher as FSWatcher).add(this.watchTargets()))
      .exec()
    const plan = planning.match({
      right: (value) => value,
      left: (error) => {
        throw error
      },
    })
    const registry = await this.registry.scan(files, plan.changed)
    const signature = JSON.stringify([...registry])
    const changed = _match(this.registrySignature !== '' && signature !== this.registrySignature)
      .with(true, () => new Set(files))
      .with(false, () => plan.changed)
      .exec() as Set<string>
    this.parser.setReactRegistry(registry)
    await this.refreshRuntime()
    await this.useCase.beginBuild(files, changed)
    await this.buildComponents(files.filter((file) => changed.has(file)))
    await this.useCase.finishBuild()
    this.registrySignature = signature
    plan.commit()
  }

  private async refreshRuntime(): Promise<void> {
    const assetsDir = path.join(this.options.output, 'assets')
    _match(this.fileSystem.existsSync(assetsDir))
      .with(true, () => undefined)
      .with(false, () => this.fileSystem.mkdirSync(assetsDir, true))
      .exec()
    this.runtimeScript = await _match(this.runtimeScript === undefined)
      .with(true, () => this.runtimeBuilder.build())
      .with(false, () => Promise.resolve(this.runtimeScript as string))
      .exec()
    const runtimePath = path.join(assetsDir, 'react-runtime.js')
    _match(this.fileSystem.existsSync(runtimePath) && this.fileSystem.readFileSync(runtimePath) === this.runtimeScript)
      .with(true, () => undefined)
      .with(false, () => this.fileSystem.writeFileSync(runtimePath, this.runtimeScript as string))
      .exec()
  }

  private async buildComponents(files: string[]) {
    await _Array.forEachAsync(files, async (file) => {
      const filePath = path.resolve(file)
      const source = this.fileSystem.readFileSync(filePath)
      const directives = this.scanner.scan(source, filePath)
      const skippable = (filePath.endsWith('.ts') || filePath.endsWith('.js')) && !directives.isDom && !directives.isSnippet
      await _match(skippable)
        .with(true, () => undefined)
        .with(false, () => this.useCase.execute(source, filePath))
        .exec()
    })
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
    return _match(this.fileSystem.existsSync(file) || path.dirname(file) === file)
      .with(true, () => file)
      .with(false, () => this.nearestExisting(path.dirname(file)))
      .exec() as string
  }

  private isWatchedPath(file: string): boolean {
    const absolute = path.resolve(file)
    const components = path.resolve(this.options.componentsDir)
    return _match(
      absolute === components || absolute.startsWith(`${components}${path.sep}`) || components.startsWith(`${absolute}${path.sep}`),
    )
      .with(true, () => true)
      .with(false, () => this.isWatchedDependency(absolute))
      .exec() as boolean
  }

  private isWatchedDependency(absolute: string): boolean {
    return Array.from(this.watchedDependencies).some(
      (dependency) => dependency === absolute || dependency.startsWith(`${absolute}${path.sep}`),
    )
  }

  private schedule(file: string): void {
    _match(this.disposed)
      .with(true, () => undefined)
      .with(false, () => this.enqueue(file))
      .exec()
  }

  private enqueue(file: string): void {
    this.emit('file:change', file)
    this.clearTimer()
    this.timer = setTimeout(() => void this.runSerialized(), 200)
  }

  private clearTimer(): void {
    const timer = this.timer
    _match(timer === null)
      .with(true, () => undefined)
      .with(false, () => clearTimeout(timer as NodeJS.Timeout))
      .exec()
    this.timer = null
  }

  private takeWatcher(): FSWatcher | null {
    const watcher = this.watcher
    this.watcher = null
    return watcher
  }

  private async runSerialized(): Promise<void> {
    await _match(this.disposed)
      .with(true, () => undefined)
      .with(false, () => this.enqueueOrRun())
      .exec()
  }

  private enqueueOrRun(): Promise<void> | void {
    return _match(this.building)
      .with(true, () => {
        this.queued = true
      })
      .with(false, () => this.drainQueue())
      .exec() as Promise<void> | void
  }

  private async drainQueue(): Promise<void> {
    this.building = true
    try {
      await this.runNext()
    } finally {
      this.building = false
    }
  }

  private async runNext(): Promise<void> {
    this.queued = false
    const result = await _try.async(() => this.build())
    result.match({
      right: () => undefined,
      left: (error) => this.emit('build:failed', error),
    })
    await _match(this.queued && !this.disposed)
      .with(true, () => this.runNext())
      .with(false, () => undefined)
      .exec()
  }

  public async dispose(): Promise<void> {
    this.disposed = true
    this.queued = false
    this.clearTimer()
    const watcher = this.takeWatcher()
    this.watchedDependencies.clear()
    await _match(watcher === null)
      .with(true, () => undefined)
      .with(false, () => (watcher as FSWatcher).close())
      .exec()
  }

  public disposeSync(): void {
    this.disposed = true
    this.queued = false
    this.clearTimer()
    const watcher = this.takeWatcher()
    this.watchedDependencies.clear()
    _match(watcher === null)
      .with(true, () => undefined)
      .with(false, () => (watcher as FSWatcher).close().catch((error: unknown) => this.reportCloseError(error)))
      .exec()
  }

  private reportCloseError(error: unknown): void {
    this.logger.error('Failed to close watcher:', error instanceof Error ? error.message : String(error))
  }
}
