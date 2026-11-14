import type { BuildRequest } from '../../core/entities/build-result'
import { DEFAULT_BUILD_LIMITS, type BuildLimits } from '../../core/entities/build-limits'
import type { IFileReader } from '../../core/protocols/file-system'
import type {
  ProjectParser,
  RuntimeBundler,
  ComponentRegistryReader,
  DirectiveReader,
  DependencyPlanner,
  ProjectFileDiscovery,
} from '../../core/protocols/project-compilation'
import type { TranspileFileUseCase } from './transpile-file'
import type { BuildPlan } from '../../core/entities/build-plan'
import { LiquidifyError } from '../../core/errors/liquidify-error'
import { collectBuildStatistics } from './build-statistics'
import { compileProjectFiles } from './compile-project-files'

export interface ProjectPipelineOptions {
  componentsDir: string
  output: string
  concurrency?: number
  limits?: BuildLimits
}

/** Coordinates planning, validation and a transactional publish; owns no terminal or watcher. */
export class ProjectBuildPipeline {
  files: string[] = []
  rebuilt: string[] = []
  private registrySignature = ''
  private runtimeScript?: string

  constructor(
    readonly options: ProjectPipelineOptions,
    private readonly parser: ProjectParser,
    readonly useCase: TranspileFileUseCase,
    private readonly fileSystem: IFileReader,
    readonly dependencies: DependencyPlanner,
    private readonly registry: ComponentRegistryReader,
    private readonly runtimeBuilder: RuntimeBundler,
    private readonly scanner: DirectiveReader,
    private readonly discoverFiles: ProjectFileDiscovery,
  ) {}

  async run(request: BuildRequest, updateWatch: (dependencies: Set<string>) => void): Promise<void> {
    this.files = await this.discoverFiles(this.options.componentsDir, this.options.output)
    if (this.files.length > (this.options.limits ?? DEFAULT_BUILD_LIMITS).maxFiles)
      throw new LiquidifyError('Project exceeds the configured maxFiles limit.')
    let plan: BuildPlan
    try {
      plan = this.dependencies.plan(this.files)
    } finally {
      // Keep unresolved paths watched even when planning fails.
      updateWatch(this.dependencies.watchedFiles)
    }
    const registry = await this.registry.scan(this.files, plan.changed)
    const signature = JSON.stringify([...registry].sort(([firstName], [secondName]) => firstName.localeCompare(secondName)))
    const changed = this.registrySignature && signature !== this.registrySignature ? new Set(this.files) : plan.changed
    this.parser.setReactRegistry(registry)
    await this.useCase.beginBuild(this.files, changed)
    this.rebuilt = this.files.filter((filename) => changed.has(filename))
    try {
      request.signal?.throwIfAborted()
      this.runtimeScript ??= await this.runtimeBuilder.build()
      await this.useCase.stageRuntime(this.runtimeScript)
      await compileProjectFiles(this.rebuilt, this.fileSystem, this.scanner, this.useCase, this.options.concurrency, request.signal)
      request.signal?.throwIfAborted()
    } catch (error) {
      await this.useCase.abortBuild()
      throw error
    }
    await this.useCase.finishBuild()
    this.registrySignature = signature
    plan.commit()
  }

  statistics() {
    return collectBuildStatistics(this.files, this.fileSystem, this.scanner)
  }

  clear(): void {
    this.runtimeScript = undefined
    this.registrySignature = ''
  }
}
