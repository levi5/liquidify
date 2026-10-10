import fs from 'node:fs'
import path from 'node:path'
import ora from 'ora'
import kleur from 'kleur'
import { _match, _try } from 'funcio'

const IGNORED_ENTRIES = new Set([
  'node_modules',
  '.shopify',
  '.git',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.liquidify-manifest.json',
])

const EXAMPLE_TEMPLATES = new Set(['theme', 'starter', 'default'])
const FALLBACK_VERSION = '^1.1.0-alpha.4'

export interface InitOptions {
  targetDir: string
  template: string
  force?: boolean
}

interface InitArgState {
  targetDir: string
  template: string
  force: boolean
}

export const normalizeTemplateName = (templateName = 'theme'): string => {
  const clean = (templateName || '').trim().toLowerCase()
  return EXAMPLE_TEMPLATES.has(clean) ? 'theme' : 'theme'
}

export function parseInitArgs(args: string[]): InitOptions {
  const state = consumeArgs(args, 0, { targetDir: '.', template: 'example', force: false })
  const result: InitOptions = { targetDir: state.targetDir, template: normalizeTemplateName(state.template) }
  return _match(state.force)
    .with(true, () => ({ ...result, force: true as const }))
    .with(false, () => result)
    .exec() as InitOptions
}

function consumeArgs(args: string[], index: number, state: InitArgState): InitArgState {
  return _match(index >= args.length)
    .with(true, () => state)
    .with(false, () => consumeArg(args, index, state))
    .exec() as InitArgState
}

function consumeArg(args: string[], index: number, state: InitArgState): InitArgState {
  const arg = args[index]
  return _match(true)
    .with(arg === '--template' || arg === '-t', () => consumeTemplateFlag(args, index, state))
    .with(arg.startsWith('--template=') || arg.startsWith('-t='), () =>
      consumeArgs(args, index + 1, withTemplate(state, templateValue(arg))),
    )
    .with(arg === '--force' || arg === '-f', () => consumeArgs(args, index + 1, { ...state, force: true }))
    .with(arg.startsWith('-'), () => consumeArgs(args, index + 1, state))
    .with(true, () => consumeArgs(args, index + 1, { ...state, targetDir: arg }))
    .exec() as InitArgState
}

function consumeTemplateFlag(args: string[], index: number, state: InitArgState): InitArgState {
  const next = args[index + 1] as string | undefined
  return _match(next !== undefined && !next.startsWith('-'))
    .with(true, () => consumeArgs(args, index + 2, { ...state, template: next as string }))
    .with(false, () => consumeArgs(args, index + 1, state))
    .exec() as InitArgState
}

function templateValue(arg: string): string | undefined {
  const value = _match(arg.startsWith('--template='))
    .with(true, () => arg.slice('--template='.length))
    .with(false, () => arg.slice('-t='.length))
    .exec() as string
  return _match(value === '')
    .with(true, () => undefined)
    .with(false, () => value)
    .exec() as string | undefined
}

function withTemplate(state: InitArgState, value: string | undefined): InitArgState {
  return _match(value === undefined)
    .with(true, () => state)
    .with(false, () => ({ ...state, template: value as string }))
    .exec() as InitArgState
}

export const resolveTemplate = (templateName = 'example'): string => {
  const normalized = normalizeTemplateName(templateName)
  const candidates: string[] = [
    path.resolve(__dirname, '../../../../resources/templates', normalized),
    path.resolve(__dirname, '../../../resources/templates', normalized),
    path.resolve(__dirname, '../../resources/templates', normalized),
    path.resolve(process.cwd(), 'resources/templates', normalized),
    path.resolve(__dirname, '../../../../templates', normalized),
    path.resolve(process.cwd(), 'templates', normalized),
  ]
  const matched = candidates.find(isValidTemplateDir)
  return _match(matched === undefined)
    .with(true, () => {
      throw new Error(`Template "${normalized}" not found. Searched: ${candidates[0]}`)
    })
    .with(false, () => matched as string)
    .exec() as string
}

const isValidTemplateDir = (dir: string): boolean =>
  _try
    .sync(() => !fs.lstatSync(dir).isSymbolicLink() && fs.existsSync(dir) && fs.existsSync(path.join(dir, 'package.json')))
    .match({
      right: (valid) => valid,
      left: () => false,
    })

const getLiquidifyVersion = (): string => {
  const found = candidatePkgPaths()
    .map((pkgPath) => readPackageVersion(pkgPath))
    .find((version) => version !== null)
  return _match(found == null)
    .with(true, () => FALLBACK_VERSION)
    .with(false, () => found as string)
    .exec() as string
}

const candidatePkgPaths = (): string[] => [
  path.resolve(__dirname, '../../../../package.json'),
  path.resolve(__dirname, '../../../package.json'),
  path.resolve(__dirname, '../../package.json'),
  path.resolve(process.cwd(), 'package.json'),
]

const readPackageVersion = (pkgPath: string): string | null =>
  _match(!fs.existsSync(pkgPath))
    .with(true, () => null)
    .with(false, () => parsePackageVersion(pkgPath))
    .exec() as string | null

const parsePackageVersion = (pkgPath: string): string | null =>
  _try
    .sync(() => {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { name?: unknown; version?: unknown }
      return pkg.name === 'liquidify' && typeof pkg.version === 'string' ? `^${pkg.version}` : null
    })
    .match({
      right: (version) => version,
      left: () => null,
    })

const syncPackageName = (targetDir: string, projectName: string): void => {
  _try
    .sync(() => fs.readFileSync(path.join(targetDir, 'package.json'), 'utf-8'))
    .match({
      right: (content) => writePackageName(targetDir, projectName, content),
      left: () => undefined,
    })
}

const writePackageName = (targetDir: string, projectName: string, content: string): void => {
  const pkg = JSON.parse(content) as { name?: string; dependencies?: Record<string, unknown> }
  pkg.name = projectName
  _match(isFileDependency(pkg.dependencies?.liquidify))
    .with(true, () => {
      ;(pkg.dependencies as Record<string, unknown>).liquidify = getLiquidifyVersion()
    })
    .with(false, () => undefined)
    .exec()
  fs.writeFileSync(path.join(targetDir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8')
}

const isFileDependency = (value: unknown): boolean =>
  _match(typeof value === 'string')
    .with(true, () => (value as string).startsWith('file:'))
    .with(false, () => false)
    .exec() as boolean

export const copyTemplate = (sourceDir: string, targetDir: string, projectName: string, force = false) =>
  _try.sync(() => {
    _match(force)
      .with(true, () => undefined)
      .with(false, () => checkConflicts(sourceDir, targetDir))
      .exec()
    fs.mkdirSync(targetDir, { recursive: true })
    fs.cpSync(sourceDir, targetDir, {
      recursive: true,
      force: force,
      errorOnExist: !force,
      filter: (src) => !IGNORED_ENTRIES.has(path.basename(src)),
    })
    syncPackageName(targetDir, projectName)
    rewriteTsConfig(targetDir)
  })

const rewriteTsConfig = (targetDir: string): void => {
  const tsConfigPath = path.join(targetDir, 'tsconfig.json')
  _try
    .sync(() => fs.readFileSync(tsConfigPath, 'utf-8'))
    .match({
      right: (content) => {
        const config = JSON.parse(content)
        if (config.compilerOptions?.paths) {
          delete config.compilerOptions.paths.liquidify
          delete config.compilerOptions.paths.liquidex
          if (Object.keys(config.compilerOptions.paths).length === 0) {
            delete config.compilerOptions.paths
          }
        }
        fs.writeFileSync(tsConfigPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8')
      },
      left: () => undefined,
    })
}

const checkConflicts = (source: string, target: string): void => {
  const existing = statOf(target)
  _match(existing !== null && (!existing.isDirectory() || existing.isSymbolicLink()))
    .with(true, () => {
      throw new Error(`Refusing to overwrite existing path: ${target}. Initialize in an empty directory or use --force.`)
    })
    .with(false, () => undefined)
    .exec()
  fs.readdirSync(source, { withFileTypes: true })
    .filter((entry) => !IGNORED_ENTRIES.has(entry.name))
    .forEach((entry) => {
      checkEntry(source, target, entry)
    })
}

const statOf = (target: string): fs.Stats | null =>
  _try
    .sync(() => fs.lstatSync(target))
    .match({
      right: (stat) => stat,
      left: (error) =>
        _match((error as NodeJS.ErrnoException).code === 'ENOENT')
          .with(true, () => null)
          .with(false, () => {
            throw error
          })
          .exec() as fs.Stats | null,
    })

const checkEntry = (
  source: string,
  target: string,
  entry: { name: string; isDirectory: () => boolean; isSymbolicLink: () => boolean },
): void => {
  const sourceEntry = path.join(source, entry.name)
  _match(entry.isSymbolicLink() || fs.lstatSync(sourceEntry).isSymbolicLink())
    .with(true, () => {
      throw new Error(`Refusing to copy symlink: ${sourceEntry}. Templates must not contain symlinks.`)
    })
    .with(false, () => checkDestination(source, target, entry))
    .exec()
}

const checkDestination = (source: string, target: string, entry: { name: string; isDirectory: () => boolean }): void => {
  _match(entry.isDirectory())
    .with(true, () => checkConflicts(path.join(source, entry.name), path.join(target, entry.name)))
    .with(false, () => ensureAbsent(path.join(target, entry.name)))
    .exec()
}

const ensureAbsent = (destination: string): void => {
  _match(statOf(destination) !== null)
    .with(true, () => {
      throw new Error(`Refusing to overwrite existing file: ${destination}. Initialize in an empty directory or use --force.`)
    })
    .with(false, () => undefined)
    .exec()
}

export const reportInitSuccess = (targetDirArg: string, templateName = 'theme'): void => {
  console.log(kleur.bold().green(`\n✨ Shopify theme structure & Liquidify template (${templateName}) ready!\n`))
  console.log('Next steps:')
  const steps = _match(!targetDirArg || targetDirArg === '.')
    .with(true, () => ['npm install', 'npm run dev'])
    .with(false, () => [`cd ${targetDirArg}`, 'npm install', 'npm run dev'])
    .exec() as string[]
  steps.forEach((step: string, index: number) => {
    console.log(`  ${index + 1}. ${kleur.cyan(step)}`)
  })
  console.log('\nTo preview with Shopify CLI in another terminal:')
  console.log(`  ${kleur.cyan('shopify theme dev')}\n`)
}

export async function runInit(targetDirArg = '.', templateName = 'theme', force = false): Promise<void> {
  const normalized = normalizeTemplateName(templateName)
  const targetDir = path.resolve(process.cwd(), targetDirArg)
  const baseName = path.basename(targetDir)
  const projectName = _match(baseName === '.' || baseName === '')
    .with(true, () => defaultProjectName(normalized))
    .with(false, () => baseName)
    .exec() as string
  console.log(kleur.bold().cyan('\n🚀 Liquidify — Initializing Shopify Project Template\n'))
  console.log(kleur.dim(`Target Directory: ${targetDir}`))
  console.log(kleur.dim(`Template:         ${normalized}\n`))
  const spinner = ora('Copying template files...').start()
  _try
    .sync(() => copyResolvedTemplate(normalized, templateName, targetDir, projectName, force))
    .match({
      right: () => {
        spinner.succeed(kleur.green('Template created successfully!'))
        reportInitSuccess(targetDirArg, normalized)
      },
      left: (error) => {
        spinner.fail(kleur.red(`Failed to initialize template: ${error.message}`))
        process.exit(1)
      },
    })
}

const defaultProjectName = (normalized: string): string =>
  _match(normalized === 'theme')
    .with(true, () => 'liquidify-theme')
    .with(false, () => 'shopify-liquidify-theme')
    .exec() as string

const copyResolvedTemplate = (normalized: string, templateName: string, targetDir: string, projectName: string, force: boolean): true => {
  const sourceDir = resolveTemplate(normalized)
  _match(!fs.existsSync(sourceDir))
    .with(true, () => {
      throw new Error(`Template "${templateName}" not found at ${sourceDir}`)
    })
    .with(false, () => undefined)
    .exec()
  return copyTemplate(sourceDir, targetDir, projectName, force).match({
    right: () => true,
    left: (error) => {
      throw error
    },
  })
}
