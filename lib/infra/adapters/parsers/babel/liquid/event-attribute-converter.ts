import { _match } from 'funcio'
import {
  isIdentifier,
  isCallExpression,
  isBlockStatement,
  type JSXAttribute,
  type JSXExpressionContainer,
  type ArrowFunctionExpression,
  type CallExpression,
} from '@babel/types'
import type { ILiquidExpressionParser } from '../../../../../types/liquid'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'
import { pascalToKebab } from '../../../../../shared/string'

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

export class EventAttributeConverter {
  constructor(
    private readonly expressionParser: ILiquidExpressionParser,
    private readonly componentName?: string,
    private readonly mode?: string,
  ) {}

  private interpolateLiquidVariables(code: string): string {
    const regex = /('[^']*'|"[^"]*"|`[^`]*`)|(^|[^.a-zA-Z0-9_'"/:;])\b([a-zA-Z_][a-zA-Z0-9_.]*)\b(?!\s*:)/g

    return code.replace(regex, (match, str, prefix, id) => {
      if (str) return match

      const baseId = id.split('.')[0]
      if (jsReserved.has(baseId)) return match

      return `${prefix}{{ ${id} | json | escape }}`
    })
  }

  public convert(
    attribute: JSXAttribute & { value: JSXExpressionContainer & { expression: ArrowFunctionExpression } },
    attributeName: string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const arrowFunction = attribute.value.expression
    const firstParam = arrowFunction.params[0]
    const eventName = isIdentifier(firstParam) ? firstParam.name : 'event'
    const componentName = context?.componentName || this.componentName

    const domMode = this.isDomMode(context)
    const prefix = domMode && componentName ? `liquidify['${pascalToKebab(componentName)}'].` : ''
    const generateCode = (node: Parameters<ILiquidExpressionParser['generateLiquidCode']>[0]) =>
      this.expressionParser.generateLiquidCode(node, false, renames, context)

    const code = _match(isCallExpression(arrowFunction.body))
      .with(true, () => {
        const call = arrowFunction.body as CallExpression
        let callee = generateCode(call.callee)
        if (prefix && !callee.includes('.') && !callee.includes('[')) callee = `${prefix}${callee}`
        const args = call.arguments
          .map((arg) => {
            const value = generateCode(arg)
            return domMode && value === eventName ? 'event' : value
          })
          .join(', ')
        return `${callee}(${args})`
      })
      .with(false, () => {
        let body = generateCode(arrowFunction.body)
        if (prefix) {
          if (eventName !== 'event') body = body.replace(new RegExp(`\\b${eventName}\\b`, 'g'), 'event')
          if (!isBlockStatement(arrowFunction.body)) body = `${prefix}${body}`
        }
        return body
      })
      .exec() as string

    const interpolated = _match(domMode)
      .with(true, () => code)
      .with(false, () => this.interpolateLiquidVariables(code))
      .exec() as string
    return ` ${attributeName}="${interpolated.replace(/"/g, '&quot;')}"`
  }

  public convertReference(name: string, attributeName: string, context?: ParsingContext): string {
    const componentName = context?.componentName || this.componentName
    if (!this.isDomMode(context) || !componentName) return ''
    return ` ${attributeName}="liquidify['${pascalToKebab(componentName)}'].${name}(event)"`
  }

  public isDomMode(context?: ParsingContext): boolean {
    const mode = context?.mode || this.mode
    return mode === 'dom' || mode === 'dom:global'
  }
}
