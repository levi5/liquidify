export type CliCommand = 'help' | 'init' | 'build' | 'version'

export interface ParsedCliArgs {
  command: CliCommand
  watch: boolean
  force: boolean
  configPath?: string
  noBanner: boolean
  quiet: boolean
  initArgs: string[]
}

const VERSION_FLAGS = new Set(['--version', '-V'])
const HELP_FLAGS = new Set(['--help', '-h'])
const WATCH_FLAGS = new Set(['--watch', '-w'])
const FORCE_FLAGS = new Set(['--force', '-f'])
const QUIET_FLAGS = new Set(['--quiet', '-q'])

export function parseCliArgs(args: string[]): ParsedCliArgs {
  const normalized = args ?? []
  const watch = normalized.some((arg) => WATCH_FLAGS.has(arg))
  const force = normalized.some((arg) => FORCE_FLAGS.has(arg))
  const quiet = normalized.some((arg) => QUIET_FLAGS.has(arg))
  const noBanner = quiet || normalized.includes('--no-banner')
  const configPath = extractConfigPath(normalized)
  if (normalized.some((arg) => VERSION_FLAGS.has(arg))) {
    return { command: 'version', watch, force, configPath, noBanner, quiet, initArgs: [] }
  }
  if (normalized.some((arg) => HELP_FLAGS.has(arg))) {
    return { command: 'help', watch, force, configPath, noBanner, quiet, initArgs: [] }
  }
  if (normalized[0] === 'init') {
    return { command: 'init', watch, force, configPath, noBanner, quiet, initArgs: normalized.slice(1) }
  }
  return { command: 'build', watch, force, configPath, noBanner, quiet, initArgs: [] }
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

  Options:
    --template, -t  Template to initialize (default: example, options: example)
    --watch, -w     Watch for file changes and rebuild automatically
    --force, -f     Force overwrite existing files during build or init
    --config <path> Use an explicit config file instead of auto-discovery
    --no-banner     Skip the startup banner (also disabled with --quiet, CI=1 or NO_COLOR=1)
    --quiet, -q     Minimal output (implies --no-banner)
    --version, -V   Show version
    --help, -h      Show help
`
}
