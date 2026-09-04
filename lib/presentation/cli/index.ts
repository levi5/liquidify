#!/usr/bin/env node
import ora from 'ora'
import kleur from 'kleur'
import { _match } from 'funcio'
import { runInit } from './commands/init'
import type { LiquidifyError } from '../../core/errors/liquidify-error'
import '../../shared/string'

const printBanner = (): void => {
  console.clear()
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
  console.log(`
  ${kleur.bold('Usage:')}
    liquidify [options]
    liquidify init [directory]

  ${kleur.bold('Commands:')}
    init [dir]      Initialize a new Shopify + Liquidify project template (default: .)

  ${kleur.bold('Options:')}
    --watch, -w     Watch for file changes and rebuild automatically
    --help, -h      Show help
`)
  process.exit(0)
}

const runBuild = async (watch: boolean): Promise<void> => {
  const spinner = ora({ text: 'Loading configuration...', spinner: 'dots' }).start()
  const { ConfigLoader } = await import('../../infra/adapters/config/config-loader')
  const { makeLiquidifyBuilder } = await import('../../main/factories/make-liquidify-builder')
  const config = ConfigLoader.load()
  const builder = makeLiquidifyBuilder(config)

  spinner.succeed(`Configuration loaded (src: ${config.componentsDir}, out: ${config.output})`)

  builder.on('build:start', () => {
    spinner.start(kleur.blue('Building...'))
  })

  builder.on('build:end', () => {
    spinner.succeed(kleur.green('Build completed successfully!'))
    _match(watch)
      .with(true, () => console.log(kleur.dim('\n👀 Watching for changes...')))
      .with(false, () => {})
      .exec()
  })

  builder.on('file:change', (file) => {
    console.log(kleur.dim(`\n📄 File changed: ${file}`))
  })

  builder.on('error', (error: LiquidifyError) => {
    const prefix = error.name === 'ValidationError' ? 'Validation' : 'Build'
    console.log(`\n${kleur.bgRed().white(` ${prefix} Error `)} ${kleur.red(error.message)}`)
    _match(Boolean(error.filePath))
      .with(true, () => console.log(kleur.dim(`   ${error.filePath}`)))
      .with(false, () => {})
      .exec()
  })

  const shutdown = () => {
    spinner.stop()
    builder.disposeSync()
    console.log(kleur.yellow('\n👋 MM!'))
    process.exit(0)
  }

  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
  process.once('SIGHUP', shutdown)

  if (process.stdin.isTTY) {
    process.stdin.on('data', (data) => {
      _match(data.toString() === '\u0003')
        .with(true, shutdown)
        .with(false, () => {})
        .exec()
    })
  }

  await builder.build()

  _match(watch)
    .with(true, () => builder.watch())
    .with(false, shutdown)
    .exec()
}

const resolveCommand = (args: string[]): string => {
  const isHelp = args.includes('--help') || args.includes('-h')
  const isInit = args[0] === 'init'

  return _match(isHelp)
    .with(true, () => 'help')
    .with(false, () => (isInit ? 'init' : 'build'))
    .exec()
}

const resolveAction = (args: string[]) => {
  const command = resolveCommand(args)
  const watch = args.includes('--watch') || args.includes('-w')

  return _match(command)
    .with('help', () => showHelp)
    .with('init', () => () => runInit(args[1] || '.'))
    .with('build', () => () => runBuild(watch))
    .exec()
}

export async function cli(): Promise<void> {
  printBanner()
  const args = process.argv.slice(2)
  const action = resolveAction(args)
  await action()
}

if (require.main === module) cli()
