import type { IFileReader } from '../../core/protocols/file-system'
import type { DirectiveReader } from '../../core/protocols/project-compilation'
import type { TranspileFileUseCase } from './transpile-file'
import { LiquidifyError } from '../../core/errors/liquidify-error'
import { processFilesInParallel } from './parallel-files'

export async function compileProjectFiles(
  files: string[],
  fileSystem: IFileReader,
  scanner: DirectiveReader,
  useCase: TranspileFileUseCase,
  concurrency?: number,
  signal?: AbortSignal,
): Promise<void> {
  const results = await processFilesInParallel(
    files,
    async (filename) => {
      signal?.throwIfAborted()
      const source = await fileSystem.readFile(filename)
      const directives = scanner.scan(source, filename)
      const scriptDependency = /\.(ts|js)$/.test(filename) && !directives.isDom && !directives.isSnippet
      if (!scriptDependency) await useCase.execute(source, filename)
    },
    concurrency,
  )
  const failures = results.filter((result) => result.error !== undefined)
  if (failures.length === 1) {
    const { file, error } = failures[0]
    if (error instanceof LiquidifyError) throw error
    throw new LiquidifyError(`Failed to compile ${file}: ${error instanceof Error ? error.message : String(error)}`, file)
  }
  if (failures.length > 1) {
    const detail = failures.map(({ file, error }) => `  - ${file}: ${error instanceof Error ? error.message : String(error)}`).join('\n')
    throw new LiquidifyError(`Failed to compile ${failures.length} file(s):\n${detail}`)
  }
}
