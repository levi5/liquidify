import { EventAttributeConverter } from './event-attribute-converter'
import {
  isArrowFunctionExpression,
  isExpression,
  isIdentifier,
  isJSXAttribute,
  isJSXExpressionContainer,
  isJSXIdentifier,
  isObjectExpression,
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
} from '@babel/types'

import { HTMLAttributeConverter } from '../html/attribute-parser'
import { _Maybe } from 'funcio'
import type { ILiquidExpressionParser } from '../../../../../types/liquid'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'
import { pascalToKebab } from '../../../../../shared/string'
import { escapeAttributeTemplate, escapedOutput } from '../../../../../shared/html'
import { renderCondition } from './condition'

const booleanAttributes = new Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'formnovalidate',
  'hidden',
  'inert',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'selected',
])

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
    if (!isJSXAttribute(attribute) || !isJSXIdentifier(attribute.name)) return ''

    const attributeName = this.normalizeAttributeName(attribute)

    if (!attributeName && !this.eventConverter.isDomMode(context)) return ''

    if (!attribute.value) return ` ${attributeName}`
    if (isStringLiteral(attribute.value)) {
      return ` ${attributeName}="${escapeAttributeTemplate(attribute.value.value)}"`
    }
    if (isJSXExpressionContainer(attribute.value)) return this.handleExpressionAttribute(attribute, attributeName, renames, context)
    return ''
  }

  private handleExpressionAttribute(
    attribute: JSXAttribute,
    attributeName: string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const expression = _Maybe
      .of(attribute)
      .map((attribute) => attribute.value)
      .map((attribute) => (isJSXExpressionContainer(attribute) ? attribute.expression : null))
      .getOrElse(null)

    if (!expression || !isExpression(expression)) return ''
    if (this.isEventArrowFunction(attributeName, attribute)) return this.eventConverter.convert(attribute, attributeName, renames, context)

    if (attributeName === 'style' && isObjectExpression(expression)) {
      return this.handleStyleObject(expression, renames, context)
    }

    if (booleanAttributes.has(attributeName)) {
      return this.renderBoolean(expression, ` ${attributeName}`, '', renames, context)
    }

    return this.handleDefaultExpression(attributeName, expression, renames, context)
  }

  private renderBoolean(expression: any, yes: string, no: string, renames?: Record<string, string>, context?: ParsingContext): string {
    if (isBooleanLiteral(expression)) return expression.value ? yes : no
    if (isConditionalExpression(expression)) {
      const consequent = this.renderBoolean(expression.consequent, yes, no, renames, context)
      const alternate = this.renderBoolean(expression.alternate, yes, no, renames, context)
      const markup = renderCondition(expression.test, consequent, alternate, (node) =>
        this.expressionParser.generateLiquidCode(node, true, renames, context),
      )
      return `${context?.getPendingAssigns() || ''}${markup}`
    }
    const markup = renderCondition(expression, yes, no, (node) => this.expressionParser.generateLiquidCode(node, true, renames, context))
    return `${context?.getPendingAssigns() || ''}${markup}`
  }

  private renderValue(expression: any, renames?: Record<string, string>, context?: ParsingContext): string {
    if (isStringLiteral(expression)) return escapeAttributeTemplate(expression.value)
    if (isConditionalExpression(expression)) {
      const yes = this.renderValue(expression.consequent, renames, context)
      const no = this.renderValue(expression.alternate, renames, context)
      const markup = renderCondition(expression.test, yes, no, (node) =>
        this.expressionParser.generateLiquidCode(node, true, renames, context),
      )
      return `${context?.getPendingAssigns() || ''}${markup}`
    }
    if (isLogicalExpression(expression) && expression.operator === '??') {
      const left = this.expressionParser.generateLiquidCode(expression.left, false, renames, context)
      return `{% if ${left} != nil %}${this.renderValue(expression.left, renames, context)}{% else %}${this.renderValue(expression.right, renames, context)}{% endif %}`
    }
    if (this.isBooleanExpression(expression) || isLogicalExpression(expression)) {
      return this.renderBoolean(expression, 'true', 'false', renames, context)
    }
    const code = this.expressionParser.generateLiquidCode(expression, false, renames, context)
    return `${context?.getPendingAssigns() || ''}${escapedOutput(code)}`
  }

  private isBooleanExpression(node: any): boolean {
    return (
      isBooleanLiteral(node) ||
      (isUnaryExpression(node) && node.operator === '!') ||
      (isBinaryExpression(node) && ['==', '===', '!=', '!==', '>', '<', '>=', '<='].includes(node.operator))
    )
  }

  private handleStyleObject(expression: any, renames?: Record<string, string>, context?: ParsingContext): string {
    const styles = expression.properties
      .filter((prop: any) => prop.type === 'ObjectProperty')
      .map((prop: any) => {
        const key = isIdentifier(prop.key) ? pascalToKebab(prop.key.name) : isStringLiteral(prop.key) ? prop.key.value : ''
        if (!key) return ''

        const value = this.renderValue(prop.value, renames, context)

        return `${key}: ${value};`
      })
      .filter(Boolean)

    return styles.length > 0 ? ` style="${styles.join(' ')} "` : ''
  }

  private handleDefaultExpression(
    attributeName: string,
    expression: any,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    if (attributeName.startsWith('on') && isIdentifier(expression)) {
      const handler = this.eventConverter.convertReference(expression.name, attributeName, context)
      if (handler) return handler
    }
    return ` ${attributeName}="${this.renderValue(expression, renames, context)}"`
  }

  private isEventArrowFunction(
    attributeName: string,
    attribute: JSXAttribute,
  ): attribute is JSXAttribute & { value: JSXExpressionContainer & { expression: ArrowFunctionExpression } } {
    if (!attributeName.startsWith('on')) return false
    if (!attribute.value) return false
    if (!isJSXExpressionContainer(attribute.value)) return false
    if (!isArrowFunctionExpression(attribute.value.expression)) return false
    return true
  }

  private normalizeAttributeName(attribute: JSXAttribute): string {
    const name = _Maybe
      .of(attribute)
      .map((attribute) => attribute.name)
      .map((identifier) => identifier.name)
      .getOrElse('')

    let attributeName = this.htmlAttributeConverter.toHtmlAttribute(name as string)

    if (attributeName && attributeName.startsWith('on')) {
      attributeName = attributeName.toLowerCase()
    }
    return attributeName
  }
}
