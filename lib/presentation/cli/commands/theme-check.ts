import { loadConfig } from '@adapters/config/config-loader'
import { runShopifyThemeCheck } from '@adapters/shopify/theme-check'
import type { ParsedCliArgs } from '@presentation/cli/args'

export async function runThemeCheck(options: ParsedCliArgs): Promise<void> {
  const configuration = loadConfig(process.cwd(), options.configPath, { plugins: false })
  const result = await runShopifyThemeCheck(configuration.output)
  if (options.json) console.log(JSON.stringify({ status: result.exitCode === 0 ? 'success' : 'error', themeCheck: result }))
  else {
    if (!options.quiet && result.stdout) console.log(result.stdout.trimEnd())
    if (result.stderr) console.error(result.stderr.trimEnd())
  }
  if (result.exitCode !== 0) process.exitCode = 1
}
