import type { Diagnostic } from '@core/entities/build-result'
import type { Logger } from '@shared/logger'

export class BuildDiagnostics {
  private entries: Diagnostic[] = []

  clear(): void {
    this.entries = []
  }

  warn(message: string): void {
    this.entries.push({ severity: 'warning', message })
  }

  snapshot(): Diagnostic[] {
    return this.entries.map((entry) => ({ ...entry }))
  }
}

export class DiagnosticLogger implements Logger {
  constructor(
    private readonly delegate: Logger,
    private readonly diagnostics: BuildDiagnostics,
  ) {}

  info(message: string): void {
    this.delegate.info(message)
  }

  warn(message: string): void {
    this.diagnostics.warn(message)
    this.delegate.warn(message)
  }

  error(message: string, cause?: unknown): void {
    this.delegate.error(message, cause)
  }
}
