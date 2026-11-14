import type { ParsedCliArgs } from '../args'
import { BuildReporter } from '../build-reporter'
import { loadConfig } from '../../../infra/adapters/config/config-loader'
import { previewProject } from '../../../main/preview'
import { SilentLogger } from '../../../shared/logger'
import { BuildSession } from '../build-session'

export async function runBuild(options: ParsedCliArgs): Promise<void> {
  const reporter = new BuildReporter(options)
  if (options.command === 'check' || options.dryRun) {
    const configuration = loadConfig(process.cwd(), options.configPath, { plugins: !options.noPlugins })
    if (options.force) configuration.force = true
    if (options.concurrency !== undefined) configuration.concurrency = options.concurrency
    if (options.mode) configuration.mode = options.mode
    if (options.sourcemap) configuration.sourcemap = true
    reporter.success(await previewProject(configuration, {}, { logger: new SilentLogger() }))
    return
  }
  const session = new BuildSession(options, reporter)
  const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const
  const shutdown = async (): Promise<void> => {
    await session.dispose()
    for (const signal of signals) process.removeListener(signal, handleSignal)
  }
  const handleSignal = (): void => {
    void shutdown().catch((error) => {
      reporter.failure(error)
      process.exitCode = 1
    })
  }
  if (options.watch) {
    for (const signal of signals) process.once(signal, handleSignal)
  }
  try {
    await session.start()
  } finally {
    if (!options.watch) await shutdown()
  }
}
