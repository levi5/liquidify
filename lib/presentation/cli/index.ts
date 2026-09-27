#!/usr/bin/env node
import ora from 'ora'
import kleur from 'kleur'
import fs from 'node:fs'
import path from 'node:path'
import { _match, _try } from 'funcio'
import { parseInitArgs, runInit } from './commands/init'
import { formatHelp, parseCliArgs } from './args'
import type { LiquidifyError } from '../../core/errors/liquidify-error'

const shouldSkipBanner = (options?: { noBanner?: boolean; quiet?: boolean }): boolean => {
  if (options?.noBanner === true || options?.quiet === true) return true
  if (process.env.CI === '1' || process.env.CI === 'true' || process.env.NO_COLOR === '1') return true
  return false
}

const printBanner = (options?: { noBanner?: boolean; quiet?: boolean }): void => {
  if (shouldSkipBanner(options)) return
  if (process.stdout.isTTY === true) console.clear()
  console.log(
    kleur.cyan(`
  _      _             _     _ _  __
  | |    (_)           (_)   | (_)/ _|
  | |     _  __ _ _   _ _  __| |_| |_ _   _
  | |    | |/ _\` | | | | |/ _\` | |  _| | | |
  | |____| | (_| | |_| | | (_| | | | | |_| |
  |______|_|\\__, |\\__,_|_|\\__,_|_|_|  \\__, |
               | |                     __/ |
               |_|                    |___/
`),
  )
  console.log(kleur.dim('  Shopify Liquid + React Compiler\n'))
}

const showHelp = (): void => {
  console.log(formatHelp())
  process.exit(0)
}

const showVersion = (): void => {
  console.log(`liquidify ${readPackageVersion()}`)
}

const readPackageVersion = (): string => {
  try {
    const pkgPath = path.join(__dirname, '../../../package.json')
    const raw = fs.readFileSync(pkgPath, 'utf-8')
    const pkg = JSON.parse(raw) as { version?: unknown }
    return typeof pkg.version === 'string' ? pkg.version : 'unknown'
  } catch {
    return 'unknown'
  }
}

const runBuild = async (watch: boolean, force = false, configPath?: string): Promise<void> => {
  const spinner = ora({ text: 'Loading configuration...', spinner: 'dots' }).start()
  const { loadConfig } = await import('../../infra/adapters/config/config-loader')
  const { makeLiquidifyBuilder } = await import('../../main/factories/make-liquidify-builder')
  const config = loadConfig(process.cwd(), configPath)
  _match(force)
    .with(true, () => {
      config.force = true
    })
    .with(false, () => undefined)
    .exec()
  const builder = makeLiquidifyBuilder(config)

  spinner.succeed(`Configuration loaded (src: ${config.componentsDir}, out: ${config.output})`)

  builder.on('build:start', () => {
    spinner.start(kleur.blue('Building...'))
  })

  builder.on('build:end', () => {
    spinner.succeed(kleur.green('Build completed successfully!'))
    _match(watch)
      .with(true, () => console.log(kleur.dim('\n👀 Watching for changes...')))
      .with(false, () => undefined)
      .exec()
  })

  builder.on('file:change', (file) => {
    console.log(kleur.dim(`\n📄 File changed: ${file}`))
  })

  builder.on('error', (error: LiquidifyError) => {
    console.log(`\n${kleur.bgRed().white(` ${errorPrefix(error)} Error `)} ${kleur.red(error.message)}`)
    _match(error.filePath === undefined)
      .with(true, () => undefined)
      .with(false, () => console.log(kleur.dim(`   ${error.filePath}${errorSuffix(error)}`)))
      .exec()
  })

  const shutdown = async (code = 0): Promise<void> => {
    spinner.stop()
    await builder.dispose().catch((error) => {
      console.error(kleur.red(`Failed to dispose builder: ${error instanceof Error ? error.message : String(error)}`))
    })
    console.log(kleur.yellow('\n👋 Shutting down...'))
    process.exit(code)
  }

  process.once('SIGINT', () => void shutdown())
  process.once('SIGTERM', () => void shutdown())
  process.once('SIGHUP', () => void shutdown())

  _match(process.stdin.isTTY === true)
    .with(true, () =>
      process.stdin.on('data', (data) => {
        _match(data.toString() === '\u0003')
          .with(true, () => void shutdown())
          .with(false, () => undefined)
          .exec()
      }),
    )
    .with(false, () => undefined)
    .exec()

  builder.on('build:failed', (error: Error) => spinner.fail(error.message))

  const outcome = await _try.async(() => builder.build())
  await outcome.match({
    right: () => finishRun(builder, watch, shutdown),
    left: (error) => failRun(builder, spinner, error, watch),
  })
}

const errorPrefix = (error: LiquidifyError): string =>
  _match(error.name === 'ValidationError')
    .with(true, () => 'Validation')
    .with(false, () => 'Build')
    .exec() as string

const errorSuffix = (error: LiquidifyError): string =>
  _match(error.location === undefined)
    .with(true, () => '')
    .with(
      false,
      () => `:${(error.location as { line: number; column: number }).line}:${(error.location as { line: number; column: number }).column}`,
    )
    .exec() as string

const finishRun = async (builder: { watch: () => void }, watch: boolean, shutdown: () => Promise<void>): Promise<void> => {
  await _match(watch)
    .with(true, () => builder.watch())
    .with(false, () => shutdown())
    .exec()
}

const failRun = async (
  builder: { dispose: () => Promise<void> },
  spinner: { fail: (message: string) => void },
  error: unknown,
  watch: boolean,
): Promise<void> => {
  spinner.fail(error instanceof Error ? error.message : String(error))
  await _match(watch)
    .with(true, () => undefined)
    .with(false, () => failHard(builder))
    .exec()
}

const failHard = async (builder: { dispose: () => Promise<void> }): Promise<void> => {
  process.exitCode = 1
  await builder.dispose()
}

const resolveAction = (args: string[]) => {
  const parsed = parseCliArgs(args)
  return _match(parsed.command)
    .with('help', () => showHelp)
    .with('version', () => showVersion)
    .with('init', () => initAction(parsed.initArgs, parsed.force))
    .with('build', () => () => runBuild(parsed.watch, parsed.force, parsed.configPath))
    .exec()
}

const initAction = (args: string[], force: boolean) => {
  const { targetDir, template, force: initForce } = parseInitArgs(args)
  return () => runInit(targetDir, template, initForce || force)
}

export async function cli(argv: string[] = process.argv.slice(2)): Promise<void> {
  const parsed = parseCliArgs(argv)
  printBanner(parsed)
  const action = resolveAction(argv)
  await action()
}

const isMainModule = typeof require !== 'undefined' && require.main === module

if (isMainModule) {
  cli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
