import {
  type JSXElement,
  isJSXAttribute,
  isJSXIdentifier,
  isJSXExpressionContainer,
  isStringLiteral,
  type JSXAttribute,
} from '@babel/types'

export class LiquidSvgParser {
  public transformRenderSvg(node: JSXElement): string {
    const openingElement = node.openingElement
    const nameAttr = openingElement.attributes.find(
      (attr) => isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name === 'name',
    ) as JSXAttribute | undefined

    let svgName = ''

    if (nameAttr && isJSXExpressionContainer(nameAttr.value)) {
      if (isStringLiteral(nameAttr.value.expression)) {
        svgName = nameAttr.value.expression.value
      }
    } else if (nameAttr && isStringLiteral(nameAttr.value)) {
      svgName = nameAttr.value.value
    }

    if (!svgName) {
      return ''
    }

    return `{{ '${svgName}' | inline_asset_content }}`
  }
}
