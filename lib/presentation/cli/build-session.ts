import { once } from 'node:events'
import chokidar, { type FSWatcher } from 'chokidar'
import { loadConfig, configWatchPaths } from '@adapters/config/config-loader'
import { makeLiquidifyBuilder } from '@main/factories/make-liquidify-builder'
import type { LiquidifyBuilder } from '@application/services/liquidify-builder'
import { SilentLogger } from '@shared/logger'
import type { ParsedCliArgs } from '@presentation/cli/args'
import type { BuildReporter } from '@presentation/cli/build-reporter'

export class BuildSession {
  private builder?: LiquidifyBuilder
  private configurationWatcher?: FSWatcher
  private pending: Promise<void> = Promise.resolve()
  private timer?: NodeJS.Timeout
  private closing = false

  constructor(
    private readonly options: ParsedCliArgs,
    private readonly reporter: BuildReporter,
  ) {}

  async start(): Promise<void> {
    if (this.options.watch) {
      this.configurationWatcher = chokidar.watch(configWatchPaths(process.cwd(), this.options.configPath), { ignoreInitial: true })
      for (const event of ['add', 'change', 'unlink'] as const) {
        this.configurationWatcher.on(event, () => {
          if (this.timer) clearTimeout(this.timer)
          this.timer = setTimeout(() => {
            void this.enqueueReload()
          }, 200)
        })
      }
      this.configurationWatcher.on('error', (error) => this.reporter.failure(error))
      await once(this.configurationWatcher, 'ready')
    }
    await this.enqueueReload()
  }

  async dispose(): Promise<void> {
    this.closing = true
    if (this.timer) clearTimeout(this.timer)
    await this.configurationWatcher?.close()
    await this.pending
    await this.builder?.dispose()
  }

  private enqueueReload(): Promise<void> {
    this.pending = this.pending
      .then(() => this.reload())
      .catch((error: unknown) => {
        this.reporter.failure(error)
        if (!this.options.watch) process.exitCode = 1
      })
    return this.pending
  }

  private async reload(): Promise<void> {
    if (this.closing) return
    const configuration = loadConfig(process.cwd(), this.options.configPath, { plugins: !this.options.noPlugins })
    if (this.options.force) configuration.force = true
    if (this.options.concurrency !== undefined) configuration.concurrency = this.options.concurrency
    if (this.options.mode) configuration.mode = this.options.mode
    if (this.options.sourcemap) configuration.sourcemap = true
    const replacement = makeLiquidifyBuilder(configuration, { logger: new SilentLogger() })
    await this.builder?.dispose()
    this.builder = replacement
    if (this.closing) return
    replacement.on('build:end', (result) => this.reporter.success(result))
    replacement.on('error', (error) => this.reporter.failure(error))
    if (this.options.watch) {
      replacement.watch()
      await once(replacement, 'watch:ready')
    }
    try {
      await replacement.build()
    } catch {
      if (!this.options.watch) process.exitCode = 1
    }
  }
}
