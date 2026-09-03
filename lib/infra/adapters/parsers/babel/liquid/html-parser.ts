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
    private readonly renderChildren: (children: any, renames?: Record<string, string>, context?: ParsingContext) => string,
  ) {}

  public renderHTMLElement(node: JSXElement, tagName: string, renames?: Record<string, string>, context?: ParsingContext): string {
    let hasDangerouslySetInnerHTML = false
    let dangerouslySetInnerHTMLContent = ''

    const bridgeAttributes: any[] = []
    const filteredAttributes = node.openingElement.attributes.filter((attr) => {
      if (isJSXAttribute(attr) && isJSXIdentifier(attr.name)) {
        const name = attr.name.name
        if (name === 'dangerouslySetInnerHTML') {
          hasDangerouslySetInnerHTML = true
          dangerouslySetInnerHTMLContent = this.extractDangerouslyContent(attr, context)
          return false
        }
        if (tagName === 'liquid-data' && (name.startsWith('data-liquid') || name === 'store')) {
          bridgeAttributes.push(attr)
          return false
        }
      }
      return true
    })

    let attributes = this.attributeConverter.getAttributes(filteredAttributes, renames, context)
    let children = hasDangerouslySetInnerHTML ? dangerouslySetInnerHTMLContent : this.renderChildren(node.children, renames, context)

    if (tagName === 'liquid-data' && bridgeAttributes.length > 0) {
      const scriptTags = bridgeAttributes
        .map((attr) => {
          const name = isJSXIdentifier(attr.name) ? attr.name.name : ''
          const propName =
            name === 'data-liquid' || name === 'data-liquid-store' || name === 'store' ? 'store' : name.replace('data-liquid-', '')

          let val = ''
          if (attr.value) {
            if (isStringLiteral(attr.value)) val = attr.value.value
            else if (isJSXExpressionContainer(attr.value))
              val = this.expressionParser.parseExpression(attr.value.expression as any, renames, context)
          }

          // Ensure it uses the json filter if it looks like a variable
          const finalVal = val.includes('{{') && !val.includes('| json') ? val.replace(' }}', ' | json }}') : val

          return `<script type="application/json" data-liquid-${propName}>${finalVal}</script>`
        })
        .join('\n')
      children = scriptTags + children
    }

    if (node.closingElement || hasDangerouslySetInnerHTML || tagName === 'liquid-data') {
      return `<${tagName}${attributes}>${children}</${tagName}>`
    }

    return `<${tagName}${attributes} />`
  }

  private extractDangerouslyContent(attr: any, context?: ParsingContext): string {
    if (attr.value && isJSXExpressionContainer(attr.value) && isObjectExpression(attr.value.expression)) {
      const htmlProp = attr.value.expression.properties.find(
        (prop: any) =>
          isObjectProperty(prop) &&
          ((isIdentifier(prop.key) && prop.key.name === '__html') || (isStringLiteral(prop.key) && prop.key.value === '__html')),
      ) as ObjectProperty | undefined

      if (htmlProp && isExpression(htmlProp.value)) {
        return this.expressionParser.parseExpression(htmlProp.value, undefined, context)
      }
    }
    return ''
  }
}
