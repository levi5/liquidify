import fs from 'node:fs'
import path from 'node:path'
import { loadConfig } from '@adapters/config/config-loader'
import type { ParsedCliArgs } from '@presentation/cli/args'

export async function runDoctor(options: ParsedCliArgs): Promise<void> {
  const configuration = loadConfig(process.cwd(), options.configPath, { plugins: false })
  const checks = [
    { name: 'Node.js >= 22', success: Number(process.versions.node.split('.')[0]) >= 22, detail: process.version },
    {
      name: 'Components directory',
      success: fs.existsSync(configuration.componentsDir) && fs.statSync(configuration.componentsDir).isDirectory(),
      detail: path.resolve(configuration.componentsDir),
    },
    {
      name: 'Strict CSP',
      success: configuration.react?.strictCsp !== false,
      detail: configuration.react?.strictCsp === false ? 'disabled' : 'enabled',
    },
  ]
  const success = checks.every((check) => check.success)
  if (options.json) console.log(JSON.stringify({ status: success ? 'success' : 'error', checks }))
  else for (const check of checks) console.log(`${check.success ? 'OK' : 'FAIL'} ${check.name}: ${check.detail}`)
  if (!success) process.exitCode = 1
}
