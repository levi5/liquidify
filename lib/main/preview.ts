import path from 'node:path'
import type { LiquidifyConfig } from '../core/entities/config'
import type { BuildRequest, ProjectBuildResult } from '../core/entities/build-result'
import { PreviewFileSystem, type OutputChange } from '../infra/adapters/fs/preview-file-system'
import { makeLiquidifyBuilder, type BuilderDependencies } from './factories/make-liquidify-builder'
import { SilentLogger } from '../shared/logger'

export interface ProjectPreview extends ProjectBuildResult {
  changes: OutputChange[]
}

export async function previewProject(
  options: LiquidifyConfig,
  request: BuildRequest = {},
  dependencies: Pick<BuilderDependencies, 'logger'> = {},
): Promise<ProjectPreview> {
  const outputRoot = path.resolve(options.cwd ?? process.cwd(), options.output)
  const fileSystem = new PreviewFileSystem(outputRoot)
  const builder = makeLiquidifyBuilder(options, { fileSystem, logger: dependencies.logger ?? new SilentLogger() })
  try {
    const result = await builder.build(request)
    return { ...result, changes: fileSystem.changes() }
  } finally {
    await builder.dispose()
  }
}
