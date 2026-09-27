import { _Array, _match } from 'funcio'
import path from 'node:path'
import type { ASTParser } from '../../infra/adapters/parsers/babel/ASTParser'
import { ValidationError } from '../../core/errors/validation-error'
import type { IParser } from '../../core/protocols/parser'
import type { IFileSystem } from '../../core/protocols/file-system'
import type { ReactComponentConfig } from '../../types/liquid'
import { pascalToKebab } from '../../shared/string'
import { DOM_DIRECTIVE_PATTERN, REACT_DIRECTIVE_PATTERN } from '../../shared/liquid-constants'

export interface ComponentDirectives {
  isReact: boolean
  isDom: boolean
  isSnippet: boolean
  rootId: string
}

export interface ScannedComponent {
  name: string
  config: ReactComponentConfig
}

export class DirectiveScanner {
  constructor(private readonly astParser: ASTParser) {}

  public scan(src: string, filePath?: string): ComponentDirectives {
    const values = this.astParser.parse(src, filePath).program.directives.map((directive) => directive.value.value)
    const react = values.map((value) => value.match(REACT_DIRECTIVE_PATTERN)).find(Boolean)
    const rawId = react?.[1] as string | undefined
    return {
      isReact: react !== undefined,
      isDom: values.some((value) => DOM_DIRECTIVE_PATTERN.test(value)),
      isSnippet: values.includes('use snippets'),
      rootId: _match(rawId === undefined)
        .with(true, () => '')
        .with(false, () => (rawId as string).replace(/^#/, ''))
        .exec() as string,
    }
  }
}

export class ComponentRegistry {
  private readonly cache = new Map<string, ScannedComponent | null>()

  constructor(
    private readonly parser: IParser,
    private readonly fileSystem: IFileSystem,
    private readonly scanner: DirectiveScanner,
  ) {}

  public async scan(files: string[], changed?: Set<string>): Promise<Map<string, ReactComponentConfig>> {
    const registry = new Map<string, ReactComponentConfig>()
    this.pruneCache(files)
    const owners = new Map<string, string>()
    await _Array.forEachAsync(files, async (file) => this.registerFile(registry, owners, path.resolve(file), changed))
    this.resolveDependencies(registry)
    return registry
  }

  private pruneCache(files: string[]): void {
    const active = new Set(files.map((file) => path.resolve(file)))
    Array.from(this.cache.keys())
      .filter((cached) => !active.has(cached))
      .forEach((stale) => {
        this.cache.delete(stale)
      })
  }

  private async registerFile(
    registry: Map<string, ReactComponentConfig>,
    owners: Map<string, string>,
    filePath: string,
    changed?: Set<string>,
  ): Promise<void> {
    const entry = await this.refreshEntry(filePath, changed)
    this.cache.set(filePath, entry)
    _match(entry === null || entry === undefined)
      .with(true, () => undefined)
      .with(false, () => this.claim(registry, owners, filePath, entry as ScannedComponent))
      .exec()
  }

  private async refreshEntry(filePath: string, changed?: Set<string>): Promise<ScannedComponent | null> {
    return _match(!changed || changed.has(filePath) || !this.cache.has(filePath))
      .with(true, () => this.scanFile(filePath))
      .with(false, () => Promise.resolve(this.cache.get(filePath) ?? null))
      .exec() as Promise<ScannedComponent | null>
  }

  private claim(
    registry: Map<string, ReactComponentConfig>,
    owners: Map<string, string>,
    filePath: string,
    component: ScannedComponent,
  ): void {
    const key = pascalToKebab(component.name)
    const previous = owners.get(key)
    _match(previous === undefined)
      .with(true, () => this.adopt(registry, owners, key, filePath, component))
      .with(false, () => {
        throw new ValidationError(`Component name conflict: "${component.name}" is also defined in ${previous}.`, filePath)
      })
      .exec()
  }

  private adopt(
    registry: Map<string, ReactComponentConfig>,
    owners: Map<string, string>,
    key: string,
    filePath: string,
    component: ScannedComponent,
  ): void {
    owners.set(key, filePath)
    registry.set(component.name, { ...component.config, scriptAssets: [...(component.config.scriptAssets ?? [])] })
  }

  private async scanFile(filePath: string): Promise<ScannedComponent | null> {
    const source = this.fileSystem.readFileSync(filePath)
    const directives = this.scanner.scan(source, filePath)
    return _match(this.isScannable(filePath, directives))
      .with(true, () => this.parseComponent(filePath, directives, source))
      .with(false, () => Promise.resolve(null))
      .exec() as Promise<ScannedComponent | null>
  }

  private isScannable(filePath: string, directives: ComponentDirectives): boolean {
    return _match(true)
      .with(!directives.isReact && !directives.isDom && !directives.isSnippet, () => false)
      .with(this.isBareTsOrJs(filePath, directives), () => false)
      .with(true, () => true)
      .exec() as boolean
  }

  private isBareTsOrJs(filePath: string, directives: ComponentDirectives): boolean {
    return _match(filePath.endsWith('.ts') || filePath.endsWith('.js'))
      .with(true, () => !directives.isDom && !directives.isSnippet)
      .with(false, () => false)
      .exec() as boolean
  }

  private async parseComponent(filePath: string, directives: ComponentDirectives, source?: string): Promise<ScannedComponent> {
    const parsed = await this.parser.parse(source ?? this.fileSystem.readFileSync(filePath), filePath)
    const componentName = _match(!parsed.name)
      .with(true, () => path.basename(filePath, path.extname(filePath)))
      .with(false, () => parsed.name as string)
      .exec() as string
    const scriptName = pascalToKebab(componentName)
    const script = _match(directives.isReact || directives.isDom)
      .with(true, () => `${scriptName}.js`)
      .with(false, () => '')
      .exec() as string
    return {
      name: componentName,
      config: {
        rootId: directives.rootId,
        script,
        scriptAssets: parsed.scriptAssets,
        mode: parsed.mode,
      },
    }
  }

  private resolveDependencies(registry: Map<string, ReactComponentConfig>): void {
    _match(this.propagateOnce(registry))
      .with(true, () => this.resolveDependencies(registry))
      .with(false, () => undefined)
      .exec()
  }

  private propagateOnce(registry: Map<string, ReactComponentConfig>): boolean {
    const scriptToComponent = this.scriptIndex(registry)
    return Array.from(registry.values())
      .map((config) => this.propagateInto(config, registry, scriptToComponent))
      .some((grew) => grew)
  }

  private scriptIndex(registry: Map<string, ReactComponentConfig>): Map<string, string> {
    const index = new Map<string, string>()
    registry.forEach((config, name) => {
      _match(!config.script)
        .with(true, () => undefined)
        .with(false, () => index.set(config.script as string, name))
        .exec()
    })
    return index
  }

  private propagateInto(
    config: ReactComponentConfig,
    registry: Map<string, ReactComponentConfig>,
    scriptToComponent: Map<string, string>,
  ): boolean {
    const expanded = this.transitiveAssets(config, registry, scriptToComponent)
    return _match(expanded.size > new Set(config.scriptAssets ?? []).size)
      .with(true, () => {
        config.scriptAssets = Array.from(expanded)
        return true
      })
      .with(false, () => false)
      .exec() as boolean
  }

  private transitiveAssets(
    config: ReactComponentConfig,
    registry: Map<string, ReactComponentConfig>,
    scriptToComponent: Map<string, string>,
  ): Set<string> {
    const collected = new Set(config.scriptAssets ?? [])
    ;(config.scriptAssets ?? []).forEach((asset) => {
      this.absorbAsset(asset, registry, scriptToComponent, collected)
    })
    return collected
  }

  private absorbAsset(
    asset: string,
    registry: Map<string, ReactComponentConfig>,
    scriptToComponent: Map<string, string>,
    collected: Set<string>,
  ): void {
    const depName = scriptToComponent.get(asset)
    const dep = _match(depName === undefined)
      .with(true, () => undefined)
      .with(false, () => registry.get(depName as string))
      .exec() as ReactComponentConfig | undefined
    _match(dep === undefined)
      .with(true, () => undefined)
      .with(false, () => this.absorbConfig(dep as ReactComponentConfig, collected))
      .exec()
  }

  private absorbConfig(dep: ReactComponentConfig, collected: Set<string>): void {
    _match(!dep.script)
      .with(true, () => undefined)
      .with(false, () => collected.add(dep.script as string))
      .exec()
    ;(dep.scriptAssets ?? []).forEach((asset) => {
      collected.add(asset)
    })
  }
}
