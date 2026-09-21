import path from 'node:path'
import { parseExpression } from '@babel/parser'
import { _try } from 'funcio'
import type { IFileSystem } from '../../../core/protocols/file-system'
import { ValidationError } from '../../../core/errors/validation-error'

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss']

// tsconfig accepts comments and trailing commas, which Babel handles without evaluating code.
function configValue(node: any): any {
  if (node.type === 'ObjectExpression') {
    return Object.fromEntries(
      node.properties
        .filter((property: any) => property.type === 'ObjectProperty')
        .map((property: any) => [property.key.name ?? property.key.value, configValue(property.value)]),
    )
  }
  if (node.type === 'ArrayExpression') return node.elements.map(configValue)
  return node.value
}

export class ModuleResolver {
  constructor(private readonly fs: IFileSystem) {}

  public candidates(specifier: string, importer: string): string[] {
    const bases: string[] = []
    if (specifier.startsWith('.') || path.isAbsolute(specifier)) {
      bases.push(path.resolve(path.dirname(importer), specifier))
    } else {
      const configPath = this.findConfig(importer)
      if (configPath) {
        const config = this.readConfig(configPath)
        const base = config.baseUrl
        const aliases = Object.entries(config.paths).sort(([a], [b]) => b.replace('*', '').length - a.replace('*', '').length)
        for (const [pattern, targets] of aliases) {
          const [prefix, suffix = ''] = pattern.split('*')
          const wildcard = pattern.includes('*')
          if (wildcard ? specifier.startsWith(prefix) && specifier.endsWith(suffix) : specifier === pattern) {
            const middle = wildcard ? specifier.slice(prefix.length, specifier.length - suffix.length) : ''
            for (const target of targets) bases.push(path.resolve(base, target.replace('*', middle)))
            break
          }
        }
        if (!bases.length) bases.push(path.resolve(base, specifier))
      }
    }
    return bases.flatMap((base) => [
      base,
      ...extensions.map((ext) => base + ext),
      ...extensions.map((ext) => path.join(base, `index${ext}`)),
    ])
  }

  public resolve(specifier: string, importer: string): string | null {
    return (
      this.candidates(specifier, importer).find(
        (file) => this.fs.existsSync(file) && _try.sync(() => this.fs.readFileSync(file)).isRight(),
      ) ?? null
    )
  }

  public findConfig(importer: string): string | null {
    let directory = path.dirname(path.resolve(importer))
    while (true) {
      const file = path.join(directory, 'tsconfig.json')
      if (this.fs.existsSync(file)) return file
      const parent = path.dirname(directory)
      if (parent === directory) return null
      directory = parent
    }
  }

  public configFiles(importer: string): string[] {
    const config = this.findConfig(importer)
    if (!config) return []
    const visited = new Set<string>()
    this.readConfig(config, visited)
    return [...visited]
  }

  private readConfig(file: string, visited = new Set<string>()): { baseUrl: string; paths: Record<string, string[]> } {
    if (visited.has(file)) throw new ValidationError('Circular tsconfig extends chain.', file)
    visited.add(file)
    const result = _try.sync(() => configValue(parseExpression(this.fs.readFileSync(file))))
    const config = result.match({
      right: (value) => value,
      left: (error) => {
        throw new ValidationError(`Invalid tsconfig: ${error.message}`, file)
      },
    })
    let inherited = { baseUrl: path.dirname(file), paths: {} as Record<string, string[]> }
    if (typeof config.extends === 'string' && config.extends.startsWith('.')) {
      const parent = path.resolve(path.dirname(file), config.extends)
      inherited = this.readConfig(parent.endsWith('.json') ? parent : `${parent}.json`, visited)
    }
    const options = config.compilerOptions ?? {}
    return {
      baseUrl: options.baseUrl ? path.resolve(path.dirname(file), options.baseUrl) : inherited.baseUrl,
      paths: options.paths ?? inherited.paths,
    }
  }
}
