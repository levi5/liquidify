export interface Diagnostic {
  severity: 'error' | 'warning'
  message: string
  filePath?: string
  location?: { line: number; column: number }
}

export interface BuildRequest {
  signal?: AbortSignal
}

export interface ProjectBuildResult {
  durationMs: number
  files: string[]
  rebuilt: string[]
  skipped: string[]
  diagnostics: Diagnostic[]
}
