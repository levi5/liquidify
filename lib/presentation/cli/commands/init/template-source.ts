import fs from 'node:fs'
import path from 'node:path'
import { normalizeTemplateName } from './arguments'

export function resolveTemplate(templateName = 'theme'): string {
  const normalized = normalizeTemplateName(templateName)
  const candidates = [
    path.resolve(__dirname, '../../../../../resources/templates', normalized),
    path.resolve(__dirname, '../../../../resources/templates', normalized),
    path.resolve(process.cwd(), 'resources/templates', normalized),
    path.resolve(process.cwd(), 'templates', normalized),
  ]
  for (const directory of candidates) {
    if (fs.existsSync(directory) && !fs.lstatSync(directory).isSymbolicLink() && fs.existsSync(path.join(directory, 'package.json')))
      return directory
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
    if (!fs.existsSync(filename)) continue
    const metadata = JSON.parse(fs.readFileSync(filename, 'utf8')) as { name?: string; version?: string }
    if (metadata.name === 'liquidify' && metadata.version) return `^${metadata.version}`
  }
  return '^1.1.0-alpha.4'
}

export function configureTemplate(directory: string, projectName: string): void {
  const packagePath = path.join(directory, 'package.json')
  if (fs.existsSync(packagePath)) {
    const metadata = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as { name?: string; dependencies?: Record<string, string> }
    metadata.name = projectName
    if (metadata.dependencies?.liquidify?.startsWith('file:')) metadata.dependencies.liquidify = packageVersion()
    fs.writeFileSync(packagePath, `${JSON.stringify(metadata, null, 2)}\n`)
  }
  const typescriptPath = path.join(directory, 'tsconfig.json')
  if (fs.existsSync(typescriptPath)) {
    const configuration = JSON.parse(fs.readFileSync(typescriptPath, 'utf8'))
    const paths = configuration.compilerOptions?.paths
    if (paths) {
      delete paths.liquidify
      delete paths.liquidex
      if (Object.keys(paths).length === 0) delete configuration.compilerOptions.paths
    }
    fs.writeFileSync(typescriptPath, `${JSON.stringify(configuration, null, 2)}\n`)
  }
}
