#!/usr/bin/env node
import ora from 'ora'
import kleur from 'kleur'
import { makeLiquidXBuilder } from '../../main/factories/make-liquid-x-builder'
import { ConfigLoader } from '../../infra/adapters/config/config-loader'
import { LiquidxError } from '../../core/errors/liquidx-error'
import '../../shared/string'

console.clear()
console.log(
	kleur.cyan(`
  _      _             _     _ __  __
 | |    (_)           (_)   | |\\ \\/ /
 | |     _  __ _ _   _ _  __| | \\  /
 | |    | |/ _\` | | | | |/ _\` | /  \\
 | |____| | (_| | |_| | | (_| |/ /\\ \\
 |______|_|\\__, |\\__,_|_|\\__,_/_/  \\_\\
              | |
              |_|
`),
)
console.log(kleur.dim('  Shopify Liquid + React Compiler\n'))

export async function cli() {
	const watch = process.argv.includes('--watch')
	const spinner = ora({ text: 'Loading configuration...', spinner: 'dots' })
	spinner.start()

	const config = ConfigLoader.load()
	const builder = makeLiquidXBuilder(config)

	spinner.succeed(`Configuration loaded (src: ${config.componentsDir}, out: ${config.output})`)

	builder.on('build:start', () => {
		spinner.start(kleur.blue('Building...'))
	})

	builder.on('build:end', () => {
		spinner.succeed(kleur.green('Build completed successfully!'))
		if (watch) {
			console.log(kleur.dim('\n👀 Watching for changes...'))
		}
	})

	builder.on('file:change', (file) => {
		console.log(kleur.dim(`\n📄 File changed: ${file}`))
	})

	builder.on('error', (error: LiquidxError) => {
		const prefix = error.name === 'ValidationError' ? 'Validation' : 'Build'
		console.log(`\n${kleur.bgRed().white(` ${prefix} Error `)} ${kleur.red(error.message)}`)
		if (error.filePath) {
			console.log(kleur.dim(`   ${error.filePath}`))
		}
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
			if (data.toString() === '\u0003') shutdown()
		})
	}

	await builder.build()

	if (watch) {
		builder.watch()
		return
	}

	shutdown()
}

if (require.main === module) cli()
