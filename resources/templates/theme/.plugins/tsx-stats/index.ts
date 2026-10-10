import type { LiquidifyPlugin, PluginStats } from 'liquidify'

const tsxStatsPlugin: LiquidifyPlugin = {
  name: 'tsx-stats',
  setup(ctx) {
    ctx.onBuildEnd((stats: PluginStats) => {
      console.log('\n[tsx-stats] Build complete:')
      console.log(`  Total files: ${stats.total}`)
      console.log(`  .tsx: ${stats.tsx}  .jsx: ${stats.jsx}  .ts: ${stats.ts}  .js: ${stats.js}`)
      const directives = Object.entries(stats.byDirective)
      if (directives.length > 0) {
        console.log('  Directives:')
        directives.forEach(([name, count]) => console.log(`    ${name}: ${count}`))
      }
    })
  },
}

export default tsxStatsPlugin
