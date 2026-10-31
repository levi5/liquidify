import generate from '@babel/generator'
import { LiquidVariableParser } from './liquid/variable-parser'
import { LiquidConditionalParser } from './liquid/conditional-parser'
import { LiquidLoopParser } from './liquid/loop-parser'
import { LiquidSnippetParser } from './liquid/snippet-parser'
import { LiquidPaginateParser } from './liquid/paginate-parser'
import { LiquidFallbackParser } from './liquid/fallback-component-parser'
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
  type JSXIdentifier,
  type JSXOpeningElement,
  type Statement,
} from '@babel/types'
import { LiquidAttributeConverter } from './liquid/attribute-parser'
import { _match } from 'funcio'
import { pascalToKebab } from '../../../../shared/string'
import { ValidationError } from '../../../../core/errors/validation-error'
import type { ErrorCollector } from '../../../../core/errors/error-collector'
import type { InlineComponentNode } from '../../../../types/component'

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
  private fallbackParser: LiquidFallbackParser
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
      (node, context) => this.expressionParser.generateLiquidCode(node, false, undefined, context),
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

    this.fallbackParser = new LiquidFallbackParser(
      (children, renames, context) => this.renderChildren(children, renames, context),
      (node, inCondition, renames, context) => this.expressionParser.generateLiquidCode(node, inCondition, renames, context),
    )

    this.svgParser = new LiquidSvgParser((node, inCondition, renames, context) =>
      this.expressionParser.generateLiquidCode(node, inCondition, renames, context),
    )

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
    inlineComponents?: Map<string, InlineComponentNode>,
    errorCollector?: ErrorCollector,
  ): JSXResult {
    const context = new ParsingContext({ currentFilePath, componentName, mode: 'liquid', inlineComponents, errorCollector })
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
    inlineComponents?: Map<string, InlineComponentNode>,
    errorCollector?: ErrorCollector,
  ): JSXResult {
    const context = new ParsingContext({
      currentFilePath,
      componentName,
      mode,
      inlineComponents,
      errorCollector,
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
      .with(isExpression(node), () => this.handleExpression(node as Expression, renames, context))
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
      .with(context?.inlineComponents?.has(tagName) === true, () => {
        const inline = (context as ParsingContext).inlineComponents?.get(tagName)
        return inline === undefined ? '' : this.jsxToHtml(inline, renames, context)
      })
      .with(true, () => this.renderSpecial(node, renames, context))
      .exec() as string
  }

  private renderSpecial(node: JSXElement, renames?: Record<string, string>, context?: ParsingContext): string {
    const tagName = this.getTagName(node.openingElement)
    _match(tagName === this.dynamicBlockTag)
      .with(true, () => this.blockParser.validateDynamicBlock(node, context))
      .with(false, () => undefined)
      .exec()
    const specialTagHandlers: Record<string, () => string> = {
      [this.dynamicBlockTag]: () => `{% content_for 'blocks' %}`,
      [this.renderSnippetTag]: () => this.snippetParser.transformRenderSnippet(node, context),
      [this.renderSvgTag]: () => this.svgParser.transformRenderSvg(node, undefined, context),
      PaginateByLiquid: () => this.paginateParser.transformPaginate(node, context),
      Fallback: () => this.fallbackParser.transformFallback(node, context),
      Raw: () => this.transformRaw(node, context),
      FormBlock: () => this.formParser.transformForm(node, context),
      UnlessBlock: () => this.transformUnless(node, context),
      CaptureBlock: () => this.transformCapture(node, context),
      TablerowByLiquid: () => this.transformTablerow(node, context),
      StylesheetBlock: () => this.transformStylesheet(node, context),
      JavascriptBlock: () => this.transformJavascript(node, context),
    }
    const handler = specialTagHandlers[tagName]
    return _match(handler === undefined)
      .with(true, () => this.renderCustomOrHtml(node, tagName, renames, context))
      .with(false, () => (handler as () => string)())
      .exec() as string
  }

  private renderCustomOrHtml(node: JSXElement, tagName: string, renames?: Record<string, string>, context?: ParsingContext): string {
    return _match(this.isCustomComponent(tagName))
      .with(true, () => this.renderImportedComponentAsSnippet(node, tagName, context))
      .with(false, () => this.htmlParser.renderHTMLElement(node, tagName.toLowerCase(), renames, context))
      .exec() as string
  }

  private jsxAttrValue(node: JSXElement, name: string, context?: ParsingContext): string {
    const attr = node.openingElement.attributes.find(
      (entry): entry is import('@babel/types').JSXAttribute =>
        entry.type === 'JSXAttribute' && (entry.name as { name?: string }).name === name,
    )
    return _match(attr === undefined)
      .with(true, () => '')
      .with(false, () => this.jsxAttrCode((attr as import('@babel/types').JSXAttribute).value, context))
      .exec() as string
  }

  private jsxAttrCode(value: import('@babel/types').JSXAttribute['value'], context?: ParsingContext): string {
    return _match(true)
      .with(value === null || value === undefined, () => 'true')
      .with((value as { type?: string }).type === 'StringLiteral', () => (value as unknown as { value: string }).value)
      .with((value as { type?: string }).type === 'JSXExpressionContainer', () =>
        this.expressionParser.generateLiquidCode(
          (value as unknown as { expression: import('@babel/types').Node }).expression,
          false,
          undefined,
          context,
        ),
      )
      .with(true, () => '')
      .exec() as string
  }

  private locationOf(node: unknown): { line: number; column: number } | undefined {
    const loc = (node as { loc?: { start: { line: number; column: number } } }).loc
    return loc === undefined ? undefined : { line: loc.start.line, column: loc.start.column + 1 }
  }

  private transformUnless(node: JSXElement, context?: ParsingContext): string {
    const condition = _match(this.jsxAttrValue(node, 'condition', context) !== '')
      .with(true, () => this.jsxAttrValue(node, 'condition', context))
      .with(false, () => this.jsxAttrValue(node, 'if', context))
      .exec() as string
    _match(condition.trim() === '')
      .with(true, () => {
        throw new ValidationError(
          '<UnlessBlock> requires a "condition" attribute (e.g. <UnlessBlock condition={product.available}>).',
          context?.currentFilePath,
          this.locationOf(node),
        )
      })
      .with(false, () => undefined)
      .exec()
    const children = this.renderChildren(node.children, undefined, context)
    return `{% unless ${condition} %}\n${children}\n{% endunless %}`
  }

  private transformCapture(node: JSXElement, context?: ParsingContext): string {
    const name = _match(this.jsxAttrValue(node, 'as', context) !== '')
      .with(true, () => this.jsxAttrValue(node, 'as', context).replace(/^['"]|['"]$/g, ''))
      .with(false, () => this.jsxAttrValue(node, 'name', context).replace(/^['"]|['"]$/g, ''))
      .exec() as string
    _match(name.trim() === '')
      .with(true, () => {
        throw new ValidationError(
          '<CaptureBlock> requires an "as" attribute (e.g. <CaptureBlock as="header_html">).',
          context?.currentFilePath,
          this.locationOf(node),
        )
      })
      .with(false, () => undefined)
      .exec()
    const children = this.renderChildren(node.children, undefined, context)
    return `{% capture ${name} %}\n${children}\n{% endcapture %}`
  }

  private transformTablerow(node: JSXElement, context?: ParsingContext): string {
    const collection = this.jsxAttrValue(node, 'collection', context)
    const cols = this.jsxAttrValue(node, 'cols', context)
    _match(collection.trim() === '')
      .with(true, () => {
        throw new ValidationError(
          '<TablerowByLiquid> requires a "collection" attribute (e.g. <TablerowByLiquid collection={products} cols={3}>).',
          context?.currentFilePath,
          this.locationOf(node),
        )
      })
      .with(false, () => undefined)
      .exec()
    const colsPart = cols.trim() !== '' ? ` cols: ${cols}` : ''
    const children = this.renderChildren(node.children, undefined, context)
    return `{% tablerow item in ${collection}${colsPart} %}\n${children}\n{% endtablerow %}`
  }

  private transformStylesheet(node: JSXElement, context?: ParsingContext): string {
    const children = this.renderChildren(node.children, undefined, context)
    return `{% stylesheet %}\n${children}\n{% endstylesheet %}`
  }

  private transformJavascript(node: JSXElement, context?: ParsingContext): string {
    const children = this.renderChildren(node.children, undefined, context)
    return `{% javascript %}\n${children}\n{% endjavascript %}`
  }

  private transformRaw(node: JSXElement, context?: ParsingContext): string {
    const attr = node.openingElement.attributes.find(
      (entry): entry is import('@babel/types').JSXAttribute =>
        entry.type === 'JSXAttribute' && (entry.name as { name?: string }).name === 'html',
    )
    const value = attr?.value
    if (value !== undefined && isJSXExpressionContainer(value) && isExpression(value.expression)) {
      const rawContext = ParsingContext.derive(context, { outputContext: 'raw' })
      return this.expressionParser.parseExpression(value.expression as Expression, undefined, rawContext)
    }
    throw new ValidationError('<Raw> requires an "html" attribute (e.g. <Raw html={article.content} />).', context?.currentFilePath)
  }

  private isCustomComponent(tagName: string): boolean {
    const base = tagName.split('.')[0].split(':')[0] ?? ''
    return base.length > 0 && base[0] === base[0].toUpperCase() && base[0] !== base[0].toLowerCase()
  }

  private renderImportedComponentAsSnippet(node: JSXElement, tagName: string, context?: ParsingContext): string {
    const snippetName = pascalToKebab(tagName.split('.')[0])
    const props = node.openingElement.attributes
      .filter((attr) => attr.type === 'JSXAttribute')
      .map((attr) => this.snippetProp(attr as import('@babel/types').JSXAttribute, context))
      .filter(Boolean)
    const children = this.renderChildren(node.children, undefined, context)
    const capture = _match(children.trim() !== '')
      .with(true, () => `{% capture snippet_content %}\n${children}\n{% endcapture %}\n`)
      .with(false, () => '')
      .exec() as string
    const withChildren = _match(capture === '')
      .with(true, () => props as string[])
      .with(false, () => [...(props as string[]), 'children: snippet_content'])
      .exec() as string[]
    const propsString = _match(withChildren.length > 0)
      .with(true, () => `, ${withChildren.join(', ')}`)
      .with(false, () => '')
      .exec() as string
    return `${capture}{% render '${snippetName}'${propsString} %}`
  }

  private snippetProp(attr: import('@babel/types').JSXAttribute, context?: ParsingContext): string {
    const name = (attr.name as { name: string }).name
    const attrValue = attr.value as unknown as { type?: string; value?: string; expression?: unknown } | null | undefined
    const value = _match(true)
      .with(attrValue === null || attrValue === undefined, () => 'true')
      .with(attrValue?.type === 'StringLiteral', () => `'${attrValue?.value ?? ''}'`)
      .with(attrValue?.type === 'JSXExpressionContainer' && (attrValue as { expression: unknown }).expression !== null, () =>
        this.expressionParser.generateLiquidCode(
          (attrValue as { expression: import('@babel/types').Node }).expression,
          false,
          undefined,
          context,
        ),
      )
      .with(true, () => '')
      .exec() as string
    return _match(value === '')
      .with(true, () => '')
      .with(false, () => `${name}: ${value}`)
      .exec() as string
  }

  private renderChildren(children: JSXElement['children'], renames?: Record<string, string>, context?: ParsingContext): string {
    return children
      .map((child) => this.jsxToHtml(child as JSXElement | JSXFragment | JSXText | JSXExpressionContainer | Expression, renames, context))
      .join('')
  }

  public generateLiquidCode(node: Node, inCondition = false, renames?: Record<string, string>, context?: ParsingContext): string {
    return this.expressionParser.generateLiquidCode(node, inCondition, renames, context)
  }

  public generateJavaScript(node: Node, renames?: Record<string, string>, context?: ParsingContext): string {
    return this.expressionParser.generateJavaScript(node, renames, context)
  }

  public parseExpression(expr: Expression, renames?: Record<string, string>, context?: ParsingContext): string {
    return this.expressionParser.parseExpression(expr, renames, context)
  }

  private getTagName(element: JSXOpeningElement): string {
    return _match(true)
      .with(isJSXIdentifier(element.name), () => (element.name as JSXIdentifier).name)
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
