export interface Diagnostic {
  severity: 'error' | 'warning'
  message: string
  filePath?: string
  location?: { line: number; column: number }
  codeFrame?: string
}

export interface BuildRequest {
  signal?: AbortSignal
}

export interface ProjectBuildResult {
  durationMs: number
  files: string[]
  rebuilt: string[]
  skipped: string[]
  outputFiles: string[]
  diagnostics: Diagnostic[]
}
