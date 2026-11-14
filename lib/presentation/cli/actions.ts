import fs from 'node:fs'
import path from 'node:path'
import { formatHelp, type ParsedCliArgs, type CliCommand } from '@presentation/cli/args'

type CommandAction = (options: ParsedCliArgs) => Promise<void>

async function runCompilation(options: ParsedCliArgs): Promise<void> {
  const { runBuild } = await import('@presentation/cli/commands/run-build')
  await runBuild(options)
}

const actions: Record<CliCommand, CommandAction> = {
  help: async () => {
    console.log(formatHelp())
  },
  version: async (options) => {
    const filename = path.join(__dirname, '../../../package.json')
    const { version } = JSON.parse(fs.readFileSync(filename, 'utf8')) as { version: string }
    console.log(options.json ? JSON.stringify({ version }) : `liquidify ${version}`)
  },
  init: async (options) => {
    const { parseInitArgs, runInit } = await import('@presentation/cli/commands/init')
    const initialization = parseInitArgs(options.initArgs)
    await runInit(initialization.targetDir, initialization.template, initialization.force || options.force, options)
  },
  doctor: async (options) => {
    const { runDoctor } = await import('@presentation/cli/commands/doctor')
    await runDoctor(options)
  },
  'theme-check': async (options) => {
    const { runThemeCheck } = await import('@presentation/cli/commands/theme-check')
    await runThemeCheck(options)
  },
  generate: async (options) => {
    const { runGenerate } = await import('@presentation/cli/commands/generate')
    await runGenerate(options)
  },
  build: runCompilation,
  check: runCompilation,
}

export function executeCliAction(options: ParsedCliArgs): Promise<void> {
  return actions[options.command](options)
}
