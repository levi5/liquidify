import type { ParsedComponent } from '../entities/parsed-component'
import type { Logger } from './logger'

export interface PluginStats {
  total: number
  tsx: number
  jsx: number
  ts: number
  js: number
  byDirective: Record<string, number>
}

export interface PluginContext {
  readonly logger: Logger
  onBuildEnd(callback: (stats: PluginStats) => void | Promise<void>): void
  onBuildStart(callback: () => void | Promise<void>): void
  onBuildError(callback: (error: unknown) => void | Promise<void>): void
  onGenerate(callback: (component: ParsedComponent, filename?: string) => void | Promise<void>): void
  onDispose(callback: () => void | Promise<void>): void
}

export interface LiquidifyPlugin {
  name: string
  setup(ctx: PluginContext): void
}
