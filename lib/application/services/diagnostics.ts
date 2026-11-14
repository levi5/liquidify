import type { Diagnostic } from '@core/entities/build-result'
import { LiquidifyError } from '@core/errors/liquidify-error'
import { sourceCodeFrame } from '@shared/source-code-frame'

export function errorDiagnostic(error: unknown, source?: string): Diagnostic {
  return {
    severity: 'error',
    message: error instanceof Error ? error.message : String(error),
    ...(error instanceof LiquidifyError && error.filePath ? { filePath: error.filePath } : {}),
    ...(error instanceof LiquidifyError && error.location ? { location: error.location } : {}),
    ...(error instanceof LiquidifyError && error.location && source !== undefined
      ? { codeFrame: sourceCodeFrame(source, error.location) }
      : {}),
  }
}
