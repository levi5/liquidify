import { DependencyTracker } from '../../../application/services/dependency-tracker'
import { _Array, _try } from 'funcio'
import { EventEmitter } from 'node:events'
import type { FSWatcher } from 'chokidar'
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
  private disposed = false
  private readonly dependencies: DependencyTracker
  private readonly registry: ComponentRegistry
  private registrySignature = ''
  private runtimeScript?: string
  private watchedDependencies = new Set<string>()
  constructor(
    private options: { componentsDir: string; output: string },
    private parser: BabelLiquidParser,
    private useCase: TranspileFileUseCase,
    private fileSystem: IFileSystem = new NodeFileSystem(),
  ) {
    super()
    this.dependencies = new DependencyTracker(fileSystem)
    this.registry = new ComponentRegistry(parser, fileSystem)
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
    const files = (await glob(path.join(this.options.componentsDir, '**/*.{tsx,jsx,ts,js}'))).map((file) => path.resolve(file)).sort()
    const planning = _try.sync(() => this.dependencies.plan(files))
    this.watchedDependencies = new Set(this.dependencies.watchedFiles)
    this.watcher?.add(this.watchTargets())
    const plan = planning.match({
      right: (value) => value,
      left: (error) => {
        throw error
      },
    })
    const registry = await this.registry.scan(files, plan.changed)
    const signature = JSON.stringify([...registry])
    const changed = this.registrySignature && signature !== this.registrySignature ? new Set(files) : plan.changed
    this.parser.setReactRegistry(registry)

    const assetsDir = path.join(this.options.output, 'assets')
    if (!this.fileSystem.existsSync(assetsDir)) this.fileSystem.mkdirSync(assetsDir, true)
    if (!this.runtimeScript) this.runtimeScript = await new ReactRuntimeBuilder(new EsbuildCompiler()).build()
    const runtimePath = path.join(assetsDir, 'react-runtime.js')
    if (!this.fileSystem.existsSync(runtimePath) || this.fileSystem.readFileSync(runtimePath) !== this.runtimeScript) {
      this.fileSystem.writeFileSync(runtimePath, this.runtimeScript)
    }
    await this.useCase.beginBuild(files, changed)
    await this.buildComponents(files.filter((file) => changed.has(file)))
    await this.useCase.finishBuild()
    this.registrySignature = signature
    plan.commit()
  }

  private async buildComponents(files: string[]) {
    await _Array.forEachAsync(files, async (file) => {
      const filePath = path.resolve(file)
      const src = this.fileSystem.readFileSync(filePath)
      const directives = detectDirectives(src, filePath)
      const isTSorJS = filePath.endsWith('.ts') || filePath.endsWith('.js')

      if (isTSorJS && !directives.isDom && !directives.isSnippet) return

      await this.useCase.execute(src, filePath)
    })
  }

  public watch() {
    if (this.watcher) return
    this.disposed = false
    this.watcher = chokidar.watch(this.watchTargets(), {
      ignoreInitial: true,
      ignored: (file) => !this.isWatchedPath(file),
    })
    ;(['add', 'change', 'unlink', 'addDir', 'unlinkDir'] as const).forEach((event) => {
      this.watcher!.on(event, (file) => this.schedule(file))
    })
  }

  private watchTargets(): string[] {
    const targets = new Set([path.resolve(this.options.componentsDir), ...this.watchedDependencies])
    for (const file of this.watchedDependencies) {
      let ancestor = file
      while (!this.fileSystem.existsSync(ancestor) && path.dirname(ancestor) !== ancestor) ancestor = path.dirname(ancestor)
      targets.add(ancestor)
    }
    return [...targets]
  }

  private isWatchedPath(file: string): boolean {
    const absolute = path.resolve(file)
    const components = path.resolve(this.options.componentsDir)
    if (absolute === components || absolute.startsWith(`${components}${path.sep}`) || components.startsWith(`${absolute}${path.sep}`)) {
      return true
    }
    return [...this.watchedDependencies].some((dependency) => dependency === absolute || dependency.startsWith(`${absolute}${path.sep}`))
  }

  private schedule(file: string): void {
    if (this.disposed) return
    this.emit('file:change', file)
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => void this.runSerialized(), 200)
  }

  private async runSerialized(): Promise<void> {
    if (this.disposed) return
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
      } while (this.queued && !this.disposed)
    } finally {
      this.building = false
    }
  }

  public async dispose(): Promise<void> {
    this.disposed = true
    this.queued = false
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    const watcher = this.watcher
    this.watcher = null
    await watcher?.close()
  }

  public disposeSync() {
    void _try.async(() => this.dispose())
  }
}
