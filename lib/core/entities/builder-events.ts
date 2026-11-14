import type { LiquidifyError } from '@core/errors/liquidify-error'
import type { ProjectBuildResult } from '@core/entities/build-result'

export interface BuilderEvents {
  'build:start': []
  'build:end': [result: ProjectBuildResult]
  'build:failed': [error: unknown]
  'file:change': [filename: string]
  'watch:ready': []
  error: [error: LiquidifyError]
}
