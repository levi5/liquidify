import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs/promises'

export interface ThemeCheckResult {
  exitCode: number
  stdout: string
  stderr: string
}

/** Uses an already-installed Shopify CLI. Never installs packages or accesses a store. */
export async function runShopifyThemeCheck(directory: string, signal?: AbortSignal): Promise<ThemeCheckResult> {
  const themeRoot = path.resolve(directory)
  if (!(await fs.stat(themeRoot)).isDirectory()) throw new Error(`Theme output is not a directory: ${themeRoot}`)
  return new Promise((resolve, reject) => {
    const child = spawn('shopify', ['theme', 'check', '--path', themeRoot, '--output', 'json', '--fail-level', 'error'], {
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      signal,
    })
    let stdout = ''
    let stderr = ''
    let outputBytes = 0
    const receive = (channel: 'stdout' | 'stderr', chunk: Buffer): void => {
      outputBytes += chunk.length
      if (outputBytes > 5 * 1024 * 1024) {
        child.kill()
        reject(new Error('Shopify Theme Check output exceeds 5 MiB.'))
        return
      }
      if (channel === 'stdout') stdout += chunk.toString()
      else stderr += chunk.toString()
    }
    child.stdout.on('data', (chunk: Buffer) => receive('stdout', chunk))
    child.stderr.on('data', (chunk: Buffer) => receive('stderr', chunk))
    child.on('error', (error: NodeJS.ErrnoException) => {
      reject(error.code === 'ENOENT' ? new Error('Shopify CLI is not installed. Install it before running liquidify theme-check.') : error)
    })
    child.on('close', (exitCode) => resolve({ exitCode: exitCode ?? 1, stdout, stderr }))
  })
}
