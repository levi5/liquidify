import type { LiquidifyPlugin, PluginStats } from '../../../core/protocols/plugin'

export const tsxStatsPlugin: LiquidifyPlugin = {
  name: 'tsx-stats',
  setup(ctx) {
    ctx.onBuildEnd((stats: PluginStats) => {
      console.log('\n📊 TSX Statistics:')
      console.log(`   Total files: ${stats.total}`)
      console.log(`   .tsx: ${stats.tsx}  .jsx: ${stats.jsx}  .ts: ${stats.ts}  .js: ${stats.js}`)
      const directives = Object.entries(stats.byDirective)
      if (directives.length > 0) {
        console.log('   Directives:')
        for (const [name, count] of directives) console.log(`     ${name}: ${count}`)
      }
    })
  },
}
