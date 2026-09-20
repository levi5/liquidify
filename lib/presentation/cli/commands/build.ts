import { _Array, _try } from 'funcio'
import { EventEmitter } from 'node:events'
import type { FSWatcher } from 'node:fs'
import { glob } from 'glob'
import chokidar from 'chokidar'
import path from 'node:path'

import { ComponentRegistry, detectDirectives } from '../../../application/services/component-registry'
import type { BabelLiquidParser } from '../../../infra/adapters/parsers/babel/babel-parser'
import { ReactRuntimeBuilder } from '../../../infra/adapters/compilers/react/runtime/runtime-builder'
import { EsbuildCompiler } from '../../../infra/adapters/compilers/esbuild/esbuild-compiler'
import type { TranspileFileUseCase } from '../../../application/services/transpile-file'
import type { IFileSystem } from '../../../core/protocols/file-system'
import { NodeFileSystem } from '../../../infra/adapters/fs/node-file-system'
import { LiquidifyError } from '../../../core/errors/liquidify-error'

export class LiquidifyBuilder extends EventEmitter {
  private watcher: FSWatcher | null = null
  private timer: NodeJS.Timeout | null = null
  private building = false
  private queued = false
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
    const result = await _try.async(() => this.buildProject())
    result.match({
      right: () => this.emit('build:end'),
      left: (error) => {
        const buildError =
          error instanceof LiquidifyError ? error : new LiquidifyError(error instanceof Error ? error.message : String(error))
        if (this.listenerCount('error')) this.emit('error', buildError)
        throw buildError
      },
    })
  }

  private async buildProject(): Promise<void> {
    const compiler = new EsbuildCompiler()
    const runtimeBuilder = new ReactRuntimeBuilder(compiler)
    const runtimeScript = await runtimeBuilder.build()

    const assetsDir = path.join(this.options.output, 'assets')
    if (!this.fileSystem.existsSync(assetsDir)) this.fileSystem.mkdirSync(assetsDir, true)

    this.fileSystem.writeFileSync(path.join(assetsDir, 'react-runtime.js'), runtimeScript)

    const files = await glob(path.join(this.options.componentsDir, '**/*.{tsx,jsx,ts,js}'))
    const registry = await new ComponentRegistry(this.parser, this.fileSystem).scan(files)
    this.parser.setReactRegistry(registry)
    await this.buildComponents(files)
  }

  private async buildComponents(files: string[]) {
    await _Array.forEachAsync(files, async (file) => {
      const filePath = path.resolve(file)
      const src = this.fileSystem.readFileSync(filePath)
      const directives = detectDirectives(src)
      const isTSorJS = filePath.endsWith('.ts') || filePath.endsWith('.js')

      if (isTSorJS && !directives.isDom && !directives.isSnippet) return

      await this.useCase.execute(src, filePath)
    })
  }

  public watch() {
    this.watcher = chokidar.watch([this.options.componentsDir], { ignoreInitial: true })
    ;['add', 'change', 'unlink', 'addDir', 'unlinkDir'].forEach((event) => {
      this.watcher!.on(event, (file) => this.schedule(file))
    })
  }

  private schedule(file: string): void {
    this.emit('file:change', file)
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => void this.runSerialized(), 200)
  }

  private async runSerialized(): Promise<void> {
    if (this.building) {
      this.queued = true
      return
    }
    this.building = true
    try {
      do {
        this.queued = false
        const result = await _try.async(() => this.build())
        result.match({
          right: () => undefined,
          left: (error) => this.emit('build:failed', error),
        })
      } while (this.queued)
    } finally {
      this.building = false
    }
  }

  public disposeSync() {
    if (this.timer) clearTimeout(this.timer)
    _try.sync(() => this.watcher?.close())
  }
}
