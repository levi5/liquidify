import fs from 'node:fs'
import path from 'node:path'
import ora from 'ora'
import kleur from 'kleur'
import { _Maybe, _match } from 'funcio'
import { _try } from 'funcio/lib/Monads/Either'

export const resolveTemplate = (templateName = 'shopify-starter'): string => {
  const candidates = [
    path.resolve(__dirname, '../../../../resources/templates', templateName),
    path.resolve(__dirname, '../../../resources/templates', templateName),
    path.resolve(__dirname, '../../resources/templates', templateName),
    path.resolve(process.cwd(), 'resources/templates', templateName),
    path.resolve(__dirname, '../../../../templates', templateName),
    path.resolve(process.cwd(), 'templates', templateName),
  ]

  const matched = candidates.find((dir) => fs.existsSync(dir))
  return _Maybe.of(matched).getOrElse(candidates[0]) as string
}

const syncPackageName = (targetDir: string, projectName: string): void => {
  const packageJsonPath = path.join(targetDir, 'package.json')
  const readResult = _try.sync(() => fs.readFileSync(packageJsonPath, 'utf-8'))

  readResult.match({
    right: (content) => {
      const pkg = JSON.parse(content)
      pkg.name = projectName
      fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8')
    },
    left: () => {},
  })
}

export const copyTemplate = (sourceDir: string, targetDir: string, projectName: string) => {
  return _try.sync(() => {
    const checkConflicts = (source: string, target: string): void => {
      const existing = (() => {
        try {
          return fs.lstatSync(target)
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
          throw error
        }
      })()
      if (existing && (!existing.isDirectory() || existing.isSymbolicLink())) {
        throw new Error(`Refusing to overwrite existing path: ${target}. Initialize in an empty directory.`)
      }
      for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
        const destination = path.join(target, entry.name)
        if (entry.isDirectory()) checkConflicts(path.join(source, entry.name), destination)
        else {
          try {
            fs.lstatSync(destination)
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue
            throw error
          }
          throw new Error(`Refusing to overwrite existing file: ${destination}. Initialize in an empty directory.`)
        }
      }
    }
    checkConflicts(sourceDir, targetDir)
    fs.mkdirSync(targetDir, { recursive: true })
    fs.cpSync(sourceDir, targetDir, { recursive: true, force: false, errorOnExist: true })
    syncPackageName(targetDir, projectName)
  })
}

export const reportInitSuccess = (targetDirArg: string): void => {
  console.log(kleur.bold().green('\n✨ Shopify theme structure & Liquidify template ready!\n'))
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

export async function runInit(targetDirArg = '.'): Promise<void> {
  const targetDir = path.resolve(process.cwd(), targetDirArg)
  const baseName = path.basename(targetDir)
  const isDefaultName = baseName === '.' || !baseName
  const projectName = _match(isDefaultName)
    .with(true, () => 'shopify-liquidify-theme')
    .with(false, () => baseName)
    .exec()

  console.log(kleur.bold().cyan('\n🚀 Liquidify — Initializing Shopify Project Template\n'))
  console.log(kleur.dim(`Target Directory: ${targetDir}\n`))

  const spinner = ora('Copying template files...').start()

  const copyResult = _try.sync(() => {
    const sourceDir = resolveTemplate('shopify-starter')
    const result = copyTemplate(sourceDir, targetDir, projectName)
    return result.isLeft()
      ? (() => {
          throw result.value
        })()
      : true
  })

  copyResult.match({
    right: () => {
      spinner.succeed(kleur.green('Template created successfully!'))
      reportInitSuccess(targetDirArg)
    },
    left: (error) => {
      spinner.fail(kleur.red(`Failed to initialize template: ${error.message}`))
      process.exit(1)
    },
  })
}
