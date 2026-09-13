import {
  type JSXElement,
  isJSXAttribute,
  isJSXIdentifier,
  isStringLiteral,
  isJSXExpressionContainer,
  isExpression,
  type JSXAttribute,
  type Node,
} from '@babel/types'

import type { ParsingContext } from '../../../../../core/entities/parsing-context'

export class LiquidFormParser {
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

  public transformForm(node: JSXElement, context?: ParsingContext): string {
    const openingElement = node.openingElement

    const nameAttr = openingElement.attributes.find(
      (attr) => isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name === 'name',
    ) as JSXAttribute | undefined

    let name = "''"
    if (nameAttr && isStringLiteral(nameAttr.value)) {
      name = `'${nameAttr.value.value}'`
    } else if (nameAttr && isJSXExpressionContainer(nameAttr.value) && isExpression(nameAttr.value.expression)) {
      name = this.generateLiquidCode(nameAttr.value.expression, false, undefined, context).replace(/"/g, "'")
    }

    const attributes = openingElement.attributes
      .filter((attr): attr is JSXAttribute => isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name !== 'name')
      .map((attr) => {
        const attrName = attr.name.name === 'className' ? 'class' : attr.name.name
        if (isStringLiteral(attr.value)) {
          return `${attrName}: '${attr.value.value}'`
        } else if (isJSXExpressionContainer(attr.value) && isExpression(attr.value.expression)) {
          let code = this.generateLiquidCode(attr.value.expression, false, undefined, context)
          code = code.replace(/"/g, "'")
          return `${attrName}: ${code}`
        }
        return attrName
      })
      .join(', ')

    const attrString = attributes.length > 0 ? `, ${attributes}` : ''
    const children = this.renderChildren(node.children, undefined, context)

    return `{% form ${name}${attrString} %}\n${children}\n{% endform %}`
  }
}
