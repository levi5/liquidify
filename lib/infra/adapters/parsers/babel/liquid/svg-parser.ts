import {
  type JSXElement,
  type JSXAttribute,
  type StringLiteral,
  type JSXExpressionContainer,
  isJSXAttribute,
  isJSXIdentifier,
  isJSXExpressionContainer,
  isStringLiteral,
} from '@babel/types'
import { _match } from 'funcio'

export class LiquidSvgParser {
  public transformRenderSvg(node: JSXElement): string {
    const svgName = this.svgName(
      node.openingElement.attributes.find(
        (attr): attr is JSXAttribute => isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name === 'name',
      ),
    )
    return _match(svgName === '')
      .with(true, () => '')
      .with(false, () => `{{ '${svgName}' | inline_asset_content }}`)
      .exec() as string
  }

  private svgName(nameAttr: JSXAttribute | undefined): string {
    return _match(nameAttr === undefined)
      .with(true, () => '')
      .with(false, () => this.slotValue(nameAttr as JSXAttribute))
      .exec() as string
  }

  private slotValue(nameAttr: JSXAttribute): string {
    return _match(true)
      .with(
        isJSXExpressionContainer(nameAttr.value) && isStringLiteral((nameAttr.value as JSXExpressionContainer).expression),
        () => ((nameAttr.value as JSXExpressionContainer).expression as StringLiteral).value,
      )
      .with(isStringLiteral(nameAttr.value), () => (nameAttr.value as StringLiteral).value)
      .with(true, () => '')
      .exec() as string
  }
}
