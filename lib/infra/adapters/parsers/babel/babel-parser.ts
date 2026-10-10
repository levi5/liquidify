import path from 'node:path'
import traverse, { type NodePath } from '@babel/traverse'
import { _match } from 'funcio'
import { isIdentifier, type CallExpression, type File, type Statement } from '@babel/types'
import type { ASTParser } from './ASTParser'
import type { Compiler } from '../../../../core/protocols/compiler'
import type { ComponentExtractor } from './component'
import type { CSSImportExtractor } from './css/import-extractor'
import type { IParser } from '../../../../core/protocols/parser'
import type { LiquidParser, ReactComponentConfig } from './liquid-parser'
import type { ParsedComponent } from '../../../../core/entities/parsed-component'
import type { ReactComponentCompiler } from '../../compilers/react/component-compiler'
import type { SchemaExtractor } from './schema/schema-extractor'
import type { ScriptGenerator } from './script/script-generator'
import type { ComponentMetadataType } from '../../../../types/component'
import type { JSXResult } from '../../../../types/liquid'
import { ValidationError } from '../../../../core/errors/validation-error'
import { ErrorCollector } from '../../../../core/errors/error-collector'

export interface BabelLiquidParserOptions {
  astParser?: ASTParser
  compiler?: Compiler
  componentExtractor?: ComponentExtractor
  cssExtractor?: CSSImportExtractor
  jsxConverter?: LiquidParser
  reactCompiler?: ReactComponentCompiler
  schemaExtractor?: SchemaExtractor
  scriptGenerator?: ScriptGenerator
}

const FORBIDDEN_REACT_FILTERS = new Set([
  'markdownify',
  'handleize',
  'downcase',
  'upcase',
  'strip',
  'strip_html',
  'money',
  'money_without_currency',
])

const emptyJsx = (): JSXResult => ({ html: '', blocksSchema: [], scriptAssets: [] })

export class BabelLiquidParser implements IParser {
  private readonly astParser: ASTParser
  private readonly componentExtractor: ComponentExtractor
  private readonly schemaExtractor: SchemaExtractor
  private readonly scriptGenerator: ScriptGenerator
  private readonly jsxConverter: LiquidParser
  private readonly reactCompiler: ReactComponentCompiler
  private readonly cssExtractor: CSSImportExtractor

  constructor(options: BabelLiquidParserOptions) {
    const missing = (
      ['astParser', 'componentExtractor', 'schemaExtractor', 'scriptGenerator', 'jsxConverter', 'reactCompiler', 'cssExtractor'] as const
    ).filter((key) => !options[key])
    _match(missing.length > 0)
      .with(true, () => {
        throw new ValidationError(`BabelLiquidParser missing dependencies: ${missing.join(', ')}.`)
      })
      .with(false, () => undefined)
      .exec()
    this.astParser = options.astParser as ASTParser
    this.componentExtractor = options.componentExtractor as ComponentExtractor
    this.schemaExtractor = options.schemaExtractor as SchemaExtractor
    this.scriptGenerator = options.scriptGenerator as ScriptGenerator
    this.jsxConverter = options.jsxConverter as LiquidParser
    this.reactCompiler = options.reactCompiler as ReactComponentCompiler
    this.cssExtractor = options.cssExtractor as CSSImportExtractor
  }

  public setReactRegistry(registry: Map<string, ReactComponentConfig>): void {
    this.jsxConverter.setReactRegistry(registry)
  }

  public async parse(source: string, filePath?: string): Promise<ParsedComponent> {
    const collector = new ErrorCollector()
    const component = await this.parseComponent(source, filePath, collector)
    collector.throwIfErrors()
    return component
  }

  private async parseComponent(source: string, filePath: string | undefined, collector: ErrorCollector): Promise<ParsedComponent> {
    const ast = this.astParser.parse(source, filePath)
    const componentMetadata = this.componentExtractor.extract(ast, source)
    this.applyFileNameFallback(componentMetadata, filePath)
    const schema = this.schemaExtractor.extract(ast, filePath)
    return _match(componentMetadata.mode === 'react')
      .with(true, () => this.parseReactMode(ast, source, componentMetadata, schema, filePath))
      .with(false, () => this.handleDefaultMode(ast, componentMetadata, schema, filePath, collector))
      .exec() as Promise<ParsedComponent>
  }

  private applyFileNameFallback(metadata: ComponentMetadataType, filePath?: string): void {
    _match(!metadata.name && metadata.liquidBody != null && filePath !== undefined)
      .with(true, () => {
        metadata.name = path.basename(filePath as string, path.extname(filePath as string))
      })
      .with(false, () => undefined)
      .exec()
  }

  private async parseReactMode(
    ast: File,
    source: string,
    metadata: ComponentMetadataType,
    schema: Record<string, unknown>,
    filePath?: string,
  ): Promise<ParsedComponent> {
    this.validateNoLiquidFiltersInReact(ast, filePath)
    return this.handleReactMode(ast, source, metadata, schema, filePath)
  }

  private validateNoLiquidFiltersInReact(ast: File, filePath?: string): void {
    traverse(ast, {
      CallExpression: (pathNode: NodePath<CallExpression>) => this.checkFilterCall(pathNode, filePath),
    })
  }

  private checkFilterCall(pathNode: NodePath<CallExpression>, filePath?: string): void {
    const callee = pathNode.node.callee
    _match(isIdentifier(callee) && FORBIDDEN_REACT_FILTERS.has(callee.name))
      .with(true, () => {
        throw new ValidationError(
          `Liquid filter method '${(callee as { name: string }).name}' cannot be used inside a React component. It is a Liquid-only filter.`,
          filePath,
        )
      })
      .with(false, () => undefined)
      .exec()
  }

  private async handleReactMode(
    ast: File,
    source: string,
    metadata: ComponentMetadataType,
    schema: Record<string, unknown>,
    filePath?: string,
  ): Promise<ParsedComponent> {
    const reactBuild = await this.reactCompiler.compile(metadata, source, filePath)
    const componentCss = _match(filePath === undefined)
      .with(true, () => '')
      .with(false, () => this.cssExtractor.extract(ast, filePath as string).componentCss)
      .exec() as string
    const combinedCss = `${_match(!reactBuild.css)
      .with(true, () => '')
      .with(false, () => reactBuild.css as string)
      .exec()}\n${componentCss}`.trim()
    const html = _match(combinedCss === '')
      .with(true, () => reactBuild.html)
      .with(false, () => `<style>\n${combinedCss}\n</style>\n${reactBuild.html}`)
      .exec() as string
    return {
      name: metadata.name,
      html,
      script: reactBuild.script,
      liquidAssignments: metadata.liquidAssignments,
      type: metadata.type,
      hasScript: true,
      schema,
      blocksSchema: [],
      mode: metadata.mode,
      css: '',
      globalCss: '',
      hasUncoveredJs: false,
      hasJsLogic: true,
      hasImplicitReturn: metadata.hasImplicitReturn,
    }
  }

  private handleDefaultMode(
    ast: File,
    metadata: ComponentMetadataType,
    schema: Record<string, unknown>,
    filePath: string | undefined,
    collector: ErrorCollector,
  ): ParsedComponent {
    const css = _match(filePath === undefined)
      .with(true, () => ({ componentCss: '', globalCss: '' }))
      .with(false, () => this.cssExtractor.extract(ast, filePath as string))
      .exec() as { componentCss: string; globalCss: string }
    const jsxResult = this.convertJsx(ast, metadata, filePath, collector)
    const scriptStatements = _match(Array.isArray(metadata.scriptStatements))
      .with(true, () => metadata.scriptStatements)
      .with(false, () => [] as Statement[])
      .exec() as Statement[]
    const script = _match(metadata.hasUseScript && scriptStatements.length > 0)
      .with(true, () => this.scriptGenerator.generate(scriptStatements, metadata.name))
      .with(false, () => '')
      .exec() as string
    return {
      name: this.resolveComponentName(metadata, filePath),
      html: jsxResult.html,
      script,
      liquidAssignments: metadata.liquidAssignments,
      type: metadata.type,
      hasScript: Boolean(metadata.hasUseScript) && scriptStatements.length > 0,
      schema,
      blocksSchema: jsxResult.blocksSchema,
      scriptAssets: jsxResult.scriptAssets,
      mode: metadata.mode,
      css: css.componentCss,
      globalCss: css.globalCss,
      hasUncoveredJs: metadata.hasUncoveredJs,
      hasJsLogic: scriptStatements.length > 0,
      hasImplicitReturn: metadata.hasImplicitReturn,
    }
  }

  private convertJsx(ast: File, metadata: ComponentMetadataType, filePath: string | undefined, collector: ErrorCollector): JSXResult {
    return _match(true)
      .with(metadata.liquidBody != null, () =>
        this.jsxConverter.convertBody(
          metadata.liquidBody as Statement[],
          ast,
          filePath,
          metadata.name,
          metadata.inlineComponents,
          collector,
        ),
      )
      .with(metadata.jsxElement != null, () =>
        this.jsxConverter.convert(
          metadata.jsxElement as NonNullable<ComponentMetadataType['jsxElement']>,
          ast,
          filePath,
          metadata.name,
          metadata.mode,
          metadata.inlineComponents,
          collector,
        ),
      )
      .with(true, () => emptyJsx())
      .exec() as JSXResult
  }

  private resolveComponentName(metadata: ComponentMetadataType, filePath?: string): string {
    return _match(!metadata.name && filePath !== undefined && (metadata.mode === 'dom' || metadata.mode === 'dom:global'))
      .with(true, () => this.fileBaseName(filePath as string))
      .with(false, () => metadata.name)
      .exec() as string
  }

  private fileBaseName(filePath: string): string {
    const baseName = path.basename(filePath, path.extname(filePath))
    return _match(baseName === 'index')
      .with(true, () => path.basename(path.dirname(filePath)))
      .with(false, () => baseName)
      .exec() as string
  }
}
