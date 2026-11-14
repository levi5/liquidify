import type { Diagnostic } from './build-result'
import type { Logger } from '../../shared/logger'

export interface CompileOptions {
  filename?: string
  cwd?: string
  react?: { strictCsp?: boolean }
  logger?: Logger
  signal?: AbortSignal
  mode?: 'development' | 'production'
  sourcemap?: boolean
}

export interface CompiledAsset {
  filename: string
  content: string
}

export interface CompileResult {
  name?: string
  liquid?: string
  assets: CompiledAsset[]
  diagnostics: Diagnostic[]
}
