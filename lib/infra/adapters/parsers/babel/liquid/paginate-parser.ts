import {
  isStringLiteral,
  type JSXElement,
  isJSXAttribute,
  isJSXIdentifier,
  isJSXExpressionContainer,
  isExpression,
  type Node,
  type JSXAttribute,
} from '@babel/types'
import { _Maybe } from 'funcio'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

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
    const collection = this.readCollection(collectionAttr, context)
    const by = this.readBy(byAttr, context)
    const children = this.renderChildren(node.children, undefined, context)
    return `{% paginate ${collection} by ${by} %}\n${children}\n{% endpaginate %}`
  }

  private readCollection(attr: JSXAttribute | undefined, context?: ParsingContext): string {
    return _Maybe
      .of(attr?.value)
      .map((value) =>
        _Maybe
          .of(isStringLiteral(value) ? value : null)
          .map((v) => v!.value)
          .getOrElse(
            _Maybe
              .of(isJSXExpressionContainer(value) ? value : null)
              .map((v) => v!.expression)
              .map((expr) => (isExpression(expr) ? this.generateLiquidCode(expr, false, undefined, context) : ''))
              .getOrElse(''),
          ),
      )
      .getOrElse('')
  }

  private readBy(attr: JSXAttribute | undefined, context?: ParsingContext): string {
    return _Maybe
      .of(attr?.value)
      .map((value) =>
        _Maybe
          .of(isStringLiteral(value) ? value : null)
          .map((v) => v!.value)
          .getOrElse(
            _Maybe
              .of(isJSXExpressionContainer(value) ? value : null)
              .map((v) => v!.expression)
              .map((expr) => (isExpression(expr) ? this.generateLiquidCode(expr, false, undefined, context) : ''))
              .getOrElse(''),
          ),
      )
      .getOrElse('')
  }
}
