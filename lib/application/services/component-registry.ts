import { ASTParser } from '../../infra/adapters/parsers/babel/ASTParser'
import { ValidationError } from '../../core/errors/validation-error'
import { _Array } from 'funcio'
import path from 'node:path'
import type { IParser } from '../../core/protocols/parser'
import type { IFileSystem } from '../../core/protocols/file-system'
import type { ReactComponentConfig } from '../../types/liquid'
import { pascalToKebab } from '../../shared/string'

export function detectDirectives(src: string, filePath?: string) {
  const ast = new ASTParser().parse(src, filePath)
  const values = ast.program.directives.map((directive) => directive.value.value)
  const react = values.map((value) => value.match(/^use react(?:\s*\(([^)]+)\))?$/)).find(Boolean)
  return {
    isReact: !!react,
    isDom: values.some((value) => /^use (dom(?::global)?|script)$/.test(value)),
    isSnippet: values.includes('use snippets'),
    rootId: react?.[1]?.replace(/^#/, '') || '',
  }
}

export class ComponentRegistry {
  private readonly cache = new Map<string, { name: string; config: ReactComponentConfig } | null>()
  constructor(
    private readonly parser: IParser,
    private readonly fileSystem: IFileSystem,
  ) {}

  public async scan(files: string[], changed?: Set<string>): Promise<Map<string, ReactComponentConfig>> {
    const registry = new Map<string, ReactComponentConfig>()

    const active = new Set(files.map((file) => path.resolve(file)))
    for (const file of this.cache.keys()) if (!active.has(file)) this.cache.delete(file)
    const owners = new Map<string, string>()
    await _Array.forEachAsync(files, async (file) => {
      const filePath = path.resolve(file)
      if (!changed || changed.has(filePath) || !this.cache.has(filePath)) this.cache.set(filePath, await this.scanFile(filePath))
      const component = this.cache.get(filePath)
      if (component) {
        const key = pascalToKebab(component.name)
        const previous = owners.get(key)
        if (previous) throw new ValidationError(`Component name conflict: "${component.name}" is also defined in ${previous}.`, filePath)
        owners.set(key, filePath)
        registry.set(component.name, { ...component.config, scriptAssets: [...(component.config.scriptAssets || [])] })
      }
    })

    this.resolveDependencies(registry)
    return registry
  }

  private async scanFile(filePath: string): Promise<{ name: string; config: ReactComponentConfig } | null> {
    const src = this.fileSystem.readFileSync(filePath)
    const directives = detectDirectives(src, filePath)
    const isTSorJS = filePath.endsWith('.ts') || filePath.endsWith('.js')

    if (!directives.isReact && !directives.isDom && !directives.isSnippet) return null
    if (isTSorJS && !directives.isDom && !directives.isSnippet) return null

    const parsed = await this.parser.parse(src, filePath)
    const componentName = parsed.name || path.basename(filePath, path.extname(filePath))
    const scriptName = pascalToKebab(componentName)
    const script = directives.isReact || directives.isDom ? `${scriptName}.js` : ''

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

  private resolveDependencies(registry: Map<string, ReactComponentConfig>) {
    const scriptToComponent = new Map<string, string>()
    for (const [name, config] of registry) {
      if (config.script) scriptToComponent.set(config.script, name)
    }

    let changed = true
    while (changed) {
      changed = false
      for (const config of registry.values()) {
        const currentAssets = new Set(config.scriptAssets || [])
        const initialSize = currentAssets.size

        for (const asset of config.scriptAssets || []) {
          const depName = scriptToComponent.get(asset)
          const depConfig = depName ? registry.get(depName) : null

          if (depConfig) {
            if (depConfig.script) currentAssets.add(depConfig.script)
            for (const dependencyAsset of depConfig.scriptAssets || []) currentAssets.add(dependencyAsset)
          }
        }

        if (currentAssets.size > initialSize) {
          config.scriptAssets = Array.from(currentAssets)
          changed = true
        }
      }
    }
  }
}
