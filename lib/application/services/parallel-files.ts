import os from 'node:os'

const availableProcessors = typeof os.availableParallelism === 'function' ? os.availableParallelism() : os.cpus().length
export const BUILD_CONCURRENCY = Math.max(1, Math.min(8, availableProcessors || 1))

export async function processFilesInParallel(
  files: string[],
  worker: (file: string) => Promise<void>,
  concurrency = BUILD_CONCURRENCY,
): Promise<Array<{ file: string; error?: unknown }>> {
  const results: Array<{ file: string; error?: unknown }> = new Array(files.length)
  let cursor = 0
  const consumeFiles = async (): Promise<void> => {
    while (cursor < files.length) {
      const index = cursor++
      const file = files[index] as string
      try {
        await worker(file)
        results[index] = { file }
      } catch (error) {
        results[index] = { file, error }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, consumeFiles))
  return results
}
