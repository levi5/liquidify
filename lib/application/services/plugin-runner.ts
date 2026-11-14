import type { LiquidifyPlugin, PluginContext, PluginStats } from '@core/protocols/plugin'
import type { ParsedComponent } from '@core/entities/parsed-component'
import type { Logger } from '@core/protocols/logger'
import { SilentLogger } from '@shared/logger'

export class PluginRunner {
  private readonly starts: Array<() => void | Promise<void>> = []
  private readonly ends: Array<(statistics: PluginStats) => void | Promise<void>> = []
  private readonly failures: Array<(error: unknown) => void | Promise<void>> = []
  private readonly generators: Array<(component: ParsedComponent, filename?: string) => void | Promise<void>> = []
  private readonly disposers: Array<() => void | Promise<void>> = []
  private disposed = false

  constructor(private readonly logger: Logger = new SilentLogger()) {}

  register(plugin: LiquidifyPlugin): void {
    if (this.disposed) throw new Error('Cannot register plugins after disposal.')
    const context: PluginContext = {
      logger: this.logger,
      onBuildStart: (callback) => {
        this.starts.push(callback)
      },
      onBuildEnd: (callback) => {
        this.ends.push(callback)
      },
      onBuildError: (callback) => {
        this.failures.push(callback)
      },
      onGenerate: (callback) => {
        this.generators.push(callback)
      },
      onDispose: (callback) => {
        this.disposers.push(callback)
      },
    }
    plugin.setup(context)
  }

  get needsStatistics(): boolean {
    return this.ends.length > 0
  }

  async start(): Promise<void> {
    for (const callback of this.starts) await callback()
  }

  async end(statistics: PluginStats): Promise<void> {
    for (const callback of this.ends) await callback(statistics)
  }

  async failed(error: unknown): Promise<void> {
    for (const callback of this.failures) await callback(error)
  }

  async generate(component: ParsedComponent, filename?: string): Promise<void> {
    for (const callback of this.generators) await callback(component, filename)
  }

  async dispose(): Promise<void> {
    if (this.disposed) return
    this.disposed = true
    const failures: unknown[] = []
    for (const callback of this.disposers.slice().reverse()) {
      try {
        await callback()
      } catch (error) {
        failures.push(error)
      }
    }
    if (failures.length) throw new Error(`Plugin cleanup failed: ${failures.map(String).join('; ')}`)
  }
}
