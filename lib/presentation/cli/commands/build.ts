import { _try } from 'funcio/lib/Monads/Either'
import { EventEmitter } from 'node:events'
import type { FSWatcher } from 'node:fs'
import { glob } from 'glob'
import chokidar from 'chokidar'
import path from 'node:path'

import { pascalToKebab } from '../../../shared/string'
import type { BabelLiquidParser } from '../../../infra/adapters/parsers/babel/babel-parser'
import { ReactRuntimeBuilder } from '../../../infra/adapters/compilers/react/runtime/runtime-builder'
import { EsbuildCompiler } from '../../../infra/adapters/compilers/esbuild/esbuild-compiler'
import type { ReactComponentConfig } from '../../../infra/adapters/parsers/babel/liquid-parser'
import type { TranspileFileUseCase } from '../../../application/services/transpile-file'
import type { IFileSystem } from '../../../core/protocols/file-system'
import { NodeFileSystem } from '../../../infra/adapters/fs/node-file-system'
import { LiquidifyError } from '../../../core/errors/liquidify-error'

export class LiquidifyBuilder extends EventEmitter {
  private watcher: FSWatcher | null = null
  private timer: NodeJS.Timeout | null = null
  constructor(
    private options: { componentsDir: string; output: string },
    private parser: BabelLiquidParser,
    private useCase: TranspileFileUseCase,
    private fileSystem: IFileSystem = new NodeFileSystem(),
  ) {
    super()
  }

  async build() {
    this.emit('build:start')
    const errors: LiquidifyError[] = []
    const collectError = (error: unknown, filePath?: string) => {
      const liquidifyError =
        error instanceof LiquidifyError ? error : new LiquidifyError(error instanceof Error ? error.message : String(error), filePath)
      errors.push(liquidifyError)
      this.emit('error', liquidifyError)
    }

    const compiler = new EsbuildCompiler()
    const runtimeBuilder = new ReactRuntimeBuilder(compiler)
    const runtimeScript = await runtimeBuilder.build()

    const assetsDir = path.join(this.options.output, 'assets')
    if (!this.fileSystem.existsSync(assetsDir)) this.fileSystem.mkdirSync(assetsDir, true)

    this.fileSystem.writeFileSync(path.join(assetsDir, 'react-runtime.js'), runtimeScript)

    const registry = await this.scanReactComponents(collectError)
    this.parser.setReactRegistry(registry)

    await this.buildComponents(collectError)

    if (errors.length > 0) {
      throw new AggregateError(errors, `Build failed with ${errors.length} error(s).`)
    }

    this.emit('build:end')
  }

  private async scanReactComponents(onError: (error: unknown, filePath: string) => void): Promise<Map<string, ReactComponentConfig>> {
    const registry = new Map<string, ReactComponentConfig>()
    const files = await glob(path.join(this.options.componentsDir, '**/*.{tsx,jsx,ts,js}'))

    for (const file of files) {
      const filePath = path.resolve(file)
      const component = await this.handleFileScanning(filePath, onError)
      if (component) registry.set(component.name, component.config)
    }

    this.handleDependencyResolution(registry)
    return registry
  }

  private async handleFileScanning(
    filePath: string,
    onError: (error: unknown, filePath: string) => void,
  ): Promise<{ name: string; config: ReactComponentConfig } | null> {
    const src = this.fileSystem.readFileSync(filePath)
    const directives = this.detectDirectives(src)
    const isTSorJS = filePath.endsWith('.ts') || filePath.endsWith('.js')

    if (!directives.isReact && !directives.isDom && !directives.isSnippet) return null
    if (isTSorJS && !directives.isDom && !directives.isSnippet) return null

    const result = await _try.async(async () => {
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
    })

    if (result.isLeft()) {
      onError(result.value, filePath)
      return null
    }

    return result.value as { name: string; config: ReactComponentConfig }
  }

  private detectDirectives(src: string) {
    const isReact = src.match(/['"]use react(?:\s*\(([^)]+)\))?['"]/)
    return {
      isReact: !!isReact,
      isDom: !!src.match(/['"]use\s+(dom(:global)?|script)['"]/),
      isSnippet: !!src.match(/['"]use snippets['"]/),
      rootId: isReact && isReact[1] ? isReact[1].replace(/^#/, '') : '',
    }
  }

  private handleDependencyResolution(registry: Map<string, ReactComponentConfig>) {
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
            for (const ba of depConfig.scriptAssets || []) currentAssets.add(ba)
          }
        }

        if (currentAssets.size > initialSize) {
          config.scriptAssets = Array.from(currentAssets)
          changed = true
        }
      }
    }
  }

  private async buildComponents(onError: (error: unknown, filePath: string) => void) {
    const files = await glob(path.join(this.options.componentsDir, '**/*.{tsx,jsx,ts,js}'))
    for (const file of files) {
      const filePath = path.resolve(file)
      const src = this.fileSystem.readFileSync(filePath)
      const directives = this.detectDirectives(src)
      const isTSorJS = filePath.endsWith('.ts') || filePath.endsWith('.js')

      if (isTSorJS && !directives.isDom && !directives.isSnippet) continue

      const result = await _try.async(() => this.useCase.execute(src, filePath))
      if (result.isLeft()) {
        onError(result.value, filePath)
      }
    }
  }

  public watch() {
    this.watcher = chokidar.watch([this.options.componentsDir], { ignoreInitial: true })

    const scheduleRebuild = (file: string) => {
      this.emit('file:change', file)

      if (this.timer) clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        void _try
          .async(() => this.build())
          .then((result) => {
            if (result.isLeft() && !(result.value instanceof AggregateError)) {
              this.emit('error', result.value)
            }
          })
      }, 200)
    }

    this.watcher.on('change', scheduleRebuild)
    this.watcher.on('add', scheduleRebuild)
    this.watcher.on('unlink', scheduleRebuild)
  }

  public disposeSync() {
    if (this.timer) clearTimeout(this.timer)
    _try.sync(() => this.watcher?.close())
  }
}
