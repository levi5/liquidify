import type { LiquidifyPlugin, PluginStats } from '@core/protocols/plugin'

export const tsxStatsPlugin: LiquidifyPlugin = {
  name: 'tsx-stats',
  setup(context) {
    context.onBuildEnd((stats: PluginStats) => {
      context.logger.info('\n📊 TSX Statistics:')
      context.logger.info(`   Total files: ${stats.total}`)
      context.logger.info(`   .tsx: ${stats.tsx}  .jsx: ${stats.jsx}  .ts: ${stats.ts}  .js: ${stats.js}`)
      const directives = Object.entries(stats.byDirective)
      if (directives.length > 0) {
        context.logger.info('   Directives:')
        for (const [name, count] of directives) context.logger.info(`     ${name}: ${count}`)
      }
    })
  },
}
