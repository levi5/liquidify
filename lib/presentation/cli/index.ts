#!/usr/bin/env node
import { parseCliArgs } from '@presentation/cli/args'
import { BuildReporter } from '@presentation/cli/build-reporter'
import { executeCliAction } from '@presentation/cli/actions'

export async function cli(argumentsList: string[] = process.argv.slice(2)): Promise<void> {
  try {
    const options = parseCliArgs(argumentsList)
    const informational = options.command === 'help' || options.command === 'version'
    if (!informational && !options.noBanner && !options.json && process.stdout.isTTY && !process.env.CI && !process.env.NO_COLOR) {
      console.log('Liquidify — Shopify Liquid + React compiler')
    }
    await executeCliAction(options)
  } catch (error) {
    new BuildReporter({ json: argumentsList.includes('--json') }).failure(error)
    process.exitCode = 1
  }
}

if (typeof require !== 'undefined' && require.main === module) void cli()
