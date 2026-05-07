import {
	isJSXAttribute,
	isJSXIdentifier,
	isJSXExpressionContainer,
	isObjectExpression,
	isObjectProperty,
	isIdentifier,
	isStringLiteral,
	isExpression,
	JSXElement,
	ObjectProperty,
} from '@babel/types'
import { LiquidAttributeConverter } from './attribute-parser'
import { ExpressionParser } from './expression-parser'

import { ParsingContext } from '../../../../../core/entities/parsing-context'

export class LiquidHtmlParser {
	constructor(
		private readonly attributeConverter: LiquidAttributeConverter,
		private readonly expressionParser: ExpressionParser,
		private readonly renderChildren: (children: any, renames?: Record<string, string>, context?: ParsingContext) => string
	) {}

	public renderHTMLElement(node: JSXElement, tagName: string, renames?: Record<string, string>, context?: ParsingContext): string {
		let hasDangerouslySetInnerHTML = false
		let dangerouslySetInnerHTMLContent = ''

		const filteredAttributes = node.openingElement.attributes.filter((attr) => {
			if (isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name === 'dangerouslySetInnerHTML') {
				hasDangerouslySetInnerHTML = true
				dangerouslySetInnerHTMLContent = this.extractDangerouslyContent(attr, context)
				return false
			}
			return true
		})

		const attributes = this.attributeConverter.getAttributes(filteredAttributes, renames, context)
		const children = hasDangerouslySetInnerHTML ? dangerouslySetInnerHTMLContent : this.renderChildren(node.children, renames, context)

		if (node.closingElement || hasDangerouslySetInnerHTML) {
			return `<${tagName}${attributes}>${children}</${tagName}>`
		}

		return `<${tagName}${attributes} />`
	}

	private extractDangerouslyContent(attr: any, context?: ParsingContext): string {
		if (attr.value && isJSXExpressionContainer(attr.value) && isObjectExpression(attr.value.expression)) {
			const htmlProp = attr.value.expression.properties.find(
				(prop: any) => isObjectProperty(prop) && (
					(isIdentifier(prop.key) && prop.key.name === '__html') ||
					(isStringLiteral(prop.key) && prop.key.value === '__html')
				)
			) as ObjectProperty | undefined

			if (htmlProp && isExpression(htmlProp.value)) {
				return this.expressionParser.parseExpression(htmlProp.value, undefined, context)
			}
		}
		return ''
	}
}
