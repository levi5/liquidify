import path from 'node:path'
import { normalizeTemplateName } from './arguments'
import { resolveTemplate } from './template-source'
import { copyTemplate } from './template-copy'

export function reportInitSuccess(targetDirectory: string, templateName = 'theme'): void {
  console.log(`Shopify theme & Liquidify template (${templateName}) ready!`)
  if (targetDirectory && targetDirectory !== '.') console.log(`  cd ${targetDirectory}`)
  console.log('  npm install\n  npm run dev\n\nPreview in another terminal:\n  shopify theme dev')
}

export async function runInit(
  targetDirectory = '.',
  templateName = 'theme',
  force = false,
  options: { quiet?: boolean; json?: boolean } = {},
): Promise<void> {
  const template = normalizeTemplateName(templateName)
  const directory = path.resolve(targetDirectory)
  const projectName = path.basename(directory) || 'liquidify-theme'
  const result = copyTemplate(resolveTemplate(template), directory, projectName, force)
  result.match({
    right: () => {
      if (options.json) console.log(JSON.stringify({ status: 'success', directory, template }))
      else if (!options.quiet) reportInitSuccess(targetDirectory, template)
    },
    left: (error) => {
      throw error
    },
  })
}
