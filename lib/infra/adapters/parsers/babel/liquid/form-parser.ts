import {
  type JSXElement,
  type JSXAttribute,
  type StringLiteral,
  type JSXExpressionContainer,
  isJSXAttribute,
  isJSXIdentifier,
  isStringLiteral,
  isJSXExpressionContainer,
  isExpression,
  type Node,
} from '@babel/types'
import { _match } from 'funcio'
import { ValidationError } from '../../../../../core/errors/validation-error'

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
      (attr): attr is JSXAttribute => isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name === 'name',
    )
    _match(nameAttr === undefined)
      .with(true, () => {
        throw new ValidationError(
          '<FormBlock> requires a "name" attribute (e.g. <FormBlock name="contact"> or <FormBlock name="product">).',
          context?.currentFilePath,
          this.locationOf(node),
        )
      })
      .with(false, () => undefined)
      .exec()
    const name = this.formName(nameAttr, context)
    _match(name === "''" || name.trim() === '')
      .with(true, () => {
        throw new ValidationError(
          '<FormBlock> "name" could not be resolved to a Liquid form type.',
          context?.currentFilePath,
          this.locationOf(node),
        )
      })
      .with(false, () => undefined)
      .exec()
    const attributes = openingElement.attributes
      .filter((attr): attr is JSXAttribute => isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name !== 'name')
      .map((attr) => this.formatAttribute(attr, context))
      .join(', ')
    const attrString = _match(attributes === '')
      .with(true, () => '')
      .with(false, () => `, ${attributes}`)
      .exec() as string
    const children = this.renderChildren(node.children, undefined, context)
    return `{% form ${name}${attrString} %}\n${children}\n{% endform %}`
  }

  private formName(nameAttr: JSXAttribute | undefined, context?: ParsingContext): string {
    return _match(nameAttr === undefined)
      .with(true, () => "''")
      .with(false, () => this.formNameValue(nameAttr as JSXAttribute, context))
      .exec() as string
  }

  private formNameValue(nameAttr: JSXAttribute, context?: ParsingContext): string {
    return _match(true)
      .with(isStringLiteral(nameAttr.value), () => `'${(nameAttr.value as StringLiteral).value}'`)
      .with(isJSXExpressionContainer(nameAttr.value) && isExpression((nameAttr.value as JSXExpressionContainer).expression), () =>
        this.generateLiquidCode((nameAttr.value as JSXExpressionContainer).expression as Node, false, undefined, context).replace(
          /"/g,
          "'",
        ),
      )
      .with(true, () => "''")
      .exec() as string
  }

  private formatAttribute(attr: JSXAttribute, context?: ParsingContext): string {
    const attrName = _match((attr.name as { name: string }).name === 'className')
      .with(true, () => 'class')
      .with(false, () => (attr.name as { name: string }).name)
      .exec() as string
    return _match(true)
      .with(isStringLiteral(attr.value), () => `${attrName}: '${(attr.value as StringLiteral).value}'`)
      .with(
        isJSXExpressionContainer(attr.value) && isExpression((attr.value as JSXExpressionContainer).expression),
        () => `${attrName}: ${this.expressionAttribute(attr.value as JSXExpressionContainer, context)}`,
      )
      .with(true, () => attrName)
      .exec() as string
  }

  private expressionAttribute(container: JSXExpressionContainer, context?: ParsingContext): string {
    return this.generateLiquidCode(container.expression as Node, false, undefined, context).replace(/"/g, "'")
  }

  private locationOf(node: unknown): { line: number; column: number } | undefined {
    const loc = (node as { loc?: { start: { line: number; column: number } } }).loc
    return loc === undefined ? undefined : { line: loc.start.line, column: loc.start.column + 1 }
  }
}
