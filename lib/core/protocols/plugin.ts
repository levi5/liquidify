export interface PluginStats {
  total: number
  tsx: number
  jsx: number
  ts: number
  js: number
  byDirective: Record<string, number>
}

export interface PluginContext {
  onBuildEnd(callback: (stats: PluginStats) => void): void
}

export interface LiquidifyPlugin {
  name: string
  setup(ctx: PluginContext): void
}
