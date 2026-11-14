#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { formatHelp, parseCliArgs } from './args'
import { BuildReporter } from './build-reporter'

function packageVersion(): string {
  const filename = path.join(__dirname, '../../../package.json')
  return (JSON.parse(fs.readFileSync(filename, 'utf8')) as { version: string }).version
}

export async function cli(argumentsList: string[] = process.argv.slice(2)): Promise<void> {
  try {
    const options = parseCliArgs(argumentsList)
    if (options.command === 'help') {
      console.log(formatHelp())
      return
    }
    if (options.command === 'version') {
      console.log(options.json ? JSON.stringify({ version: packageVersion() }) : `liquidify ${packageVersion()}`)
      return
    }
    if (!options.noBanner && !options.json && process.stdout.isTTY && !process.env.CI && !process.env.NO_COLOR) {
      console.log('Liquidify — Shopify Liquid + React compiler')
    }
    if (options.command === 'init') {
      const { parseInitArgs, runInit } = await import('./commands/init')
      const initialization = parseInitArgs(options.initArgs)
      await runInit(initialization.targetDir, initialization.template, initialization.force || options.force, options)
    } else if (options.command === 'doctor') {
      const { runDoctor } = await import('./commands/doctor')
      await runDoctor(options)
    } else if (options.command === 'theme-check') {
      const { runThemeCheck } = await import('./commands/theme-check')
      await runThemeCheck(options)
    } else if (options.command === 'generate') {
      const { runGenerate } = await import('./commands/generate')
      await runGenerate(options)
    } else {
      const { runBuild } = await import('./commands/run-build')
      await runBuild(options)
    }
  } catch (error) {
    new BuildReporter({ json: argumentsList.includes('--json') }).failure(error)
    process.exitCode = 1
  }
}

if (typeof require !== 'undefined' && require.main === module) void cli()
