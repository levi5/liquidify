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
  isBooleanLiteral,
  type Node,
} from '@babel/types'
import { _match } from 'funcio'
import { escapedOutput } from '../../../../../shared/html'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

export class LiquidFallbackParser {
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

  public transformFallback(node: JSXElement, context?: ParsingContext): string {
    const of = this.readOf(node.openingElement, context)
    const only = this.readOnly(node.openingElement, context)
    const allowFalse = this.readAllowFalse(node.openingElement)
    const fallbackContent = this.readFallbackContent(node, context)
    return _match(of === '')
      .with(true, () => fallbackContent)
      .with(false, () => this.renderFallback(of, fallbackContent, only, allowFalse))
      .exec() as string
  }

  private renderFallback(of: string, fallbackContent: string, only: string, allowFalse: boolean): string {
    return _match(only)
      .with('nil', () => `{% if ${of} != nil %}${escapedOutput(of)}\n{% else %}\n${fallbackContent}\n{% endif %}`)
      .with('blank', () => `{% if ${of} != blank %}${escapedOutput(of)}\n{% else %}\n${fallbackContent}\n{% endif %}`)
      .with(only, () => escapedOutput(this.defaultCode(of, fallbackContent, allowFalse)))
      .exec() as string
  }

  private defaultCode(of: string, fallbackContent: string, allowFalse: boolean): string {
    const fallbackValue = _match(fallbackContent === '')
      .with(true, () => '""')
      .with(false, () => fallbackContent)
      .exec() as string
    return _match(allowFalse)
      .with(true, () => `${of} | default: ${fallbackValue}, allow_false: true`)
      .with(false, () => `${of} | default: ${fallbackValue}`)
      .exec() as string
  }

  private readFallbackContent(node: JSXElement, context?: ParsingContext): string {
    const prop = this.findAttribute(node.openingElement, 'fallback')
    return _match(prop === undefined)
      .with(true, () => this.renderChildren(node.children, undefined, context).trim())
      .with(false, () => this.attributeValue((prop as JSXAttribute).value, context))
      .exec() as string
  }

  private readOf(openingElement: JSXElement['openingElement'], context?: ParsingContext): string {
    const attr = this.findAttribute(openingElement, 'of')
    return _match(attr === undefined)
      .with(true, () => '')
      .with(false, () => this.attributeValue((attr as JSXAttribute).value, context))
      .exec() as string
  }

  private readOnly(openingElement: JSXElement['openingElement'], context?: ParsingContext): string {
    const attr = this.findAttribute(openingElement, 'only')
    return _match(attr === undefined)
      .with(true, () => 'default')
      .with(false, () => this.normalizeOnly(this.attributeValue((attr as JSXAttribute).value, context)))
      .exec() as string
  }

  private normalizeOnly(value: string): string {
    const normalized = value
      .replace(/^['"]|['"]$/g, '')
      .trim()
      .toLowerCase()
    return _match(normalized)
      .with('nil', () => 'nil')
      .with('blank', () => 'blank')
      .with(normalized, () => 'default')
      .exec() as string
  }

  private readAllowFalse(openingElement: JSXElement['openingElement']): boolean {
    const attr = _match(this.findAttribute(openingElement, 'allowFalse') !== undefined)
      .with(true, () => this.findAttribute(openingElement, 'allowFalse'))
      .with(false, () => this.findAttribute(openingElement, 'allow_false'))
      .exec() as JSXAttribute | undefined
    return _match(attr === undefined)
      .with(true, () => false)
      .with(false, () => this.booleanValue((attr as JSXAttribute).value))
      .exec() as boolean
  }

  private booleanValue(value: JSXAttribute['value']): boolean {
    return _match(true)
      .with(value === undefined || value === null, () => true)
      .with(
        isJSXExpressionContainer(value) && isBooleanLiteral((value as JSXExpressionContainer).expression as Node),
        () => ((value as JSXExpressionContainer).expression as { value: boolean }).value === true,
      )
      .with(true, () => true)
      .exec() as boolean
  }

  private findAttribute(openingElement: JSXElement['openingElement'], name: string): JSXAttribute | undefined {
    return openingElement.attributes.find(
      (attr): attr is JSXAttribute => isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name === name,
    )
  }

  private attributeValue(value: JSXAttribute['value'], context?: ParsingContext): string {
    return _match(true)
      .with(isStringLiteral(value), () => JSON.stringify((value as StringLiteral).value))
      .with(isJSXExpressionContainer(value) && isStringLiteral((value as JSXExpressionContainer).expression as Node), () =>
        JSON.stringify(((value as JSXExpressionContainer).expression as StringLiteral).value),
      )
      .with(isJSXExpressionContainer(value) && isExpression((value as JSXExpressionContainer).expression), () =>
        this.generateLiquidCode((value as JSXExpressionContainer).expression as Node, false, undefined, context),
      )
      .with(true, () => '')
      .exec() as string
  }
}
