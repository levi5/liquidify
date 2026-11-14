import { EventEmitter } from 'node:events'
import type { LiquidifyPlugin } from '@core/protocols/plugin'
import type { BuildWatcher, BuildWatcherFactory } from '@core/protocols/build-watcher'
import type { ProjectBuildResult, BuildRequest } from '@core/entities/build-result'
import type { BuilderEvents } from '@core/entities/builder-events'
import { LiquidifyError } from '@core/errors/liquidify-error'
import type { Logger } from '@shared/logger'
import type { ProjectBuildPipeline } from '@application/services/project-build-pipeline'
import { PluginRunner } from '@application/services/plugin-runner'
import { BuildDiagnostics } from '@application/services/build-diagnostics'

export class LiquidifyBuilder extends EventEmitter<BuilderEvents> {
  private buildQueue: Promise<unknown> = Promise.resolve()
  private readonly projectWatcher: BuildWatcher
  private disposed = false

  constructor(
    private readonly pipeline: ProjectBuildPipeline,
    createWatcher: BuildWatcherFactory,
    private readonly logger: Logger,
    private readonly plugins = new PluginRunner(),
    private readonly diagnostics = new BuildDiagnostics(),
  ) {
    super()
    this.projectWatcher = createWatcher({
      build: () => this.build(),
      changed: (filename) => this.emit('file:change', filename),
      failed: (error) => this.emit('build:failed', error),
      ready: () => this.emit('watch:ready'),
    })
  }

  registerPlugin(plugin: LiquidifyPlugin): void {
    this.plugins.register(plugin)
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
      this.diagnostics.clear()
      request.signal?.throwIfAborted()
      this.emit('build:start')
      await this.plugins.start()
      await this.buildProject(request)
      if (this.plugins.needsStatistics) await this.plugins.end(this.pipeline.statistics())
      const rebuilt = new Set(this.pipeline.rebuilt)
      const result: ProjectBuildResult = {
        durationMs: performance.now() - startedAt,
        files: [...this.pipeline.files],
        rebuilt: [...rebuilt],
        skipped: this.pipeline.files.filter((filename) => !rebuilt.has(filename)),
        diagnostics: this.diagnostics.snapshot(),
        outputFiles: this.useCase.outputFiles,
      }
      this.emit('build:end', result)
      return result
    } catch (error) {
      await this.plugins.failed(error).catch((hookError: unknown) => this.logger.error('Plugin error hook failed:', hookError))
      const failure = error instanceof LiquidifyError ? error : new LiquidifyError(error instanceof Error ? error.message : String(error))
      if (this.listenerCount('error')) this.emit('error', failure)
      throw failure
    }
  }

  private buildProject(request: BuildRequest): Promise<void> {
    return this.pipeline.run(request, (dependencies) => this.projectWatcher.update(dependencies))
  }

  watch(): void {
    if (this.disposed) throw new LiquidifyError('Cannot watch a disposed builder.')
    this.projectWatcher.start()
  }

  async dispose(): Promise<void> {
    this.disposed = true
    await this.projectWatcher.close()
    await this.buildQueue
    await this.plugins.dispose()
    this.pipeline.clear()
  }

  disposeSync(): void {
    void this.dispose().catch((error: unknown) => this.logger.error('Failed to dispose builder:', error))
  }

  get watcher() {
    return this.projectWatcher.handle
  }
  get useCase() {
    return this.pipeline.useCase
  }
  get watchedDependencies() {
    return this.pipeline.dependencies.watchedFiles
  }
  runSerialized(): Promise<void> {
    return this.projectWatcher.runSerialized()
  }
}
