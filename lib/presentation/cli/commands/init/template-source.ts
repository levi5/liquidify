import fs from 'node:fs'
import path from 'node:path'
import { normalizeTemplateName } from '@presentation/cli/commands/init/arguments'

function readOptionalFile(filename: string): string | undefined {
  try {
    return fs.readFileSync(filename, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

function readOptionalJson<T>(filename: string): T | undefined {
  const content = readOptionalFile(filename)
  return content === undefined ? undefined : (JSON.parse(content) as T)
}

export function resolveTemplate(templateName = 'theme'): string {
  const normalized = normalizeTemplateName(templateName)
  const candidates = [
    path.resolve(__dirname, '../../../../../resources/templates', normalized),
    path.resolve(__dirname, '../../../../resources/templates', normalized),
    path.resolve(process.cwd(), 'resources/templates', normalized),
    path.resolve(process.cwd(), 'templates', normalized),
  ]
  for (const directory of candidates) {
    const stats = fs.lstatSync(directory, { throwIfNoEntry: false })
    if (!stats || stats.isSymbolicLink() || !stats.isDirectory()) continue
    if (readOptionalFile(path.join(directory, 'package.json')) !== undefined) return directory
  }
  throw new Error(`Template "${normalized}" not found. Searched: ${candidates.join(', ')}`)
}

function packageVersion(): string {
  const candidates = [
    path.resolve(__dirname, '../../../../../package.json'),
    path.resolve(__dirname, '../../../../package.json'),
    path.resolve(process.cwd(), 'package.json'),
  ]
  for (const filename of candidates) {
    const metadata = readOptionalJson<{ name?: string; version?: string }>(filename)
    if (metadata?.name === 'liquidify' && metadata.version) return `^${metadata.version}`
  }
  return '^1.1.0-alpha.4'
}

export function configureTemplate(directory: string, projectName: string): void {
  const packagePath = path.join(directory, 'package.json')
  const metadata = readOptionalJson<{ name?: string; dependencies?: Record<string, string> }>(packagePath)
  if (metadata) {
    metadata.name = projectName
    if (metadata.dependencies?.liquidify?.startsWith('file:')) metadata.dependencies.liquidify = packageVersion()
    fs.writeFileSync(packagePath, `${JSON.stringify(metadata, null, 2)}\n`)
  }
  const typescriptPath = path.join(directory, 'tsconfig.json')
  const configuration = readOptionalJson<{ compilerOptions?: { paths?: Record<string, string> } }>(typescriptPath)
  if (configuration) {
    const compilerOptions = configuration.compilerOptions
    const paths = compilerOptions?.paths
    if (compilerOptions && paths) {
      delete paths.liquidify
      delete paths.liquidex
      if (Object.keys(paths).length === 0) delete compilerOptions.paths
    }
    fs.writeFileSync(typescriptPath, `${JSON.stringify(configuration, null, 2)}\n`)
  }
}
