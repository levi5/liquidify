import { validateCliArgs } from './validate-args'

export type CliCommand = 'help' | 'init' | 'build' | 'version' | 'check' | 'doctor' | 'generate' | 'theme-check'

export interface ParsedCliArgs {
  command: CliCommand
  watch: boolean
  force: boolean
  configPath?: string
  noBanner: boolean
  quiet: boolean
  initArgs: string[]
  json?: boolean
  dryRun?: boolean
  verbose?: boolean
  profile?: boolean
  noPlugins?: boolean
  concurrency?: number
  mode?: 'development' | 'production'
  sourcemap?: boolean
}

const VERSION_FLAGS = new Set(['--version', '-V'])
const HELP_FLAGS = new Set(['--help', '-h'])
const WATCH_FLAGS = new Set(['--watch', '-w'])
const FORCE_FLAGS = new Set(['--force', '-f'])
const QUIET_FLAGS = new Set(['--quiet', '-q'])

export function parseCliArgs(args: string[]): ParsedCliArgs {
  const normalized = args ?? []
  validateCliArgs(normalized)
  const watch = normalized.some((arg) => WATCH_FLAGS.has(arg))
  const force = normalized.some((arg) => FORCE_FLAGS.has(arg))
  const quiet = normalized.some((arg) => QUIET_FLAGS.has(arg))
  const noBanner = quiet || normalized.includes('--no-banner')
  const configPath = extractConfigPath(normalized)
  const additional = {
    ...(normalized.includes('--json') ? { json: true } : {}),
    ...(normalized.includes('--dry-run') ? { dryRun: true } : {}),
    ...(normalized.includes('--verbose') ? { verbose: true } : {}),
    ...(normalized.includes('--profile') ? { profile: true } : {}),
    ...(normalized.includes('--no-plugins') ? { noPlugins: true } : {}),
    ...(normalized.includes('--sourcemap') ? { sourcemap: true } : {}),
    ...parseMode(normalized),
    ...parseConcurrency(normalized),
  }
  const common = { watch, force, configPath, noBanner, quiet, ...additional }
  if (normalized.some((arg) => VERSION_FLAGS.has(arg))) {
    return { command: 'version', ...common, initArgs: [] }
  }
  if (normalized.some((arg) => HELP_FLAGS.has(arg))) {
    return { command: 'help', ...common, initArgs: [] }
  }
  if (normalized[0] === 'init') {
    if (watch || additional.dryRun) throw new Error('init does not support --watch or --dry-run.')
    const initArgs = normalized
      .slice(1)
      .filter((argument) => !['--json', '--quiet', '-q', '--no-banner', '--no-plugins'].includes(argument))
    if (configPath || additional.concurrency || additional.mode || additional.sourcemap || additional.profile || additional.verbose) {
      throw new Error('Build configuration and profiling options are not supported by init.')
    }
    return { command: 'init', ...common, initArgs }
  }
  const command = ['check', 'doctor', 'generate', 'theme-check'].includes(normalized[0]) ? (normalized[0] as CliCommand) : 'build'
  if (watch && (command !== 'build' || additional.dryRun)) throw new Error('--watch is only supported for builds that write output.')
  return { command, ...common, initArgs: command === 'generate' ? positionalArguments(normalized.slice(1)) : [] }
}

function positionalArguments(argumentsList: string[]): string[] {
  const positionals: string[] = []
  for (let index = 0; index < argumentsList.length; index++) {
    const argument = argumentsList[index]
    if (['--config', '--concurrency', '--mode'].includes(argument)) index++
    else if (!argument.startsWith('-')) positionals.push(argument)
  }
  return positionals
}

function parseConcurrency(argumentsList: string[]): { concurrency?: number } {
  const flagIndex = argumentsList.findIndex((argument) => argument === '--concurrency' || argument.startsWith('--concurrency='))
  if (flagIndex < 0) return {}
  const flag = argumentsList[flagIndex]
  const concurrency = Number(flag.includes('=') ? flag.slice(flag.indexOf('=') + 1) : argumentsList[flagIndex + 1])
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 64)
    throw new Error('--concurrency requires an integer between 1 and 64.')
  return { concurrency }
}

function parseMode(argumentsList: string[]): { mode?: 'development' | 'production' } {
  const flagIndex = argumentsList.findIndex((argument) => argument === '--mode' || argument.startsWith('--mode='))
  if (flagIndex < 0) return {}
  const flag = argumentsList[flagIndex]
  const mode = flag.includes('=') ? flag.slice(flag.indexOf('=') + 1) : argumentsList[flagIndex + 1]
  if (mode !== 'development' && mode !== 'production') throw new Error('--mode requires development or production.')
  return { mode }
}

function extractConfigPath(args: string[]): string | undefined {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--config' && index + 1 < args.length) return args[index + 1]
    if (arg.startsWith('--config=')) {
      const value = arg.slice('--config='.length).trim()
      if (value) return value
    }
  }
  return undefined
}

export function formatHelp(): string {
  return `
  Usage:
    liquidify [options]
    liquidify init [directory] [options]

  Commands:
    init [dir]      Initialize a new Shopify + Liquidify project template (default: .)
    build           Compile the project (default command)
    check           Validate compilation without writing files
    doctor          Diagnose environment and project configuration
    theme-check     Run installed Shopify Theme Check on compiled output
    generate <kind> <name>  Create a section, snippet or island

  Options:
    --template, -t  Template to initialize (default: theme, options: theme, starter, default)
    --watch, -w     Watch for file changes and rebuild automatically
    --force, -f     Force overwrite existing files during build or init
    --config <path> Use an explicit config file instead of auto-discovery
    --no-banner     Skip the startup banner (also disabled with --quiet, CI=1 or NO_COLOR=1)
    --quiet, -q     Minimal output (implies --no-banner)
    --json          Emit machine-readable JSON (NDJSON in watch mode)
    --dry-run       Preview output changes without writing files
    --no-plugins    Do not load or execute project plugins
    --concurrency <number>  Maximum concurrent files (1-64)
    --verbose       Show compiled and skipped file paths
    --profile       Show total build time
    --mode <name>   development or production (default: production)
    --sourcemap     Include inline JavaScript sourcemaps
    --version, -V   Show version
    --help, -h      Show help
`
}
