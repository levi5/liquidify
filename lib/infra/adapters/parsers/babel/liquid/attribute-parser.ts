import { EventAttributeConverter } from './event-attribute-converter'
import {
  isArrowFunctionExpression,
  isExpression,
  isIdentifier,
  isJSXAttribute,
  isJSXExpressionContainer,
  isJSXIdentifier,
  isObjectExpression,
  isObjectProperty,
  isStringLiteral,
  isUnaryExpression,
  isBinaryExpression,
  isBooleanLiteral,
  isConditionalExpression,
  isLogicalExpression,
  type ArrowFunctionExpression,
  type JSXAttribute,
  type JSXExpressionContainer,
  type JSXSpreadAttribute,
  type Expression,
  type Node,
  type ConditionalExpression,
  type LogicalExpression,
  type ObjectExpression,
} from '@babel/types'

import { HTMLAttributeConverter } from '../html/attribute-parser'
import { _match } from 'funcio'
import type { ILiquidExpressionParser } from '../../../../../types/liquid'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'
import { pascalToKebab } from '../../../../../shared/string'
import { BOOLEAN_ATTRIBUTES as booleanAttributes } from '../../../../../shared/liquid-constants'
import { escapeAttributeTemplate, escapedOutput } from '../../../../../shared/html'
import { renderCondition } from './condition'

const COMPARISON_OPERATORS = new Set(['==', '===', '!=', '!==', '>', '<', '>=', '<='])

export class LiquidAttributeConverter {
  private readonly eventConverter: EventAttributeConverter

  constructor(
    private readonly expressionParser: ILiquidExpressionParser,
    componentName?: string,
    mode?: string,
    private readonly htmlAttributeConverter = new HTMLAttributeConverter(),
  ) {
    this.eventConverter = new EventAttributeConverter(expressionParser, componentName, mode)
  }

  public getAttributes(
    attributes: Array<JSXAttribute | JSXSpreadAttribute>,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    return attributes
      .map((attr) => this.convertAttribute(attr, renames, context))
      .filter(Boolean)
      .join('')
  }

  private convertAttribute(
    attribute: JSXAttribute | JSXSpreadAttribute,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    return _match(!isJSXAttribute(attribute) || !isJSXIdentifier((attribute as JSXAttribute).name))
      .with(true, () => '')
      .with(false, () => this.convertNamedAttribute(attribute as JSXAttribute, renames, context))
      .exec() as string
  }

  private convertNamedAttribute(attribute: JSXAttribute, renames?: Record<string, string>, context?: ParsingContext): string {
    const attributeName = this.normalizeAttributeName(attribute)
    return _match(true)
      .with(!attributeName && !this.eventConverter.isDomMode(context), () => '')
      .with(!attribute.value, () => ` ${attributeName}`)
      .with(
        isStringLiteral(attribute.value),
        () => ` ${attributeName}="${escapeAttributeTemplate((attribute.value as { value: string }).value)}"`,
      )
      .with(isJSXExpressionContainer(attribute.value), () => this.handleExpressionAttribute(attribute, attributeName, renames, context))
      .with(true, () => '')
      .exec() as string
  }

  private handleExpressionAttribute(
    attribute: JSXAttribute,
    attributeName: string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const expression = (attribute.value as JSXExpressionContainer).expression
    return _match(true)
      .with(!isExpression(expression), () => '')
      .with(this.isEventArrowFunction(attributeName, attribute), () =>
        this.eventConverter.convert(
          attribute as JSXAttribute & { value: JSXExpressionContainer & { expression: ArrowFunctionExpression } },
          attributeName,
          renames,
          context,
        ),
      )
      .with(attributeName === 'style' && isObjectExpression(expression), () =>
        this.handleStyleObject(expression as ObjectExpression, renames, context),
      )
      .with(booleanAttributes.has(attributeName), () =>
        this.renderBoolean(expression as Expression, ` ${attributeName}`, '', renames, context),
      )
      .with(true, () => this.handleDefaultExpression(attributeName, expression as Expression, renames, context))
      .exec() as string
  }

  private renderBoolean(
    expression: Expression,
    yes: string,
    no: string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    return _match(true)
      .with(isBooleanLiteral(expression), () => ((expression as { value: boolean }).value ? yes : no))
      .with(isConditionalExpression(expression), () =>
        this.renderConditionalBoolean(expression as ConditionalExpression, yes, no, renames, context),
      )
      .with(true, () => this.renderConditionBoolean(expression, yes, no, renames, context))
      .exec() as string
  }

  private renderConditionalBoolean(
    expression: ConditionalExpression,
    yes: string,
    no: string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const consequent = this.renderBoolean(expression.consequent as Expression, yes, no, renames, context)
    const alternate = this.renderBoolean(expression.alternate as Expression, yes, no, renames, context)
    return this.conditionMarkup(expression.test, consequent, alternate, renames, context)
  }

  private renderConditionBoolean(
    expression: Expression,
    yes: string,
    no: string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    return this.conditionMarkup(expression, yes, no, renames, context)
  }

  private conditionMarkup(test: Expression, yes: string, no: string, renames?: Record<string, string>, context?: ParsingContext): string {
    const markup = renderCondition(test, yes, no, (node) => this.expressionParser.generateLiquidCode(node, true, renames, context))
    return `${this.pendingOf(context)}${markup}`
  }

  private renderValue(expression: Expression, renames?: Record<string, string>, context?: ParsingContext): string {
    return _match(true)
      .with(isStringLiteral(expression), () => this.renderStringValue(expression as { value: string }))
      .with(isConditionalExpression(expression), () => this.renderConditionalValue(expression as ConditionalExpression, renames, context))
      .with(isLogicalExpression(expression) && (expression as LogicalExpression).operator === '??', () =>
        this.renderNilCoalescing(expression as LogicalExpression, renames, context),
      )
      .with(this.isBooleanExpression(expression) || isLogicalExpression(expression), () =>
        this.renderBoolean(expression, 'true', 'false', renames, context),
      )
      .with(true, () => this.renderCodeValue(expression, renames, context))
      .exec() as string
  }

  private renderStringValue(expression: { value: string }): string {
    return _match(expression.value.includes('|') && !expression.value.includes('{{') && !expression.value.includes('{%'))
      .with(true, () => escapedOutput(expression.value.trim()))
      .with(false, () => escapeAttributeTemplate(expression.value))
      .exec() as string
  }

  private renderConditionalValue(expression: ConditionalExpression, renames?: Record<string, string>, context?: ParsingContext): string {
    const yes = this.renderValue(expression.consequent as Expression, renames, context)
    const no = this.renderValue(expression.alternate as Expression, renames, context)
    return this.conditionMarkup(expression.test, yes, no, renames, context)
  }

  private renderNilCoalescing(expression: LogicalExpression, renames?: Record<string, string>, context?: ParsingContext): string {
    const left = this.expressionParser.generateLiquidCode(expression.left, false, renames, context)
    return `{% if ${left} != nil %}${this.renderValue(expression.left as Expression, renames, context)}{% else %}${this.renderValue(expression.right as Expression, renames, context)}{% endif %}`
  }

  private renderCodeValue(expression: Expression, renames?: Record<string, string>, context?: ParsingContext): string {
    const code = this.expressionParser.generateLiquidCode(expression, false, renames, context)
    return `${this.pendingOf(context)}${escapedOutput(code)}`
  }

  private isBooleanExpression(node: Expression): boolean {
    return (
      isBooleanLiteral(node) ||
      (isUnaryExpression(node) && node.operator === '!') ||
      (isBinaryExpression(node) && COMPARISON_OPERATORS.has(node.operator))
    )
  }

  private handleStyleObject(expression: ObjectExpression, renames?: Record<string, string>, context?: ParsingContext): string {
    const styles = expression.properties
      .filter(isObjectProperty)
      .map((prop) => this.styleEntry(prop, renames, context))
      .filter(Boolean)
    return _match(styles.length > 0)
      .with(true, () => ` style="${styles.join(' ')} "`)
      .with(false, () => '')
      .exec() as string
  }

  private styleEntry(prop: { key: unknown; value: unknown }, renames?: Record<string, string>, context?: ParsingContext): string {
    const key = _match(true)
      .with(isIdentifier(prop.key as Node), () => pascalToKebab((prop.key as { name: string }).name))
      .with(isStringLiteral(prop.key as Node), () => (prop.key as { value: string }).value)
      .with(true, () => '')
      .exec() as string
    return _match(key === '')
      .with(true, () => '')
      .with(false, () => `${key}: ${this.renderValue(prop.value as Expression, renames, context)};`)
      .exec() as string
  }

  private handleDefaultExpression(
    attributeName: string,
    expression: Expression,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    return _match(attributeName.startsWith('on') && isIdentifier(expression))
      .with(true, () => this.referenceHandler(attributeName, (expression as { name: string }).name, renames, context))
      .with(false, () => ` ${attributeName}="${this.renderValue(expression, renames, context)}"`)
      .exec() as string
  }

  private referenceHandler(attributeName: string, handlerName: string, renames?: Record<string, string>, context?: ParsingContext): string {
    const handler = this.eventConverter.convertReference(handlerName, attributeName, context)
    return _match(!handler)
      .with(
        true,
        () => ` ${attributeName}="${this.renderValue({ type: 'Identifier', name: handlerName } as Expression, renames, context)}"`,
      )
      .with(false, () => handler as string)
      .exec() as string
  }

  private isEventArrowFunction(
    attributeName: string,
    attribute: JSXAttribute,
  ): attribute is JSXAttribute & { value: JSXExpressionContainer & { expression: ArrowFunctionExpression } } {
    return (
      attributeName.startsWith('on') &&
      attribute.value !== null &&
      attribute.value !== undefined &&
      isJSXExpressionContainer(attribute.value) &&
      isArrowFunctionExpression(attribute.value.expression)
    )
  }

  private normalizeAttributeName(attribute: JSXAttribute): string {
    const name = (attribute.name as { name: string }).name
    const converted = this.htmlAttributeConverter.toHtmlAttribute(name)
    return _match(converted !== '' && converted.startsWith('on'))
      .with(true, () => converted.toLowerCase())
      .with(false, () => converted)
      .exec() as string
  }

  private pendingOf(context?: ParsingContext): string {
    return _match(context === undefined)
      .with(true, () => '')
      .with(false, () => (context as ParsingContext).getPendingAssigns())
      .exec() as string
  }
}
