import { _Array } from 'funcio'
import path from 'node:path'
import type { IParser } from '../../core/protocols/parser'
import type { IFileSystem } from '../../core/protocols/file-system'
import type { ReactComponentConfig } from '../../types/liquid'
import { pascalToKebab } from '../../shared/string'

export function detectDirectives(src: string) {
  const isReact = src.match(/['"]use react(?:\s*\(([^)]+)\))?['"]/)
  return {
    isReact: !!isReact,
    isDom: !!src.match(/['"]use\s+(dom(:global)?|script)['"]/),
    isSnippet: !!src.match(/['"]use snippets['"]/),
    rootId: isReact && isReact[1] ? isReact[1].replace(/^#/, '') : '',
  }
}

export class ComponentRegistry {
  constructor(
    private readonly parser: IParser,
    private readonly fileSystem: IFileSystem,
  ) {}

  public async scan(files: string[]): Promise<Map<string, ReactComponentConfig>> {
    const registry = new Map<string, ReactComponentConfig>()

    await _Array.forEachAsync(files, async (file) => {
      const filePath = path.resolve(file)
      const component = await this.scanFile(filePath)
      if (component) registry.set(component.name, component.config)
    })

    this.resolveDependencies(registry)
    return registry
  }

  private async scanFile(filePath: string): Promise<{ name: string; config: ReactComponentConfig } | null> {
    const src = this.fileSystem.readFileSync(filePath)
    const directives = detectDirectives(src)
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
