import { OutputManifest } from './output-manifest'
import { join } from 'node:path'
import { _Array, _Maybe, _match, _try } from 'funcio'

import type { GeneratorOptions, ResolvedGeneratorOptions } from '../../../../core/entities/liquid'
import type { IFileSystem } from '../../../../core/protocols/file-system'
import type { IGenerator } from '../../../../core/protocols/generator'
import type { ParsedComponent } from '../../../../core/entities/parsed-component'
import { pascalToKebab } from '../../../../shared/string'

export class LiquidFileSystemGenerator implements IGenerator {
  private readonly options: ResolvedGeneratorOptions
  private readonly fileSystem: IFileSystem
  private readonly manifest: OutputManifest
  private inBuild = false

  constructor(options: GeneratorOptions, fileSystem: IFileSystem) {
    this.options = {
      outputDir: options.outputDir,
      sectionsDir: options.sectionsDir || join(options.outputDir, 'sections'),
      blocksDir: options.blocksDir || join(options.outputDir, 'blocks'),
      snippetsDir: options.snippetsDir || join(options.outputDir, 'snippets'),
      assetsDir: options.assetsDir || join(options.outputDir, 'assets'),
    }
    this.fileSystem = fileSystem
    this.manifest = new OutputManifest(options.outputDir, fileSystem)
  }

  public async beginBuild(files: string[], changed: Set<string>): Promise<void> {
    await this.manifest.begin(files, changed)
    this.inBuild = true
  }

  public async finishBuild(): Promise<void> {
    await this.manifest.finish()
    this.inBuild = false
  }

  private async writeOutput(file: string, content: string, sourcePath?: string): Promise<void> {
    if (sourcePath) await this.manifest.write(sourcePath, file, content)
    else await this.fileSystem.writeFile(file, content)
  }

  public async generate(component: ParsedComponent, sourcePath?: string): Promise<void> {
    if (!this.inBuild) sourcePath = undefined
    await this.ensureDirectories()

    const fileName = pascalToKebab(component.name)

    if (component.mode !== 'react') {
      await this.generateLiquidFile(component, fileName, sourcePath)
    }

    await this.handleScripts(component, fileName, sourcePath)

    if (sourcePath) {
      const scripts = component.mode === 'dom:global' && component.hasScript ? [...(component.scriptAssets || []), `${fileName}.js`] : []
      this.manifest.contributions(sourcePath, scripts, component.globalCss || '')
    }
    if (component.globalCss && !sourcePath) {
      await this.appendGlobalCss(component.globalCss)
    }

    await this.touchDirectory(this.options.outputDir)
  }

  private async handleScripts(component: ParsedComponent, fileName: string, sourcePath?: string): Promise<void> {
    if (!component.hasScript) return

    if (!component.script) {
      console.warn(`⚠️ Script for ${component.name} is empty but hasScript is true`)
      return
    }

    await this.generateScriptFile(component, fileName, sourcePath)
    if (sourcePath) return

    const scriptAssets = component.scriptAssets?.map((asset) => asset.replace(/\.js$/, '')) || []
    const scripts = component.mode === 'dom:global' ? [...scriptAssets, fileName] : [fileName, ...scriptAssets]

    for (const script of scripts) {
      if (component.mode === 'dom:global') {
        await this.appendGlobalScript(script)
      } else {
        await this.removeFromGlobalScript(script)
      }
    }
  }

  private async appendGlobalCss(css: string): Promise<void> {
    const globalCssPath = join(this.options.assetsDir, 'global.css')
    const trimmed = css.trim()
    return _match(!trimmed)
      .with(true, () => Promise.resolve())
      .with(!trimmed, async () => {
        const exists = await this.fileSystem.exists(globalCssPath)
        const current = await _Maybe
          .of(exists)
          .map((found) => (found ? this.fileSystem.readFile(globalCssPath) : Promise.resolve('')))
          .getOrElse(Promise.resolve(''))
        return _match(current.includes(trimmed))
          .with(true, () => Promise.resolve())
          .with(current.includes(trimmed), () =>
            this.fileSystem.appendFile(globalCssPath, current && !current.endsWith('\n') ? `\n${css}` : css),
          )
          .exec()
      })
      .exec()
  }

  private async touchDirectory(dir: string): Promise<void> {
    const result = await _try.async(async () => {
      const now = new Date()
      const dirs = [dir, this.options.sectionsDir, this.options.assetsDir, this.options.blocksDir, this.options.snippetsDir]

      await _Array.forEachAsync(dirs, async (targetDir) => {
        if (await this.fileSystem.exists(targetDir)) {
          await this.fileSystem.utimes(targetDir, now, now)

          const tempFile = join(targetDir, '.refresh')
          await this.fileSystem.writeFile(tempFile, '')
          await this.fileSystem.unlink(tempFile)
        }
      })
    })

    if (result.isLeft()) {
      console.error('Failed to touch directory', result.value)
    }
  }

  private async generateLiquidFile(component: ParsedComponent, fileName: string, sourcePath?: string): Promise<void> {
    const type = component.type || 'sections'
    const targetDirName = `${type}Dir` as keyof ResolvedGeneratorOptions
    const targetDir = this.options[targetDirName] as string
    const liquidPath = join(targetDir, `${fileName}.liquid`)
    const isNewFile = !(await this.fileSystem.exists(liquidPath))

    const content = this.buildLiquidContent(component, fileName)

    await this.writeOutput(liquidPath, content, sourcePath)

    if (isNewFile) {
      await this.touchDirectory(this.options.sectionsDir)
      console.log(`   🆕 New file created: ${liquidPath}`)
    }
  }

  private buildLiquidContent(component: ParsedComponent, fileName: string): string {
    let content = ''

    if (component.liquidAssignments && component.liquidAssignments.length > 0) {
      content += `${component.liquidAssignments.join('\n')}\n\n`
    }

    content += this.formatHtml(component.html)

    if (component.mode !== 'dom:global') {
      const scriptAssets = component.scriptAssets || []
      const scriptsToInclude: string[] = []

      if (component.type !== 'snippets' && component.hasScript && !scriptAssets.includes(`${fileName}.js`)) {
        scriptsToInclude.push(`${fileName}.js`)
      }

      scriptsToInclude.push(...scriptAssets)

      for (const script of scriptsToInclude) {
        content += this.buildScriptTag(script)
      }
    }

    if (component.type !== 'snippets') {
      const schemaData = this.buildSchema(component)
      const schemaJson = JSON.stringify(schemaData, null, 2)
      content += `\n\n{% schema %}\n${schemaJson}\n{% endschema %}`
    }

    if (component.css) {
      content += `\n\n{% stylesheet %}\n${component.css}{% endstylesheet %}`
    }

    return content
  }

  private buildScriptTag(scriptFile: string): string {
    const scriptName = scriptFile.replace(/\.js$/, '')
    const scriptVar = `script_${scriptName.replace(/[^a-zA-Z0-9]/g, '_')}_loaded`
    return `\n\n{%- unless ${scriptVar} -%}\n  <script src="{{ '${scriptFile}' | asset_url }}" defer></script>\n  {%- assign ${scriptVar} = true -%}\n{%- endunless -%}`
  }

  private buildSchema(component: ParsedComponent): Record<string, any> {
    const baseSchema = component.schema || {}
    const hasBlocks = component.blocksSchema && component.blocksSchema.length > 0

    return {
      ...baseSchema,
      ...(hasBlocks ? { blocks: component.blocksSchema } : {}),
    }
  }

  private async generateScriptFile(component: ParsedComponent, fileName: string, sourcePath?: string): Promise<void> {
    const scriptPath = join(this.options.assetsDir, `${fileName}.js`)
    const isNewFile = !(await this.fileSystem.exists(scriptPath))

    const result = await _try.async(async () => {
      await this.writeOutput(scriptPath, component.script, sourcePath)

      if (isNewFile) {
        await this.touchDirectory(this.options.assetsDir)
        console.log(`🆕 New file created: ${scriptPath}`)
      }
    })

    if (result.isLeft()) {
      throw result.value
    }
  }

  private async appendGlobalScript(fileName: string): Promise<void> {
    const globalScriptPath = join(this.options.snippetsDir, 'script-global.liquid')
    let existingContent = ''

    if (await this.fileSystem.exists(globalScriptPath)) {
      existingContent = await this.fileSystem.readFile(globalScriptPath)
    }

    const scriptMarkup = `<script src="{{ '${fileName}.js' | asset_url }}" defer></script>`

    if (!existingContent.includes(scriptMarkup)) {
      const separator = existingContent ? '\n' : ''
      await this.fileSystem.writeFile(globalScriptPath, existingContent + separator + scriptMarkup)
      await this.touchDirectory(this.options.snippetsDir)
      console.log(`   📝 Global script appended to: ${globalScriptPath}`)
    }
  }

  private async removeFromGlobalScript(fileName: string): Promise<void> {
    const globalScriptPath = join(this.options.snippetsDir, 'script-global.liquid')

    if (!(await this.fileSystem.exists(globalScriptPath))) return

    const existingContent = await this.fileSystem.readFile(globalScriptPath)
    const scriptMarkup = `<script src="{{ '${fileName}.js' | asset_url }}" defer></script>`

    if (existingContent.includes(scriptMarkup)) {
      const lines = existingContent.split('\n').filter((line) => line.trim() !== scriptMarkup)
      const newContent = lines.join('\n')

      if (newContent !== existingContent) {
        await this.fileSystem.writeFile(globalScriptPath, newContent)
        await this.touchDirectory(this.options.snippetsDir)
        console.log(`   📝 Global script removed from: ${globalScriptPath}`)
      }
    }
  }

  private formatHtml(html: string): string {
    let indent = 0
    const tokens = html.split(/(<[^>]+>)/g).filter(Boolean)

    return tokens
      .map((token) => {
        const trimmed = token.trim()
        if (!trimmed) return null

        if (token.match(/^<\/\w+>$/)) {
          indent--
          return '  '.repeat(Math.max(0, indent)) + token
        }

        const line = '  '.repeat(Math.max(0, indent)) + (token.startsWith('<') ? token : trimmed)

        if (token.match(/^<\w+[^>]*>$/) && !token.match(/\/>$/)) {
          indent++
        }

        return line
      })
      .filter(Boolean)
      .join('\n')
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = [this.options.sectionsDir, this.options.assetsDir, this.options.snippetsDir, this.options.blocksDir]

    await _Array.forEachAsync(dirs, async (dir) => {
      if (!(await this.fileSystem.exists(dir))) {
        await this.fileSystem.mkdir(dir, true)
        const gitkeep = join(dir, '.gitkeep')
        await this.fileSystem.writeFile(gitkeep, '')
      }
    })

    await _try.async(async () => {
      const now = new Date()
      await this.fileSystem.utimes(this.options.outputDir, now, now)
    })
  }
}
