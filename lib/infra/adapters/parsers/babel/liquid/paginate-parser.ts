import {
  isStringLiteral,
  type JSXElement,
  type StringLiteral,
  type JSXExpressionContainer,
  isJSXAttribute,
  isJSXIdentifier,
  isJSXExpressionContainer,
  isExpression,
  type Node,
  type JSXAttribute,
} from '@babel/types'
import { _match } from 'funcio'
import { ValidationError } from '../../../../../core/errors/validation-error'
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
    const collection = this.readAttribute(
      openingElement.attributes.find(
        (attr): attr is JSXAttribute => isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name === 'collection',
      ),
      context,
    )
    const by = this.readAttribute(
      openingElement.attributes.find(
        (attr): attr is JSXAttribute => isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name === 'by',
      ),
      context,
    )
    _match(collection.trim() === '' || by.trim() === '')
      .with(true, () => {
        throw new ValidationError(
          '<PaginateByLiquid> requires "collection" and "by" (e.g. <PaginateByLiquid collection={products} by={12}>).',
          context?.currentFilePath,
          this.locationOf(node),
        )
      })
      .with(false, () => undefined)
      .exec()
    const children = this.renderChildren(node.children, undefined, context)
    return `{% paginate ${collection} by ${by} %}\n${children}\n{% endpaginate %}`
  }

  private locationOf(node: unknown): { line: number; column: number } | undefined {
    const loc = (node as { loc?: { start: { line: number; column: number } } }).loc
    return loc === undefined ? undefined : { line: loc.start.line, column: loc.start.column + 1 }
  }

  private readAttribute(attr: JSXAttribute | undefined, context?: ParsingContext): string {
    return _match(attr === undefined)
      .with(true, () => '')
      .with(false, () => this.attributeValue((attr as JSXAttribute).value, context))
      .exec() as string
  }

  private attributeValue(value: JSXAttribute['value'], context?: ParsingContext): string {
    return _match(true)
      .with(isStringLiteral(value), () => (value as StringLiteral).value)
      .with(isJSXExpressionContainer(value), () => this.containerValue(value as JSXExpressionContainer, context))
      .with(true, () => '')
      .exec() as string
  }

  private containerValue(container: JSXExpressionContainer, context?: ParsingContext): string {
    return _match(isExpression(container.expression))
      .with(true, () => this.generateLiquidCode(container.expression as Node, false, undefined, context))
      .with(false, () => '')
      .exec() as string
  }
}
