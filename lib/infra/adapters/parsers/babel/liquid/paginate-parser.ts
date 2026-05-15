import {
	isStringLiteral,
	JSXElement,
	isJSXAttribute,
	isJSXIdentifier,
	isJSXExpressionContainer,
	isExpression,
	isNumericLiteral,
	Node,
	JSXAttribute,
} from '@babel/types'

import { ParsingContext } from '../../../../../core/entities/parsing-context'

export class LiquidPaginateParser {
	constructor(
		private readonly renderChildren: (
			children: JSXElement['children'],
			renames?: Record<string, string>,
			context?: ParsingContext,
		) => string,
		private readonly generateLiquidCode: (
			node: Node,
			inCondition?: boolean,
			renames?: Record<string, string>,
			context?: ParsingContext,
		) => string,
	) {}

	public transformPaginate(node: JSXElement, context?: ParsingContext): string {
		const openingElement = node.openingElement
		const collectionAttr = openingElement.attributes.find(
			(attr) => isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name === 'collection',
		) as JSXAttribute | undefined

		const byAttr = openingElement.attributes.find(
			(attr) => isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name === 'by',
		) as JSXAttribute | undefined

		let collection = ''
		if (collectionAttr && isStringLiteral(collectionAttr.value)) {
			collection = collectionAttr.value.value
		} else if (collectionAttr && isJSXExpressionContainer(collectionAttr.value) && isExpression(collectionAttr.value.expression)) {
			collection = this.generateLiquidCode(collectionAttr.value.expression, false, undefined, context)
		}

		let by = ''
		if (byAttr && isJSXExpressionContainer(byAttr.value) && isNumericLiteral(byAttr.value.expression)) {
			by = String(byAttr.value.expression.value)
		} else if (byAttr && isStringLiteral(byAttr.value)) {
			by = byAttr.value.value
		}

		const children = this.renderChildren(node.children, undefined, context)

		return `{% paginate ${collection} by ${by} %}\n${children}\n{% endpaginate %}`
	}
}
