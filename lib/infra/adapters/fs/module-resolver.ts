import path from 'node:path'
import { parseExpression } from '@babel/parser'
import { _match, _pipe, _try } from 'funcio'
import type { IFileSystem } from '../../../core/protocols/file-system'
import { ValidationError } from '../../../core/errors/validation-error'
import { SOURCE_EXTENSIONS as extensions } from '../../../shared/liquid-constants'

interface ResolvedConfig {
  baseUrl?: string
  pathsBasePath: string
  paths: Record<string, string[]>
}

function stripJsonComments(source: string): string {
  return _pipe(
    source,
    (current) => current.replace(/^\uFEFF/, ''),
    (current) => current.replace(/\/\/[^\n\r]*/g, ''),
    (current) => current.replace(/\/\*[\s\S]*?\*\//g, ''),
    (current) => current.replace(/,(\s*[}\]])/g, '$1'),
  )
}

interface ConfigNode {
  type: string
  properties?: unknown[]
  elements?: unknown[]
  value?: unknown
}

interface ConfigProperty {
  type: string
  key?: { name?: string; value?: string } | null
  value?: unknown
}

function isConfigNode(node: unknown): node is ConfigNode {
  return typeof node === 'object' && node !== null && typeof (node as { type?: unknown }).type === 'string'
}

function isConfigProperty(property: unknown): property is ConfigProperty {
  return (
    typeof property === 'object' &&
    property !== null &&
    (property as { type?: unknown }).type === 'ObjectProperty' &&
    (property as { key?: unknown }).key != null
  )
}

function configValue(node: unknown): unknown {
  return _match(!isConfigNode(node))
    .with(true, () => undefined)
    .with(false, () => configBranch(node as ConfigNode))
    .exec()
}

function configBranch(node: ConfigNode): unknown {
  return _match(node.type)
    .with('ObjectExpression', () => configObject(node))
    .with('ArrayExpression', () => (node.elements ?? []).filter(Boolean).map(configValue))
    .with('SpreadElement', () => undefined)
    .with(node.type, () => node.value)
    .exec()
}

function configObject(node: ConfigNode): unknown {
  return Object.fromEntries(
    ((node.properties ?? []) as unknown[])
      .filter(isConfigProperty)
      .map((property) => [property.key?.name ?? property.key?.value, configValue(property.value)]),
  )
}

export class ModuleResolver {
  constructor(private readonly fs: IFileSystem) {}

  public candidates(specifier: string, importer: string): string[] {
    const bases = _match(specifier.startsWith('.') || path.isAbsolute(specifier))
      .with(true, () => [path.resolve(path.dirname(importer), specifier)])
      .with(false, () => this.aliasBases(specifier, importer))
      .exec() as string[]
    return bases.flatMap((base) => [
      base,
      ...extensions.map((ext) => base + ext),
      ...extensions.map((ext) => path.join(base, `index${ext}`)),
    ])
  }

  private aliasBases(specifier: string, importer: string): string[] {
    const configPath = this.findConfig(importer)
    return _match(configPath === null)
      .with(true, () => [] as string[])
      .with(false, () => this.matchAlias(specifier, this.readConfig(configPath as string)))
      .exec() as string[]
  }

  private matchAlias(specifier: string, config: ResolvedConfig): string[] {
    const base = config.baseUrl ?? config.pathsBasePath
    const aliases = Object.entries(config.paths).sort(([a], [b]) => b.replace('*', '').length - a.replace('*', '').length)
    const hit = aliases.find(([pattern]) => this.patternMatches(pattern, specifier))
    return _match(hit === undefined)
      .with(true, () => [path.resolve(base, specifier)])
      .with(false, () => this.expandAlias(hit as [string, string[]], specifier, base))
      .exec() as string[]
  }

  private patternMatches(pattern: string, specifier: string): boolean {
    const [prefix, suffix = ''] = pattern.split('*')
    return _match(pattern.includes('*'))
      .with(true, () => specifier.startsWith(prefix) && specifier.endsWith(suffix))
      .with(false, () => specifier === pattern)
      .exec() as boolean
  }

  private expandAlias([pattern, targets]: [string, string[]], specifier: string, base: string): string[] {
    const [prefix, suffix = ''] = pattern.split('*')
    const middle = _match(pattern.includes('*'))
      .with(true, () => specifier.slice(prefix.length, specifier.length - suffix.length))
      .with(false, () => '')
      .exec() as string
    return targets.map((target) => path.resolve(base, target.replace('*', middle)))
  }

  public resolve(specifier: string, importer: string): string | null {
    return (
      this.candidates(specifier, importer).find(
        (file) => this.fs.existsSync(file) && _try.sync(() => this.fs.readFileSync(file)).isRight(),
      ) ?? null
    )
  }

  public findConfig(importer: string): string | null {
    return this.locateConfig(path.dirname(path.resolve(importer)))
  }

  private locateConfig(directory: string): string | null {
    const file = path.join(directory, 'tsconfig.json')
    return _match(this.fs.existsSync(file))
      .with(true, () => file)
      .with(false, () => this.searchParent(directory))
      .exec() as string | null
  }

  private searchParent(directory: string): string | null {
    const parent = path.dirname(directory)
    return _match(parent === directory)
      .with(true, () => null)
      .with(false, () => this.locateConfig(parent))
      .exec() as string | null
  }

  public configFiles(importer: string, onDiscover?: (file: string) => void): string[] {
    const config = this.findConfig(importer)
    return _match(config === null)
      .with(true, () => [] as string[])
      .with(false, () => this.collectConfigs(config as string, onDiscover))
      .exec() as string[]
  }

  private collectConfigs(config: string, onDiscover?: (file: string) => void): string[] {
    const visited = new Set<string>()
    this.readConfig(config, visited, onDiscover)
    return [...visited]
  }

  private readConfig(file: string, visited = new Set<string>(), onDiscover?: (file: string) => void): ResolvedConfig {
    onDiscover?.(file)
    _match(visited.has(file))
      .with(true, () => {
        throw new ValidationError('Circular tsconfig extends chain.', file)
      })
      .with(false, () => undefined)
      .exec()
    visited.add(file)
    const config = _try
      .sync(() => configValue(parseExpression(stripJsonComments(this.fs.readFileSync(file)))) as Record<string, unknown>)
      .match({
        right: (value) => value ?? {},
        left: (error) => {
          throw new ValidationError(`Invalid tsconfig: ${error.message}`, file)
        },
      })
    const inherited = this.inheritedConfig(config, file, visited, onDiscover)
    const options = (config.compilerOptions ?? {}) as Record<string, unknown>
    return {
      baseUrl: _match(options.baseUrl !== undefined)
        .with(true, () => path.resolve(path.dirname(file), options.baseUrl as string))
        .with(false, () => inherited.baseUrl)
        .exec() as string | undefined,
      pathsBasePath: _match(options.paths !== undefined)
        .with(true, () => path.dirname(file))
        .with(false, () => inherited.pathsBasePath)
        .exec() as string,
      paths: (options.paths ?? inherited.paths) as Record<string, string[]>,
    }
  }

  private inheritedConfig(
    config: Record<string, unknown>,
    file: string,
    visited: Set<string>,
    onDiscover?: (file: string) => void,
  ): ResolvedConfig {
    const fallback: ResolvedConfig = { pathsBasePath: path.dirname(file), paths: {} }
    const parent = _match(typeof config.extends === 'string' && (config.extends as string) !== '')
      .with(true, () => this.resolveExtends(config.extends as string, path.dirname(file)))
      .with(false, () => null)
      .exec() as string | null
    return _match(parent === null)
      .with(true, () => fallback)
      .with(false, () => this.readConfig(this.configPath(parent as string), visited, onDiscover))
      .exec() as ResolvedConfig
  }

  private configPath(parent: string): string {
    return _match(parent.endsWith('.json'))
      .with(true, () => parent)
      .with(false, () => `${parent}.json`)
      .exec() as string
  }

  private resolveExtends(specifier: string, fromDir: string): string | null {
    return _match(specifier.startsWith('.') || path.isAbsolute(specifier))
      .with(true, () => path.resolve(fromDir, specifier))
      .with(false, () => this.locatePackageConfig(specifier, fromDir))
      .exec() as string | null
  }

  private locatePackageConfig(specifier: string, fromDir: string): string | null {
    return (
      [specifier, `${specifier}.json`, path.join(specifier, 'tsconfig.json')]
        .map((entry) => path.resolve(fromDir, 'node_modules', entry))
        .find((candidate) => this.fs.existsSync(candidate)) ?? null
    )
  }
}
