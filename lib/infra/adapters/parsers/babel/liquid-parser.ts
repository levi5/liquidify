import generate from '@babel/generator'
import { LiquidVariableParser } from './liquid/variable-parser'
import { LiquidConditionalParser } from './liquid/conditional-parser'
import { LiquidLoopParser } from './liquid/loop-parser'
import { LiquidSnippetParser } from './liquid/snippet-parser'
import { LiquidPaginateParser } from './liquid/paginate-parser'
import { LiquidSvgParser } from './liquid/svg-parser'
import { LiquidBlockParser } from './liquid/block-parser'
import { LiquidFormParser } from './liquid/form-parser'
import { ImportResolver } from './liquid/import-resolver'
import { ReactComponentParser } from './liquid/react-component-parser'
import { ExpressionParser } from './liquid/expression-parser'
import { LiquidHtmlParser } from './liquid/html-parser'
import { LiquidStatementParser } from './liquid/statement-parser'
import { type JSXResult, ReactComponentConfig, type JSXToLiquidConfig, type ILiquidExpressionParser } from '../../../../types/liquid'
import type { Compiler } from '../../../../core/protocols/compiler'
import type { IFileSystem } from '../../../../core/protocols/file-system'
import type { Logger } from '../../../../shared/logger'
import { SchemaExtractor } from './schema/schema-extractor'
import { ModuleResolver } from '../../fs/module-resolver'
import { ParsingContext } from '../../../../core/entities/parsing-context'
import {
  type Expression,
  isConditionalExpression,
  isExpression,
  isJSXElement,
  isJSXExpressionContainer,
  isJSXFragment,
  isJSXIdentifier,
  isJSXMemberExpression,
  isJSXText,
  isLogicalExpression,
  type File,
  type JSXElement,
  type JSXExpressionContainer,
  type JSXFragment,
  type JSXText,
  type Node,
  type ConditionalExpression,
  type LogicalExpression,
  type JSXOpeningElement,
  type Statement,
} from '@babel/types'
import { LiquidAttributeConverter } from './liquid/attribute-parser'
import { _match } from 'funcio'

export class LiquidParser implements ILiquidExpressionParser {
  private readonly dynamicBlockTag: string
  private readonly renderSnippetTag: string
  private readonly renderSvgTag: string
  private reactRegistry: Map<string, ReactComponentConfig> = new Map()
  private liquidAttributeConverter: LiquidAttributeConverter
  private blockParser: LiquidBlockParser
  private importResolver: ImportResolver
  private reactComponentParser: ReactComponentParser
  private expressionParser: ExpressionParser
  private htmlParser: LiquidHtmlParser
  private liquidVariableParser: LiquidVariableParser
  private conditionalParser: LiquidConditionalParser
  private loopParser: LiquidLoopParser
  private snippetParser: LiquidSnippetParser
  private paginateParser: LiquidPaginateParser
  private svgParser: LiquidSvgParser
  private formParser: LiquidFormParser
  private statementParser: LiquidStatementParser

  constructor(
    private readonly compiler: Compiler,
    private readonly fs: IFileSystem,
    private readonly logger: Logger,
    config: JSXToLiquidConfig = {},
  ) {
    this.dynamicBlockTag = config.dynamicBlockTag || 'DynamicBlock'
    this.renderSnippetTag = config.renderSnippetTag || 'RenderSnippet'
    this.renderSvgTag = config.renderSvgTag || 'RenderSvg'

    this.importResolver = new ImportResolver(new SchemaExtractor(this.fs, new ModuleResolver(this.fs), this.logger))
    this.liquidAttributeConverter = new LiquidAttributeConverter(this)

    this.liquidVariableParser = new LiquidVariableParser((node, inCondition, renames, context) =>
      this.expressionParser.generateLiquidCode(node, inCondition, renames, context),
    )

    this.conditionalParser = new LiquidConditionalParser(
      (node, renames, context) =>
        this.jsxToHtml(node as JSXElement | JSXFragment | JSXText | JSXExpressionContainer | Expression, renames, context),
      (node, inCondition, renames, context) => this.expressionParser.generateLiquidCode(node, inCondition, renames, context),
      (context) => this.expressionParser.getPendingAssigns(context),
    )

    this.loopParser = new LiquidLoopParser(
      (node, renames, context) =>
        this.jsxToHtml(node as JSXElement | JSXFragment | JSXText | JSXExpressionContainer | Expression, renames, context),
      this.liquidVariableParser,
    )

    this.expressionParser = new ExpressionParser(this.compiler, this.importResolver, this.loopParser)
    this.statementParser = new LiquidStatementParser(this.liquidVariableParser, (node, renames, context) =>
      this.jsxToHtml(node as JSXElement | JSXFragment | JSXText | JSXExpressionContainer | Expression, renames, context),
    )
    this.loopParser.renderBody = (body, renames, context) => this.statementParser.renderBody(body as Statement[], renames, context)

    this.liquidVariableParser.parseExpression = (expr, renames, context) => this.expressionParser.parseExpression(expr, renames, context)

    this.blockParser = new LiquidBlockParser(this.dynamicBlockTag, this.renderSnippetTag, (element) => this.getTagName(element))

    this.reactComponentParser = new ReactComponentParser(
      () => this.reactRegistry,
      (componentName, context) => this.addScriptAsset(componentName, context),
      this.importResolver,
      () => undefined,
      (children, renames, context) => this.renderChildren(children, renames, context),
    )

    this.snippetParser = new LiquidSnippetParser(
      () => this.reactRegistry,
      (componentName, context) => this.addScriptAsset(componentName, context),
      (node, context) => this.expressionParser.generateLiquidCode(node, false, undefined, context),
      (children, renames, context) => this.renderChildren(children, renames, context),
    )

    this.paginateParser = new LiquidPaginateParser(
      (children, renames, context) => this.renderChildren(children, renames, context),
      (node, inCondition, renames, context) => this.expressionParser.generateLiquidCode(node, inCondition, renames, context),
    )

    this.svgParser = new LiquidSvgParser()

    this.formParser = new LiquidFormParser(
      (children, renames, context) => this.renderChildren(children, renames, context),
      (node, inCondition, renames, context) => this.expressionParser.generateLiquidCode(node, inCondition, renames, context),
    )

    this.htmlParser = new LiquidHtmlParser(this.liquidAttributeConverter, this.expressionParser, (children, renames, context) =>
      this.renderChildren(children, renames, context),
    )
  }

  public setReactRegistry(registry: Map<string, ReactComponentConfig>): void {
    this.reactRegistry = registry
  }

  public convertBody(
    body: Statement[],
    ast: File,
    currentFilePath?: string,
    componentName?: string,
    inlineComponents?: Map<string, any>,
  ): JSXResult {
    const context = new ParsingContext({ currentFilePath, componentName, mode: 'liquid', inlineComponents })
    this.importResolver.resolveImports(ast)
    const html = this.statementParser.renderBody(body, undefined, context)
    return { html, blocksSchema: context.blocksSchema, scriptAssets: Array.from(context.scriptAssets) }
  }

  public convert(
    node: JSXElement | JSXFragment | LogicalExpression | ConditionalExpression,
    ast?: File,
    currentFilePath?: string,
    componentName?: string,
    mode?: string,
    inlineComponents?: Map<string, any>,
  ): JSXResult {
    const context = new ParsingContext({
      currentFilePath,
      componentName,
      mode,
      inlineComponents,
    })

    this.liquidAttributeConverter = new LiquidAttributeConverter(this, componentName, mode)

    _match(ast === undefined)
      .with(true, () => this.importResolver.clear())
      .with(false, () => this.importResolver.resolveImports(ast as File))
      .exec()

    _match(isJSXElement(node))
      .with(true, () => this.blockParser.processDynamicBlocks(node as JSXElement, context))
      .with(false, () => null)
      .exec()
    const html = this.jsxToHtml(node, undefined, context)

    return {
      html,
      blocksSchema: context.blocksSchema,
      scriptAssets: Array.from(context.scriptAssets),
    }
  }

  private jsxToHtml(
    node: JSXElement | JSXFragment | JSXText | JSXExpressionContainer | Expression,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    return _match(true)
      .with(isJSXFragment(node), () => this.renderChildren((node as JSXFragment).children, renames, context))
      .with(isJSXElement(node), () => this.renderJSXElement(node as JSXElement, renames, context))
      .with(isJSXText(node), () => this.textOf(node as JSXText))
      .with(isJSXExpressionContainer(node), () => this.handleContainer(node as JSXExpressionContainer, renames, context))
      .with(isExpression(node as any), () => this.handleExpression(node as Expression, renames, context))
      .with(true, () => '')
      .exec() as string
  }

  private handleContainer(node: JSXExpressionContainer, renames?: Record<string, string>, context?: ParsingContext): string {
    return _match(isExpression(node.expression))
      .with(true, () => this.handleExpression(node.expression as Expression, renames, context))
      .with(false, () => '')
      .exec() as string
  }

  private textOf(node: JSXText): string {
    return _match(node.value.includes('\n'))
      .with(true, () => node.value.replace(/\s+/g, ' ').trim() || '')
      .with(false, () => node.value.replace(/[ \t]{2,}/g, ' '))
      .exec() as string
  }

  private handleExpression(expr: Expression, renames?: Record<string, string>, context?: ParsingContext): string {
    return _match(true)
      .with(
        isLogicalExpression(expr),
        () => this.conditionalParser.parseLogicalExpression(expr as LogicalExpression, renames, context) || '',
      )
      .with(isConditionalExpression(expr), () =>
        this.conditionalParser.parseConditionalExpression(expr as ConditionalExpression, renames, context),
      )
      .with(true, () => this.expressionParser.parseExpression(expr, renames, context))
      .exec() as string
  }

  private renderJSXElement(node: JSXElement, renames?: Record<string, string>, context?: ParsingContext): string {
    const tagName = this.getTagName(node.openingElement)
    return _match(true)
      .with(this.reactRegistry.has(tagName), () => this.reactComponentParser.transformReactComponent(node, tagName, context))
      .with(context?.inlineComponents?.has(tagName) === true, () =>
        this.jsxToHtml((context as ParsingContext).inlineComponents?.get(tagName), renames, context),
      )
      .with(true, () => this.renderSpecial(node, renames, context))
      .exec() as string
  }

  private renderSpecial(node: JSXElement, renames?: Record<string, string>, context?: ParsingContext): string {
    const tagName = this.getTagName(node.openingElement)
    const specialTagHandlers: Record<string, () => string> = {
      [this.dynamicBlockTag]: () => `{% content_for 'blocks' %}`,
      [this.renderSnippetTag]: () => this.snippetParser.transformRenderSnippet(node, context),
      [this.renderSvgTag]: () => this.svgParser.transformRenderSvg(node),
      PaginateByLiquid: () => this.paginateParser.transformPaginate(node, context),
      FormBlock: () => this.formParser.transformForm(node, context),
    }
    const handler = specialTagHandlers[tagName]
    return _match(handler === undefined)
      .with(true, () => this.htmlParser.renderHTMLElement(node, tagName, renames, context))
      .with(false, () => (handler as () => string)())
      .exec() as string
  }

  private renderChildren(children: JSXElement['children'], renames?: Record<string, string>, context?: ParsingContext): string {
    return children.map((child) => this.jsxToHtml(child as any, renames, context)).join('')
  }

  public generateLiquidCode(node: Node, inCondition = false, renames?: Record<string, string>, context?: ParsingContext): string {
    return this.expressionParser.generateLiquidCode(node, inCondition, renames, context)
  }

  public parseExpression(expr: Expression, renames?: Record<string, string>, context?: ParsingContext): string {
    return this.expressionParser.parseExpression(expr, renames, context)
  }

  private getTagName(element: JSXOpeningElement): string {
    return _match(true)
      .with(isJSXIdentifier(element.name), () => (element.name as any).name)
      .with(isJSXMemberExpression(element.name), () => generate(element.name).code)
      .with(true, () => 'div')
      .exec() as string
  }

  private addScriptAsset(componentName: string, context?: ParsingContext): void {
    const config = this.reactRegistry.get(componentName)
    _match(config === undefined || config.mode === 'dom:global' || context === undefined)
      .with(true, () => undefined)
      .with(false, () => this.collectAssets(config as ReactComponentConfig, context as ParsingContext))
      .exec()
  }

  private collectAssets(config: ReactComponentConfig, context: ParsingContext): void {
    _match(!config.script)
      .with(true, () => undefined)
      .with(false, () => context.addScriptAsset(config.script as string))
      .exec()
    ;(config.scriptAssets ?? []).forEach((asset) => {
      context.addScriptAsset(asset)
    })
  }
}
export { ReactComponentConfig }
