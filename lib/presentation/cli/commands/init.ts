import fs from 'node:fs'
import path from 'node:path'
import ora from 'ora'
import kleur from 'kleur'
import { _Maybe, _match, _try } from 'funcio'

const IGNORED_ENTRIES = new Set([
  'node_modules',
  '.shopify',
  '.git',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.liquidify-manifest.json',
])

export interface InitOptions {
  targetDir: string
  template: string
  force?: boolean
}

export const normalizeTemplateName = (templateName = 'shopify-starter'): string => {
  const clean = (templateName || '').trim().toLowerCase()
  if (['example', 'fashion', 'store', 'fashion-store'].includes(clean)) {
    return 'example'
  }
  if (['shopify-starter', 'starter', 'start', 'default'].includes(clean)) {
    return 'shopify-starter'
  }
  return clean || 'shopify-starter'
}

export function parseInitArgs(args: string[]): InitOptions {
  let targetDir = '.'
  let template = 'shopify-starter'
  let force = false
  let i = 0

  while (i < args.length) {
    const arg = args[i]
    if (arg === '--template' || arg === '-t') {
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        template = args[i + 1]
        i += 2
      } else {
        template = 'example'
        i += 1
      }
    } else if (arg.startsWith('--template=')) {
      template = arg.slice('--template='.length) || 'example'
      i += 1
    } else if (arg.startsWith('-t=')) {
      template = arg.slice('-t='.length) || 'example'
      i += 1
    } else if (arg === '--force' || arg === '-f') {
      force = true
      i += 1
    } else if (!arg.startsWith('-')) {
      targetDir = arg
      i += 1
    } else {
      i += 1
    }
  }

  const result: InitOptions = { targetDir, template: normalizeTemplateName(template) }
  if (force) result.force = true
  return result
}

export const resolveTemplate = (templateName = 'shopify-starter'): string => {
  const normalized = normalizeTemplateName(templateName)

  const isValidTemplateDir = (dir: string): boolean => {
    try {
      return fs.existsSync(dir) && fs.existsSync(path.join(dir, 'package.json'))
    } catch {
      return false
    }
  }

  const candidates: string[] = [
    path.resolve(__dirname, '../../../../resources/templates', normalized),
    path.resolve(__dirname, '../../../resources/templates', normalized),
    path.resolve(__dirname, '../../resources/templates', normalized),
    path.resolve(process.cwd(), 'resources/templates', normalized),
    path.resolve(__dirname, '../../../../templates', normalized),
    path.resolve(process.cwd(), 'templates', normalized),
  ]

  const matched = candidates.find(isValidTemplateDir)
  return _Maybe.of(matched).getOrElse(candidates[0]) as string
}

const getLiquidifyVersion = (): string => {
  const candidatePkgPaths = [
    path.resolve(__dirname, '../../../../package.json'),
    path.resolve(__dirname, '../../../package.json'),
    path.resolve(__dirname, '../../package.json'),
    path.resolve(process.cwd(), 'package.json'),
  ]
  for (const pkgPath of candidatePkgPaths) {
    try {
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
        if (pkg.name === 'liquidify' && pkg.version) {
          return `^${pkg.version}`
        }
      }
    } catch {}
  }
  return '^1.1.0-alpha.4'
}

const syncPackageName = (targetDir: string, projectName: string): void => {
  const packageJsonPath = path.join(targetDir, 'package.json')
  const readResult = _try.sync(() => fs.readFileSync(packageJsonPath, 'utf-8'))

  readResult.match({
    right: (content) => {
      const pkg = JSON.parse(content)
      pkg.name = projectName
      if (pkg.dependencies?.liquidify?.startsWith('file:')) {
        pkg.dependencies.liquidify = getLiquidifyVersion()
      }
      fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8')
    },
    left: () => {},
  })
}

export const copyTemplate = (sourceDir: string, targetDir: string, projectName: string, force = false) => {
  return _try.sync(() => {
    const checkConflicts = (source: string, target: string): void => {
      if (force) return
      const existing = (() => {
        try {
          return fs.lstatSync(target)
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
          throw error
        }
      })()
      if (existing && (!existing.isDirectory() || existing.isSymbolicLink())) {
        throw new Error(`Refusing to overwrite existing path: ${target}. Initialize in an empty directory or use --force.`)
      }
      for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
        if (IGNORED_ENTRIES.has(entry.name)) continue
        const destination = path.join(target, entry.name)
        if (entry.isDirectory()) checkConflicts(path.join(source, entry.name), destination)
        else {
          try {
            fs.lstatSync(destination)
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue
            throw error
          }
          throw new Error(`Refusing to overwrite existing file: ${destination}. Initialize in an empty directory or use --force.`)
        }
      }
    }
    checkConflicts(sourceDir, targetDir)
    fs.mkdirSync(targetDir, { recursive: true })
    fs.cpSync(sourceDir, targetDir, {
      recursive: true,
      force: force,
      errorOnExist: !force,
      filter: (src) => !IGNORED_ENTRIES.has(path.basename(src)),
    })
    syncPackageName(targetDir, projectName)
  })
}

export const reportInitSuccess = (targetDirArg: string, templateName = 'shopify-starter'): void => {
  console.log(kleur.bold().green(`\n✨ Shopify theme structure & Liquidify template (${templateName}) ready!\n`))
  console.log('Next steps:')

  const isCurrentDir = !targetDirArg || targetDirArg === '.'
  const steps = _match(isCurrentDir)
    .with(true, () => ['npm install', 'npm run dev'])
    .with(false, () => [`cd ${targetDirArg}`, 'npm install', 'npm run dev'])
    .exec()

  steps.forEach((step: string, index: number) => {
    console.log(`  ${index + 1}. ${kleur.cyan(step)}`)
  })

  console.log('\nTo preview with Shopify CLI in another terminal:')
  console.log(`  ${kleur.cyan('shopify theme dev')}\n`)
}

export async function runInit(targetDirArg = '.', templateName = 'shopify-starter', force = false): Promise<void> {
  const normalized = normalizeTemplateName(templateName)
  const targetDir = path.resolve(process.cwd(), targetDirArg)
  const baseName = path.basename(targetDir)
  const isDefaultName = baseName === '.' || !baseName
  const projectName = _match(isDefaultName)
    .with(true, () => (normalized === 'example' ? 'liquidify-fashion-theme' : 'shopify-liquidify-theme'))
    .with(false, () => baseName)
    .exec()

  console.log(kleur.bold().cyan('\n🚀 Liquidify — Initializing Shopify Project Template\n'))
  console.log(kleur.dim(`Target Directory: ${targetDir}`))
  console.log(kleur.dim(`Template:         ${normalized}\n`))

  const spinner = ora('Copying template files...').start()

  const copyResult = _try.sync(() => {
    const sourceDir = resolveTemplate(normalized)
    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Template "${templateName}" not found at ${sourceDir}`)
    }
    const result = copyTemplate(sourceDir, targetDir, projectName, force)
    return result.isLeft()
      ? (() => {
          throw result.value
        })()
      : true
  })

  copyResult.match({
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
