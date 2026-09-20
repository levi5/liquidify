import path from 'node:path'
import traverse from '@babel/traverse'
import { isIdentifier } from '@babel/types'
import type { ASTParser } from './ASTParser'
import type { Compiler } from '../../../../core/protocols/compiler'
import type { ComponentExtractor } from './component'
import type { CSSImportExtractor } from './css/Import-extractor'
import type { IParser } from '../../../../core/protocols/parser'
import type { LiquidParser, ReactComponentConfig } from './liquid-parser'
import type { ParsedComponent } from '../../../../core/entities/parsed-component'
import type { ReactComponentCompiler } from '../../compilers/react/component-compiler'
import type { SchemaExtractor } from './schema/schema-extractor'
import type { ScriptGenerator } from './script/script-generator'
import { ValidationError } from '../../../../core/errors/validation-error'

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

export class BabelLiquidParser implements IParser {
  private readonly astParser: ASTParser
  private readonly componentExtractor: ComponentExtractor
  private readonly schemaExtractor: SchemaExtractor
  private readonly scriptGenerator: ScriptGenerator
  private readonly jsxConverter: LiquidParser
  private readonly reactCompiler: ReactComponentCompiler
  private readonly cssExtractor: CSSImportExtractor

  constructor(options: BabelLiquidParserOptions) {
    this.astParser = options.astParser!
    this.componentExtractor = options.componentExtractor!
    this.schemaExtractor = options.schemaExtractor!
    this.scriptGenerator = options.scriptGenerator!
    this.jsxConverter = options.jsxConverter!
    this.reactCompiler = options.reactCompiler!
    this.cssExtractor = options.cssExtractor!
  }

  public setReactRegistry(registry: Map<string, ReactComponentConfig>) {
    this.jsxConverter.setReactRegistry(registry)
  }

  public async parse(source: string, filePath?: string): Promise<ParsedComponent> {
    const ast = this.astParser.parse(source)
    const componentMetadata = this.componentExtractor.extract(ast, source)
    if (!componentMetadata.name && componentMetadata.liquidBody && filePath) {
      componentMetadata.name = path.basename(filePath, path.extname(filePath))
    }
    const schema = this.schemaExtractor.extract(ast, filePath)

    if (componentMetadata.mode === 'react') {
      this.validateNoLiquidFiltersInReact(ast, filePath)
      return this.handleReactMode(ast, source, componentMetadata, schema, filePath)
    }

    return this.handleDefaultMode(ast, componentMetadata, schema, filePath)
  }

  private validateNoLiquidFiltersInReact(ast: any, filePath?: string): void {
    const forbiddenFilters = new Set([
      'markdownify',
      'handleize',
      'downcase',
      'upcase',
      'strip',
      'strip_html',
      'money',
      'money_without_currency',
    ])

    traverse(ast as any, {
      CallExpression(path) {
        const callee = path.node.callee
        if (isIdentifier(callee) && forbiddenFilters.has(callee.name)) {
          throw new ValidationError(
            `Liquid filter method '${callee.name}' cannot be used inside a React component. It is a Liquid-only filter.`,
            filePath,
          )
        }
      },
    })
  }

  private async handleReactMode(ast: any, source: string, metadata: any, schema: any, filePath?: string): Promise<ParsedComponent> {
    const reactBuild = await this.reactCompiler.compile(metadata, source, filePath)
    const { componentCss } = filePath ? this.cssExtractor.extract(ast, filePath) : { componentCss: '' }

    const combinedCss = `${reactBuild.css || ''}\n${componentCss}`.trim()
    const html = combinedCss ? `<style>\n${combinedCss}\n</style>\n${reactBuild.html}` : reactBuild.html

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
    }
  }

  private handleDefaultMode(ast: any, metadata: any, schema: any, filePath?: string): ParsedComponent {
    const { componentCss, globalCss } = filePath ? this.cssExtractor.extract(ast, filePath) : { componentCss: '', globalCss: '' }

    const jsxResult = metadata.liquidBody
      ? this.jsxConverter.convertBody(metadata.liquidBody, ast, filePath, metadata.name, metadata.inlineComponents)
      : metadata.jsxElement
        ? this.jsxConverter.convert(metadata.jsxElement, ast, filePath, metadata.name, metadata.mode, metadata.inlineComponents)
        : { html: '', blocksSchema: [], scriptAssets: [] }

    const script = metadata.hasUseScript ? this.scriptGenerator.generate(metadata.scriptStatements, metadata.name) : ''

    return {
      name: this.resolveComponentName(metadata, filePath),
      html: jsxResult.html,
      script,
      liquidAssignments: metadata.liquidAssignments,
      type: metadata.type,
      hasScript: metadata.hasUseScript && metadata.scriptStatements.length > 0,
      schema,
      blocksSchema: jsxResult.blocksSchema,
      scriptAssets: jsxResult.scriptAssets,
      mode: metadata.mode,
      css: componentCss,
      globalCss,
      hasUncoveredJs: metadata.hasUncoveredJs,
      hasJsLogic: metadata.scriptStatements.length > 0,
    }
  }

  private resolveComponentName(metadata: any, filePath?: string): string {
    if (metadata.name) return metadata.name
    if (!filePath || (metadata.mode !== 'dom' && metadata.mode !== 'dom:global')) return metadata.name

    const baseName = path.basename(filePath, path.extname(filePath))
    return baseName === 'index' ? path.basename(path.dirname(filePath)) : baseName
  }
}
