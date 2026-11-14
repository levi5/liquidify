import type { LiquidifyError } from '../errors/liquidify-error'
import type { ProjectBuildResult } from './build-result'

export interface BuilderEvents {
  'build:start': []
  'build:end': [result: ProjectBuildResult]
  'build:failed': [error: unknown]
  'file:change': [filename: string]
  'watch:ready': []
  error: [error: LiquidifyError]
}
