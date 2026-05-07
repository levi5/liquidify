import { pascalToKebab } from '../../../../../shared/string'
import type { ReactComponentConfig } from '../../../../../types/liquid'
import { isStringLiteral, JSXElement, isJSXAttribute, isJSXIdentifier, isJSXExpressionContainer, isExpression, isIdentifier, isJSXSpreadAttribute, Node, JSXAttribute, JSXOpeningElement } from '@babel/types'

import { ParsingContext } from '../../../../../core/entities/parsing-context'

export class LiquidSnippetParser {
	constructor(
		private readonly getReactRegistry: () => Map<string, ReactComponentConfig>,
		private readonly addScriptAsset: (componentName: string, context?: ParsingContext) => void,
		private readonly generateLiquidCode: (node: Node, context?: ParsingContext) => string
	) { }

	public transformRenderSnippet(node: JSXElement, context?: ParsingContext): string {
		const openingElement = node.openingElement
		const slotAttr = openingElement.attributes.find(
			(attr) => isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name === 'slot',
		) as JSXAttribute | undefined

		let snippetName = ''
		let componentName = ''

		if (slotAttr && isJSXExpressionContainer(slotAttr.value)) {
			if (isIdentifier(slotAttr.value.expression)) {
				componentName = slotAttr.value.expression.name
				snippetName = pascalToKebab(componentName)
			}
		} else if (slotAttr && isStringLiteral(slotAttr.value)) {
			snippetName = slotAttr.value.value
		}

		if (!snippetName) {
			return ''
		}

		const reactRegistry = this.getReactRegistry()
		if (componentName && reactRegistry.has(componentName)) {
			this.addScriptAsset(componentName, context)
		}

		const props = this.extractSnippetProps(openingElement.attributes, context)
		const propsString = props.length > 0 ? `, ${props.join(', ')}` : ''

		return `{% render '${snippetName}'${propsString} %}`
	}

	private extractSnippetProps(attributes: JSXOpeningElement['attributes'], context?: ParsingContext): string[] {
		const props: string[] = []

		for (const attr of attributes) {
			if (isJSXSpreadAttribute(attr)) continue
			if (isJSXIdentifier(attr.name) && attr.name.name === 'slot') continue

			const name = attr.name.name as string
			let value = ''

			if (isStringLiteral(attr.value)) {
				value = `'${attr.value.value}'`
			} else if (isJSXExpressionContainer(attr.value) && isExpression(attr.value.expression)) {
				value = this.generateLiquidCode(attr.value.expression, context)
			}

			if (value) {
				props.push(`${name}: ${value}`)
			}
		}

		return props
	}
}
