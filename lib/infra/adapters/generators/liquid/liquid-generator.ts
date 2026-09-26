import type { OutputManifest } from './output-manifest'
import { buildLiquidContent } from './liquid-content'
import { join, resolve } from 'node:path'
import { _match, _try, _Array } from 'funcio'

import type { GeneratorOptions, ResolvedGeneratorOptions } from '../../../../core/entities/liquid'
import type { IFileSystem } from '../../../../core/protocols/file-system'
import type { IGenerator } from '../../../../core/protocols/generator'
import type { ParsedComponent } from '../../../../core/entities/parsed-component'
import { assertSafeFileName, toSafeFileName } from '../../../../shared/string'
import { ValidationError } from '../../../../core/errors/validation-error'
import { COMPONENT_TYPES } from '../../../../shared/liquid-constants'
import type { Logger } from '../../../../shared/logger'

export class LiquidFileSystemGenerator implements IGenerator {
  private readonly options: ResolvedGeneratorOptions
  private inBuild = false
  private pendingTouch = false

  constructor(
    options: GeneratorOptions,
    private readonly fileSystem: IFileSystem,
    private readonly logger: Logger,
    private readonly manifest: OutputManifest,
  ) {
    this.options = {
      outputDir: options.outputDir,
      sectionsDir: options.sectionsDir || join(options.outputDir, 'sections'),
      blocksDir: options.blocksDir || join(options.outputDir, 'blocks'),
      snippetsDir: options.snippetsDir || join(options.outputDir, 'snippets'),
      assetsDir: options.assetsDir || join(options.outputDir, 'assets'),
      force: options.force,
    }
  }

  public async beginBuild(files: string[], changed: Set<string>): Promise<void> {
    await this.manifest.begin(files, changed)
    this.inBuild = true
  }

  public async finishBuild(): Promise<void> {
    await this.manifest.finish()
    this.inBuild = false
    if (this.pendingTouch) {
      this.pendingTouch = false
      await this.touchDirectory(this.options.outputDir)
    }
  }

  private async writeOutput(file: string, content: string, sourcePath?: string): Promise<void> {
    await _match(sourcePath === undefined)
      .with(true, () => this.fileSystem.writeFile(file, content))
      .with(false, () => this.manifest.write(sourcePath as string, file, content))
      .exec()
  }

  public async generate(component: ParsedComponent, sourcePath?: string): Promise<void> {
    const effectiveSource = _match(!this.inBuild)
      .with(true, () => undefined)
      .with(false, () => sourcePath)
      .exec() as string | undefined
    await this.ensureDirectories()
    const fileName = toSafeFileName(component.name)
    assertSafeFileName(fileName)
    await _match(this.emitsLiquidFile(component))
      .with(true, () => this.generateLiquidFile(component, fileName, effectiveSource))
      .with(false, () => undefined)
      .exec()
    const scriptGenerated = await this.handleScripts(component, fileName, effectiveSource)
    await this.recordContributions(component, fileName, scriptGenerated, effectiveSource)
    await this.markTouched()
  }

  private async markTouched(): Promise<void> {
    if (this.inBuild) {
      this.pendingTouch = true
      return
    }
    await this.touchDirectory(this.options.outputDir)
  }

  private emitsLiquidFile(component: ParsedComponent): boolean {
    const isScriptOnly = component.mode === 'dom' || component.mode === 'dom:global' || component.mode === 'react'
    const untypedScript = isScriptOnly && component.type === undefined

    return _match(component.mode === 'react' || untypedScript)
      .with(true, () => false)
      .with(false, () => true)
      .exec() as boolean
  }

  private async recordContributions(
    component: ParsedComponent,
    fileName: string,
    scriptGenerated: boolean,
    sourcePath?: string,
  ): Promise<void> {
    _match(sourcePath === undefined)
      .with(true, () => this.appendStandaloneCss(component))
      .with(false, () =>
        this.manifest.contributions(
          sourcePath as string,
          this.contributedScripts(component, fileName, scriptGenerated),
          component.globalCss || '',
        ),
      )
      .exec()
  }

  private contributedScripts(component: ParsedComponent, fileName: string, scriptGenerated: boolean): string[] {
    return _match(component.mode === 'dom:global' && scriptGenerated)
      .with(true, () => [...(component.scriptAssets ?? []), `${fileName}.js`])
      .with(false, () => [])
      .exec() as string[]
  }

  private async appendStandaloneCss(component: ParsedComponent): Promise<void> {
    await _match(!component.globalCss)
      .with(true, () => undefined)
      .with(false, () => this.appendGlobalCss(component.globalCss as string))
      .exec()
  }

  private async handleScripts(component: ParsedComponent, fileName: string, sourcePath?: string): Promise<boolean> {
    return _match(!component.hasScript || !component.script)
      .with(true, () => this.reportEmptyScript(component))
      .with(false, () => this.writeScripts(component, fileName, sourcePath))
      .exec() as Promise<boolean>
  }

  private reportEmptyScript(component: ParsedComponent): boolean {
    _match(!component.hasScript)
      .with(true, () => undefined)
      .with(false, () => this.logger.warn(`Script for ${component.name} is empty but hasScript is true`))
      .exec()
    return false
  }

  private async writeScripts(component: ParsedComponent, fileName: string, sourcePath?: string): Promise<boolean> {
    await this.generateScriptFile(component, fileName, sourcePath)
    return _match(sourcePath !== undefined)
      .with(true, () => true)
      .with(false, () => this.syncGlobalScripts(component, fileName))
      .exec() as Promise<boolean>
  }

  private async syncGlobalScripts(component: ParsedComponent, fileName: string): Promise<boolean> {
    const assets = (component.scriptAssets ?? []).map((asset) => asset.replace(/\.js$/, ''))
    const scripts = _match(component.mode === 'dom:global')
      .with(true, () => [...assets, fileName])
      .with(false, () => [fileName, ...assets])
      .exec() as string[]
    await _Array.forEachAsync(scripts, (script) => this.syncGlobalScript(component, script))
    return true
  }

  private async syncGlobalScript(component: ParsedComponent, script: string): Promise<void> {
    await _match(component.mode === 'dom:global')
      .with(true, () => this.appendGlobalScript(script))
      .with(false, () => this.removeFromGlobalScript(script))
      .exec()
  }

  private async appendGlobalCss(css: string): Promise<void> {
    const trimmed = css.trim()
    await _match(trimmed === '')
      .with(true, () => undefined)
      .with(false, () => this.mergeGlobalCss(css, trimmed))
      .exec()
  }

  private async mergeGlobalCss(css: string, trimmed: string): Promise<void> {
    const globalCssPath = join(this.options.assetsDir, 'global.css')
    const exists = await this.fileSystem.exists(globalCssPath)
    const current = _match(exists)
      .with(true, () => this.fileSystem.readFile(globalCssPath))
      .with(false, () => Promise.resolve(''))
      .exec() as Promise<string>
    const body = await current
    await _match(body.includes(trimmed))
      .with(true, () => undefined)
      .with(false, () => this.fileSystem.appendFile(globalCssPath, this.suffixed(body, css)))
      .exec()
  }

  private suffixed(current: string, css: string): string {
    return _match(current !== '' && !current.endsWith('\n'))
      .with(true, () => `\n${css}`)
      .with(false, () => css)
      .exec() as string
  }

  private async touchDirectory(dir: string): Promise<void> {
    const result = await _try.async(async () => {
      const now = new Date()
      const dirs = [dir, this.options.sectionsDir, this.options.assetsDir, this.options.blocksDir, this.options.snippetsDir]
      await _Array.forEachAsync(dirs, (targetDir) => this.touchTarget(targetDir, now))
    })
    result.match({
      right: () => undefined,
      left: (error) => this.logger.error('Failed to touch directory', error),
    })
  }

  private async touchTarget(targetDir: string, now: Date): Promise<void> {
    await _match(await this.fileSystem.exists(targetDir))
      .with(true, () => this.refreshTarget(targetDir, now))
      .with(false, () => undefined)
      .exec()
  }

  private async refreshTarget(targetDir: string, now: Date): Promise<void> {
    await this.fileSystem.utimes(targetDir, now, now)
    const tempFile = join(targetDir, '.refresh')
    await this.fileSystem.writeFile(tempFile, '')
    await this.fileSystem.unlink(tempFile)
  }

  private async generateLiquidFile(component: ParsedComponent, fileName: string, sourcePath?: string): Promise<void> {
    const targetDir = this.liquidDir(component, sourcePath)
    const liquidPath = join(targetDir, `${fileName}.liquid`)
    const resolvedTarget = resolve(targetDir)
    _match(resolve(liquidPath).startsWith(`${resolvedTarget}/`))
      .with(true, () => undefined)
      .with(false, () => {
        throw new ValidationError(`Unsafe output path for component "${component.name}".`, sourcePath)
      })
      .exec()
    const isNewFile = !(await this.fileSystem.exists(liquidPath))
    await this.writeOutput(liquidPath, buildLiquidContent(component, fileName), sourcePath)
    await _match(isNewFile)
      .with(true, () => this.reportLiquidFile(liquidPath))
      .with(false, () => undefined)
      .exec()
  }

  private liquidDir(component: ParsedComponent, sourcePath?: string): string {
    const type = component.type || 'sections'
    _match(COMPONENT_TYPES.has(type))
      .with(true, () => undefined)
      .with(false, () => {
        throw new ValidationError(`Invalid component type "${type}": expected sections/blocks/snippets.`, sourcePath)
      })
      .exec()
    return this.options[`${type}Dir` as keyof ResolvedGeneratorOptions] as string
  }

  private async reportLiquidFile(liquidPath: string): Promise<void> {
    await this.markTouched()
    this.logger.info(`New file created: ${liquidPath}`)
  }

  private async generateScriptFile(component: ParsedComponent, fileName: string, sourcePath?: string): Promise<void> {
    const scriptPath = join(this.options.assetsDir, `${fileName}.js`)
    const resolvedAssets = resolve(this.options.assetsDir)
    _match(resolve(scriptPath).startsWith(`${resolvedAssets}/`))
      .with(true, () => undefined)
      .with(false, () => {
        throw new ValidationError(`Unsafe script path for component "${component.name}".`, sourcePath)
      })
      .exec()
    const isNewFile = !(await this.fileSystem.exists(scriptPath))
    const result = await _try.async(async () => {
      await this.writeOutput(scriptPath, component.script, sourcePath)
      await _match(isNewFile)
        .with(true, () => this.reportScriptFile(scriptPath))
        .with(false, () => undefined)
        .exec()
    })
    result.match({
      right: () => undefined,
      left: (error) => {
        throw error
      },
    })
  }

  private async reportScriptFile(scriptPath: string): Promise<void> {
    await this.markTouched()
    this.logger.info(`New file created: ${scriptPath}`)
  }

  private async appendGlobalScript(fileName: string): Promise<void> {
    const globalScriptPath = join(this.options.snippetsDir, 'script-global.liquid')
    const exists = await this.fileSystem.exists(globalScriptPath)
    const existingContent = _match(exists)
      .with(true, () => this.fileSystem.readFile(globalScriptPath))
      .with(false, () => Promise.resolve(''))
      .exec() as Promise<string>
    const current = await existingContent
    const scriptMarkup = `<script src="{{ '${fileName}.js' | asset_url }}" defer></script>`
    await _match(current.includes(scriptMarkup))
      .with(true, () => undefined)
      .with(false, () => this.insertGlobalScript(globalScriptPath, current, scriptMarkup))
      .exec()
  }

  private async insertGlobalScript(globalScriptPath: string, existingContent: string, scriptMarkup: string): Promise<void> {
    const separator = _match(existingContent === '')
      .with(true, () => '')
      .with(false, () => '\n')
      .exec() as string
    await this.fileSystem.writeFile(globalScriptPath, existingContent + separator + scriptMarkup)
    await this.touchDirectory(this.options.snippetsDir)
    this.logger.info(`Global script appended to: ${globalScriptPath}`)
  }

  private async removeFromGlobalScript(fileName: string): Promise<void> {
    const globalScriptPath = join(this.options.snippetsDir, 'script-global.liquid')
    await _match(await this.fileSystem.exists(globalScriptPath))
      .with(true, () => this.pruneGlobalScript(globalScriptPath, fileName))
      .with(false, () => undefined)
      .exec()
  }

  private async pruneGlobalScript(globalScriptPath: string, fileName: string): Promise<void> {
    const existingContent = await this.fileSystem.readFile(globalScriptPath)
    const scriptMarkup = `<script src="{{ '${fileName}.js' | asset_url }}" defer></script>`
    await _match(existingContent.includes(scriptMarkup))
      .with(true, () => this.rewriteGlobalScript(globalScriptPath, existingContent, scriptMarkup))
      .with(false, () => undefined)
      .exec()
  }

  private async rewriteGlobalScript(globalScriptPath: string, existingContent: string, scriptMarkup: string): Promise<void> {
    const newContent = existingContent
      .split('\n')
      .filter((line) => line.trim() !== scriptMarkup)
      .join('\n')
    await _match(newContent === existingContent)
      .with(true, () => undefined)
      .with(false, () => this.persistGlobalScript(globalScriptPath, newContent))
      .exec()
  }

  private async persistGlobalScript(globalScriptPath: string, newContent: string): Promise<void> {
    await this.fileSystem.writeFile(globalScriptPath, newContent)
    await this.touchDirectory(this.options.snippetsDir)
    this.logger.info(`Global script removed from: ${globalScriptPath}`)
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = [this.options.sectionsDir, this.options.assetsDir, this.options.snippetsDir, this.options.blocksDir]
    await _Array.forEachAsync(dirs, (dir) => this.ensureDirectory(dir))
    const result = await _try.async(async () => {
      await this.fileSystem.utimes(this.options.outputDir, new Date(), new Date())
    })
    result.match({
      right: () => undefined,
      left: (error) => this.logger.error('Failed to touch output directory', error),
    })
  }

  private async ensureDirectory(dir: string): Promise<void> {
    await _match(await this.fileSystem.exists(dir))
      .with(true, () => undefined)
      .with(false, () => this.createDirectory(dir))
      .exec()
  }

  private async createDirectory(dir: string): Promise<void> {
    await this.fileSystem.mkdir(dir, true)
    await this.fileSystem.writeFile(join(dir, '.gitkeep'), '')
  }
}
