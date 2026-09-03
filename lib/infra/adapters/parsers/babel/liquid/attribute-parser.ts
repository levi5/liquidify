import {
  isArrowFunctionExpression,
  isBlockStatement,
  isCallExpression,
  isExpression,
  isIdentifier,
  isJSXAttribute,
  isJSXExpressionContainer,
  isJSXIdentifier,
  isMemberExpression,
  isObjectExpression,
  isStringLiteral,
  isTemplateLiteral,
  isUnaryExpression,
  isBinaryExpression,
  isBooleanLiteral,
  isConditionalExpression,
  type ArrowFunctionExpression,
  type JSXAttribute,
  type JSXExpressionContainer,
  type JSXSpreadAttribute,
  type ConditionalExpression,
} from '@babel/types'

import { HTMLAttributeConverter } from '../html/attribute-parser'
import { _Maybe } from 'funcio'
import { ILiquidExpressionParser } from '../../../../../types/liquid'
import { ParsingContext } from '../../../../../core/entities/parsing-context'
import { pascalToKebab } from '../../../../../shared/string'

export class LiquidAttributeConverter {
  constructor(
    private readonly expressionParser: ILiquidExpressionParser,
    private readonly componentName?: string,
    private readonly mode?: string,
    private readonly htmlAttributeConverter = new HTMLAttributeConverter(),
  ) {}

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

    if (!attributeName && !this.isDomMode(context)) return ''

    if (!attribute.value) return ` ${attributeName}`
    if (isStringLiteral(attribute.value)) {
      const val = attribute.value.value
      const finalVal = val.includes('{{') && !val.includes('| escape') ? val.replace(' }}', ' | escape }}') : val
      return ` ${attributeName}="${this.escapeQuotes(finalVal)}"`
    }
    if (isJSXExpressionContainer(attribute.value)) return this.handleExpressionAttribute(attribute, attributeName, renames, context)
    return ''
  }

  private escapeQuotes(value: string): string {
    return value.replace(/"/g, '&quot;')
  }

  private interpolateLiquidVariables(code: string): string {
    const jsReserved = new Set([
      'new',
      'var',
      'const',
      'let',
      'function',
      'return',
      'if',
      'else',
      'for',
      'while',
      'break',
      'continue',
      'true',
      'false',
      'null',
      'undefined',
      'typeof',
      'instanceof',
      'window',
      'document',
      'console',
      'event',
      'e',
      'Math',
      'JSON',
      'Object',
      'Array',
      'Error',
      'CustomEvent',
      'this',
      'setTimeout',
      'setInterval',
      'location',
      'history',
      'URLSearchParams',
      'preventDefault',
      'stopPropagation',
      'target',
      'currentTarget',
      'dispatchEvent',
    ])

    const regex = /('[^']*'|"[^"]*"|`[^`]*`)|(^|[^.a-zA-Z0-9_'"/:;])\b([a-zA-Z_][a-zA-Z0-9_.]*)\b(?!\s*:)/g

    return code.replace(regex, (match, str, prefix, id) => {
      if (str) return match

      const baseId = id.split('.')[0]
      if (jsReserved.has(baseId)) return match

      return `${prefix}{{ ${id} | json | escape }}`
    })
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
    if (this.isClassTemplate(attributeName, expression)) return this.getClassName(attribute, renames, context)
    if (this.isEventArrowFunction(attributeName, attribute)) return this.handleEventHandler(attribute, attributeName, renames, context)

    if (attributeName === 'style' && isObjectExpression(expression)) {
      return this.handleStyleObject(expression, renames, context)
    }

    if (this.isBooleanExpression(expression) && !this.isDomMode(context)) {
      if (isUnaryExpression(expression) && expression.operator === '!') {
        const argCode = this.expressionParser.generateLiquidCode(expression.argument, false, renames, context)
        return ` {% unless ${argCode} %}${attributeName}{% endunless %}`
      }
      const condition = this.expressionParser.generateLiquidCode(expression, false, renames, context)
      return ` {% if ${condition} %}${attributeName}{% endif %}`
    }

    if (isConditionalExpression(expression)) return this.handleConditionalAttribute(attributeName, expression, renames, context)

    return this.handleDefaultExpression(attributeName, expression, renames, context)
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

        const value = this.expressionParser.parseExpression(prop.value, renames, context)

        return `${key}: ${value};`
      })
      .filter(Boolean)

    return styles.length > 0 ? ` style="${styles.join(' ')} "` : ''
  }

  private handleConditionalAttribute(
    attributeName: string,
    expression: ConditionalExpression,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const condition = this.expressionParser.generateLiquidCode(expression.test, true, renames, context)
    const consequent = this.expressionParser.parseExpression(expression.consequent, renames, context)
    const alternate = this.expressionParser.parseExpression(expression.alternate, renames, context)

    const cleanConsequent = this.escapeQuotes(consequent.replace(/^{{\s*|\s*}}$/g, ''))
    const cleanAlternate = this.escapeQuotes(alternate.replace(/^{{\s*|\s*}}$/g, ''))

    return ` ${attributeName}="{% if ${condition} %}${cleanConsequent}{% else %}${cleanAlternate}{% endif %}"`
  }

  private handleDefaultExpression(
    attributeName: string,
    expression: any,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const componentName = context?.componentName || this.componentName
    if (this.isDomMode(context) && componentName && attributeName.startsWith('on') && isIdentifier(expression)) {
      const kebabName = pascalToKebab(componentName)
      return ` ${attributeName}="liquidify['${kebabName}'].${expression.name}(event)"`
    }

    const parsed = this.expressionParser.parseExpression(expression, renames, context)
    const trimmed = parsed.trim()

    if (this.isLiquidSyntax(trimmed)) return ` ${attributeName}="${this.escapeQuotes(parsed)}"`

    const generated = this.expressionParser.generateLiquidCode(expression, false, renames, context)
    if (trimmed === generated && !this.isLiquidSyntax(generated)) {
      return ` ${attributeName}="${this.escapeQuotes(generated)}"`
    }

    const finalGenerated = generated.includes('| escape') ? generated : `${generated} | escape`
    return ` ${attributeName}="{{ ${finalGenerated} }}"`
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

  private handleEventHandler(
    attribute: JSXAttribute & { value: JSXExpressionContainer & { expression: ArrowFunctionExpression } },
    attributeName: string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const arrowFunction = attribute.value.expression
    const firstParam = arrowFunction.params[0]
    const eventName = isIdentifier(firstParam) ? firstParam.name : 'event'
    const componentName = context?.componentName || this.componentName

    if (!isCallExpression(arrowFunction.body)) {
      let code = this.expressionParser.generateLiquidCode(arrowFunction.body, false, renames, context)
      if (this.isDomMode(context) && componentName) {
        if (eventName !== 'event') {
          code = code.replace(new RegExp(`\\b${eventName}\\b`, 'g'), 'event')
        }

        if (!isBlockStatement(arrowFunction.body)) {
          const kebabName = pascalToKebab(componentName)
          code = `liquidify['${kebabName}'].${code}`
        }
      }

      if (!this.isDomMode(context)) {
        code = this.interpolateLiquidVariables(code)
      }

      return ` ${attributeName}="${this.escapeQuotes(code)}"`
    }

    let callee = this.expressionParser.generateLiquidCode(arrowFunction.body.callee, false, renames, context)
    if (this.isDomMode(context) && componentName && !callee.includes('.') && !callee.includes('[')) {
      const kebabName = pascalToKebab(componentName)
      callee = `liquidify['${kebabName}'].${callee}`
    }

    const args = arrowFunction.body.arguments
      .map((arg) => {
        const argCode = this.expressionParser.generateLiquidCode(arg, false, renames, context)
        if (this.isDomMode(context) && argCode === eventName) {
          return 'event'
        }
        return argCode
      })
      .join(', ')

    let code = `${callee}(${args})`
    if (!this.isDomMode(context)) {
      code = this.interpolateLiquidVariables(code)
    }

    return ` ${attributeName}="${this.escapeQuotes(code)}"`
  }

  private isClassTemplate(name: string, expression: any): boolean {
    return name === 'class' && isTemplateLiteral(expression)
  }

  private getClassName(attribute: JSXAttribute | JSXSpreadAttribute, renames?: Record<string, string>, context?: ParsingContext): string {
    const classNames: string[] = []
    const expression = _Maybe
      .of(attribute)
      .map((attribute) => attribute.value)
      .map((identifier) => identifier.expression)
      .map((expression) => expression)
      .getOrElse(null)

    _Maybe
      .of(expression)
      .map((expression) => expression.quasis)
      .map((quasis) => quasis)
      .getOrElse([])
      .forEach(({ value: { raw } }: any) => {
        const value = raw.trim().replace(/,/g, '')
        value && classNames.push(...value.split(/\s+/).filter(Boolean))
      })

    _Maybe
      .of(expression)
      .map((expression) => expression.expressions)
      .map((expressions) => expressions)
      .getOrElse([])
      .forEach((expression: any) => {
        if (isMemberExpression(expression) && isIdentifier(expression.property)) {
          classNames.push(expression.property.name)
          return
        }

        if (isIdentifier(expression)) {
          classNames.push(`{{ ${expression.name} }}`)
          return
        }

        classNames.push(this.expressionParser.generateLiquidCode(expression, false, renames, context))
      })

    const finalClasses = classNames
      .filter(Boolean)
      .map((className) => className.replace(/"/g, ''))
      .join(' ')

    return ` class="${finalClasses}"`
  }

  private isLiquidSyntax(value: string): boolean {
    return value.startsWith('{{') || value.startsWith('{%') || value.includes('{{')
  }

  private normalizeAttributeName(attribute: JSXAttribute): string {
    const name = _Maybe
      .of(attribute)
      .map((attribute) => attribute.name)
      .map((identifier) => identifier.name)
      .map((name) => name)
      .getOrElse('')

    let attributeName = this.htmlAttributeConverter.toHtmlAttribute(name)

    if (attributeName && attributeName.startsWith('on')) {
      attributeName = attributeName.toLowerCase()
    }
    return attributeName
  }

  private isDomMode(context?: ParsingContext): boolean {
    const mode = context?.mode || this.mode
    return mode === 'dom' || mode === 'dom:global'
  }
}
