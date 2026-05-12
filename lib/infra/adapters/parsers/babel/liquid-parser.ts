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
import { JSXResult, ReactComponentConfig, JSXToLiquidConfig, ILiquidExpressionParser } from '../../../../types/liquid'
import type { Compiler } from '../../../../core/protocols/compiler'
import type { IFileSystem } from '../../../../core/protocols/file-system'
import { NodeFileSystem } from '../../fs/node-file-system'
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
	type JSXOpeningElement
} from '@babel/types'
import { LiquidAttributeConverter } from './liquid/attribute-parser'




export class LiquidParser implements ILiquidExpressionParser {
	private readonly dynamicBlockTag: string
	private readonly renderSnippetTag: string
	private readonly renderSvgTag: string
	private reactRegistry: Map<string, ReactComponentConfig> = new Map()
	private readonly fs: IFileSystem
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

	constructor(
		private readonly compiler: Compiler,
		config: JSXToLiquidConfig = {},
		fsConfig: IFileSystem = new NodeFileSystem(),
	) {
		this.fs = fsConfig
		this.dynamicBlockTag = config.dynamicBlockTag || 'DynamicBlock'
		this.renderSnippetTag = config.renderSnippetTag || 'RenderSnippet'
		this.renderSvgTag = config.renderSvgTag || 'RenderSvg'

		this.importResolver = new ImportResolver(this.fs)
		this.liquidAttributeConverter = new LiquidAttributeConverter(this)

		this.liquidVariableParser = new LiquidVariableParser((node, inCondition, renames, context) => this.expressionParser.generateLiquidCode(node, inCondition, renames, context))

		this.conditionalParser = new LiquidConditionalParser(
			(node, renames, context) => this.jsxToHtml(node, renames, context),
			(node, inCondition, renames, context) => this.expressionParser.generateLiquidCode(node, inCondition, renames, context),
			(context) => this.expressionParser.getPendingAssigns(context)
		)

		this.loopParser = new LiquidLoopParser((node, renames, context) => this.jsxToHtml(node, renames, context), this.liquidVariableParser)

		this.expressionParser = new ExpressionParser(
			this.compiler,
			this.importResolver,
			this.loopParser
		)

		this.blockParser = new LiquidBlockParser(
			this.dynamicBlockTag,
			this.renderSnippetTag,
			(element) => this.getTagName(element)
		)

		this.reactComponentParser = new ReactComponentParser(
			() => this.reactRegistry,
			(componentName, context) => this.addScriptAsset(componentName, context),
			this.importResolver,
			() => undefined,
			(children, renames, context) => this.renderChildren(children, renames, context)
		)

		this.snippetParser = new LiquidSnippetParser(
			() => this.reactRegistry,
			(componentName, context) => this.addScriptAsset(componentName, context),
			(node, context) => this.expressionParser.generateLiquidCode(node, false, undefined, context)
		)

		this.paginateParser = new LiquidPaginateParser(
			(children, renames, context) => this.renderChildren(children, renames, context),
			(node, inCondition, renames, context) => this.expressionParser.generateLiquidCode(node, inCondition, renames, context)
		)

		this.svgParser = new LiquidSvgParser()

		this.formParser = new LiquidFormParser(
			(children, renames, context) => this.renderChildren(children, renames, context),
			(node, inCondition, renames, context) => this.expressionParser.generateLiquidCode(node, inCondition, renames, context)
		)

		this.htmlParser = new LiquidHtmlParser(
			this.liquidAttributeConverter,
			this.expressionParser,
			(children, renames, context) => this.renderChildren(children, renames, context)
		)
	}

	/**
	 * Sets the registry for React components to be hydrated on the client.
	 * @param registry - Map containing React component configurations.
	 */
	public setReactRegistry(registry: Map<string, ReactComponentConfig>): void {
		this.reactRegistry = registry
	}

	/**
	 * Converts a JSXElement to a JSXResult containing HTML, schema blocks, and external scripts.
	 * @param node - The root JSXElement to convert.
	 * @returns The conversion result.
	 */
	public convert(
		node: JSXElement | JSXFragment | LogicalExpression | ConditionalExpression,
		ast?: File,
		currentFilePath?: string,
		componentName?: string,
		mode?: string,
	): JSXResult {
		const context = new ParsingContext({
			currentFilePath,
			componentName,
			mode
		})

		this.liquidAttributeConverter = new LiquidAttributeConverter(this, componentName, mode)

		if (ast) {
			this.importResolver.resolveImports(ast)
		} else {
			this.importResolver.clear()
		}

		if (isJSXElement(node)) {
			this.blockParser.processDynamicBlocks(node, context)
		}
		const html = this.jsxToHtml(node, undefined, context)

		return {
			html,
			blocksSchema: context.blocksSchema,
			scriptAssets: Array.from(context.scriptAssets),
		}
	}


	private jsxToHtml(node: JSXElement | JSXFragment | JSXText | JSXExpressionContainer | Expression, renames?: Record<string, string>, context?: ParsingContext): string {
		if (isJSXFragment(node)) return this.renderChildren(node.children, renames, context)
		if (isJSXElement(node)) return this.renderJSXElement(node, renames, context)
		if (isJSXText(node)) return node.value.trim() || ''

		if (isJSXExpressionContainer(node)) {
			return isExpression(node.expression) ? this.handleExpression(node.expression, renames, context) : ''
		}

		if (isExpression(node)) {
			return this.handleExpression(node, renames, context)
		}

		return ''
	}

	private handleExpression(expr: Expression, renames?: Record<string, string>, context?: ParsingContext): string {
		if (isLogicalExpression(expr)) {
			return this.conditionalParser.parseLogicalExpression(expr, renames, context) || ''
		}

		if (isConditionalExpression(expr)) {
			return this.conditionalParser.parseConditionalExpression(expr, renames, context)
		}

		return this.expressionParser.parseExpression(expr, renames, context)
	}

	private renderJSXElement(node: JSXElement, renames?: Record<string, string>, context?: ParsingContext): string {
		const tagName = this.getTagName(node.openingElement)

		if (this.reactRegistry.has(tagName)) {
			return this.reactComponentParser.transformReactComponent(node, tagName, context)
		}

		const specialTagHandlers: Record<string, () => string> = {
			[this.dynamicBlockTag]: () => `{% content_for 'blocks' %}`,
			[this.renderSnippetTag]: () => this.snippetParser.transformRenderSnippet(node, context),
			[this.renderSvgTag]: () => this.svgParser.transformRenderSvg(node),
			'PaginateByLiquid': () => this.paginateParser.transformPaginate(node, context),
			'FormBlock': () => this.formParser.transformForm(node, context)
		}

		const handler = specialTagHandlers[tagName]
		if (handler) return handler()

		return this.htmlParser.renderHTMLElement(node, tagName, renames, context)
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
		if (isJSXIdentifier(element.name)) return element.name.name
		if (isJSXMemberExpression(element.name)) return generate(element.name).code
		return 'div'
	}

	private addScriptAsset(componentName: string, context?: ParsingContext): void {
		const config = this.reactRegistry.get(componentName)
		if (!config || config.mode === 'dom:global' || !context) return

		if (config.script) {
			context.addScriptAsset(config.script)
		}

		for (const asset of config.scriptAssets || []) {
			context.addScriptAsset(asset)
		}
	}
}
export { ReactComponentConfig }

