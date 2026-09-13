import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

export const themeRoot = fileURLToPath(new URL('../', import.meta.url))

export async function buildAssets() {
  await build({
    absWorkingDir: themeRoot,
    entryPoints: {
      theme: 'src/scripts/theme.ts',
      global: 'src/styles/theme.css',
    },
    outdir: 'assets',
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: ['es2020'],
    minify: true,
    charset: 'utf8',
    legalComments: 'none',
    logLevel: 'info',
  })
}
