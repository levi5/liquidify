import type { ParsedCliArgs } from '@presentation/cli/args'
import type { ProjectBuildResult } from '@core/entities/build-result'
import type { OutputChange } from '@adapters/fs/preview-file-system'
import { errorDiagnostic } from '@application/services/diagnostics'
import fs from 'node:fs'
import { sourceCodeFrame } from '@shared/source-code-frame'

export class BuildReporter {
  constructor(private readonly options: Partial<Pick<ParsedCliArgs, 'json' | 'quiet' | 'command' | 'dryRun' | 'profile' | 'verbose'>>) {}

  success(result: ProjectBuildResult & { changes?: OutputChange[] }): void {
    if (this.options.json) {
      console.log(JSON.stringify({ status: 'success', ...result }))
      return
    }
    if (this.options.quiet) return
    for (const diagnostic of result.diagnostics) console.error(`${diagnostic.severity}: ${diagnostic.message}`)
    const action = this.options.command === 'check' ? 'Check' : this.options.dryRun ? 'Preview' : 'Build'
    console.log(`${action} completed: ${result.rebuilt.length} rebuilt, ${result.skipped.length} unchanged.`)
    if (this.options.profile) console.log(`Total: ${result.durationMs.toFixed(1)} ms`)
    if (this.options.verbose) {
      for (const filename of result.rebuilt) console.log(`Compiled: ${filename}`)
      for (const filename of result.skipped) console.log(`Unchanged: ${filename}`)
    }
    if (this.options.dryRun) {
      for (const change of result.changes ?? []) console.log(`${change.operation}: ${change.filename}`)
    }
  }

  failure(error: unknown): void {
    const diagnostic = errorDiagnostic(error)
    if (this.options.json) {
      console.log(JSON.stringify({ status: 'error', diagnostics: [diagnostic] }))
      return
    }
    console.error(diagnostic.message)
    if (diagnostic.filePath) {
      const location = diagnostic.location ? `:${diagnostic.location.line}:${diagnostic.location.column}` : ''
      console.error(`  ${diagnostic.filePath}${location}`)
      if (diagnostic.location) {
        try {
          if (fs.statSync(diagnostic.filePath).size <= 1024 * 1024) {
            const frame = sourceCodeFrame(fs.readFileSync(diagnostic.filePath, 'utf8'), diagnostic.location)
            if (frame) console.error(frame)
          }
        } catch {}
      }
    }
  }
}
