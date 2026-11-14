import fs from 'node:fs/promises'
import path from 'node:path'
import { loadConfig } from '../../../infra/adapters/config/config-loader'
import { NodeFileSystem } from '../../../infra/adapters/fs/node-file-system'
import type { ParsedCliArgs } from '../args'

const DIRECTORIES: Record<string, string> = { section: 'sections', snippet: 'snippets', island: 'islands' }

export async function runGenerate(options: ParsedCliArgs): Promise<void> {
  const [kind, name, ...extra] = options.initArgs
  if (!Object.keys(DIRECTORIES).includes(kind ?? '') || !/^[A-Z][a-zA-Z0-9]*$/.test(name ?? '') || extra.length) {
    throw new Error('Usage: liquidify generate <section|snippet|island> <PascalCaseName>')
  }
  const configuration = loadConfig(process.cwd(), options.configPath, { plugins: false })
  const root = path.resolve(configuration.componentsDir)
  const filename = path.join(root, DIRECTORIES[kind], `${name}.tsx`)
  const fileSystem = new NodeFileSystem(root)
  fileSystem.assertSafePath(filename, root)
  const directive = kind === 'island' ? '"use react"' : kind === 'snippet' ? '"use snippets"' : '"use sections"'
  const schema = kind === 'section' ? `\nexport const schema = { name: '${name}', settings: [], presets: [{ name: '${name}' }] }\n` : ''
  const source = `${directive}\n\nexport default function ${name}() {\n  return <div>${name}</div>\n}\n${schema}`
  if (!options.dryRun) {
    await fs.mkdir(path.dirname(filename), { recursive: true })
    fileSystem.assertSafePath(filename, root)
    // Exclusive creation avoids overwriting user components, including concurrent generation.
    await fs.writeFile(filename, source, { flag: 'wx' })
  }
  if (options.json) console.log(JSON.stringify({ status: 'success', filename, dryRun: options.dryRun ?? false }))
  else if (!options.quiet) console.log(`${options.dryRun ? 'Would create' : 'Created'} ${filename}`)
}
