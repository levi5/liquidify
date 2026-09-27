import {
  type JSXElement,
  type JSXAttribute,
  type StringLiteral,
  type JSXExpressionContainer,
  type Node,
  isJSXAttribute,
  isJSXIdentifier,
  isJSXExpressionContainer,
  isStringLiteral,
  isExpression,
} from '@babel/types'
import { _match } from 'funcio'
import { ValidationError } from '../../../../../core/errors/validation-error'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

export class LiquidSvgParser {
  constructor(
    private readonly generateLiquidCode?: (
      node: Node,
      inCondition?: boolean,
      renames?: Record<string, string>,
      context?: ParsingContext,
    ) => string,
  ) {}

  public transformRenderSvg(node: JSXElement, _renames?: Record<string, string>, context?: ParsingContext): string {
    const nameAttr = node.openingElement.attributes.find(
      (attr): attr is JSXAttribute => isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name === 'name',
    )
    return _match(nameAttr === undefined)
      .with(true, () => {
        throw new ValidationError(
          '<RenderSvg> requires a "name" attribute (e.g. <RenderSvg name="icon-cart" />).',
          context?.currentFilePath,
        )
      })
      .with(false, () => this.renderSvg(nameAttr as JSXAttribute, context))
      .exec() as string
  }

  private renderSvg(nameAttr: JSXAttribute, context?: ParsingContext): string {
    const literal = this.svgName(nameAttr)
    return _match(literal !== '')
      .with(true, () => `{{ '${literal}' | inline_asset_content }}`)
      .with(false, () => this.dynamicSvg(nameAttr, context))
      .exec() as string
  }

  private dynamicSvg(nameAttr: JSXAttribute, context?: ParsingContext): string {
    return _match(isJSXExpressionContainer(nameAttr.value) && isExpression((nameAttr.value as JSXExpressionContainer).expression))
      .with(true, () => {
        const code =
          this.generateLiquidCode?.((nameAttr.value as JSXExpressionContainer).expression as Node, false, undefined, context) ?? ''
        return _match(code.trim() === '')
          .with(true, () => {
            throw new ValidationError('<RenderSvg> "name" could not be resolved to a Liquid expression.', context?.currentFilePath)
          })
          .with(false, () => `{{ ${code} | inline_asset_content }}`)
          .exec() as string
      })
      .with(false, () => {
        throw new ValidationError('<RenderSvg> "name" must be a string literal or a Liquid expression.', context?.currentFilePath)
      })
      .exec() as string
  }

  private svgName(nameAttr: JSXAttribute): string {
    return this.slotValue(nameAttr)
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
