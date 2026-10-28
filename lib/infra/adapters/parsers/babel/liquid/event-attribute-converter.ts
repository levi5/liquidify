import { _match } from 'funcio'
import {
  isIdentifier,
  isCallExpression,
  isBlockStatement,
  type JSXAttribute,
  type JSXExpressionContainer,
  type ArrowFunctionExpression,
  type CallExpression,
  type Node,
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
  'do',
  'break',
  'continue',
  'switch',
  'case',
  'default',
  'try',
  'catch',
  'finally',
  'throw',
  'true',
  'false',
  'null',
  'undefined',
  'typeof',
  'instanceof',
  'in',
  'of',
  'as',
  'from',
  'import',
  'export',
  'class',
  'extends',
  'super',
  'this',
  'await',
  'async',
  'yield',
  'void',
  'delete',
  'static',
  'get',
  'set',
  'debugger',
  'enum',
  'implements',
  'interface',
  'package',
  'private',
  'protected',
  'public',
  'window',
  'document',
  'console',
  'event',
  'e',
  'Math',
  'JSON',
  'Object',
  'Array',
  'String',
  'Number',
  'Boolean',
  'Error',
  'CustomEvent',
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',
  'location',
  'history',
  'URLSearchParams',
  'preventDefault',
  'stopPropagation',
  'target',
  'currentTarget',
  'dispatchEvent',
])

const liquidKeywords = new Set(['or', 'and', 'not', 'contains', 'nil', 'empty', 'blank'])

export class EventAttributeConverter {
  constructor(
    private readonly expressionParser: ILiquidExpressionParser,
    private readonly componentName?: string,
    private readonly mode?: string,
  ) {}

  private interpolateLiquidVariables(code: string): string {
    const regex = /('[^']*'|"[^"]*"|`[^`]*`)|(^|[^.a-zA-Z0-9_'"/:;])\b([a-zA-Z_][a-zA-Z0-9_.]*)\b(?!\s*:)/g
    return code.replace(regex, (match, str, prefix, id) => this.interpolateMatch(match, str, prefix, id))
  }

  private interpolateMatch(match: string, str: string | undefined, prefix: string, id: string | undefined): string {
    return _match(true)
      .with(str !== undefined, () => match)
      .with(id !== undefined && jsReserved.has(id.split('.')[0]), () => match)
      .with(id !== undefined && liquidKeywords.has(id), () => match)
      .with(true, () => `${prefix}{{ ${id} | json | escape }}`)
      .exec() as string
  }

  private restoreJsOperators(code: string): string {
    const literals: string[] = []
    const protectedCode = code.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g, (literal) => {
      literals.push(literal)
      return `__LIQUIDIFY_JS_LITERAL_${literals.length - 1}__`
    })
    const restored = protectedCode.replace(/\bor\b/g, '||').replace(/\band\b/g, '&&')
    return restored.replace(/__LIQUIDIFY_JS_LITERAL_(\d+)__/g, (_, index) => literals[Number(index)])
  }

  public convert(
    attribute: JSXAttribute & { value: JSXExpressionContainer & { expression: ArrowFunctionExpression } },
    attributeName: string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const arrowFunction = attribute.value.expression
    const firstParam = arrowFunction.params[0]
    const eventName = _match(firstParam !== undefined && isIdentifier(firstParam))
      .with(true, () => (firstParam as { name: string }).name)
      .with(false, () => 'event')
      .exec() as string
    const componentName = context?.componentName || this.componentName
    const domMode = this.isDomMode(context)
    const prefix = _match(domMode && componentName !== undefined && componentName !== '')
      .with(true, () => `liquidify['${pascalToKebab(componentName as string)}'].`)
      .with(false, () => '')
      .exec() as string
    const code = _match(isCallExpression(arrowFunction.body))
      .with(true, () => this.callHandler(arrowFunction.body as CallExpression, prefix, domMode, eventName, renames, context))
      .with(false, () => this.bodyHandler(arrowFunction, prefix, eventName, renames, context))
      .exec() as string
    const jsCode = this.restoreJsOperators(code)
    const interpolated = _match(domMode)
      .with(true, () => jsCode)
      .with(false, () => this.interpolateLiquidVariables(jsCode))
      .exec() as string
    return ` ${attributeName}="${this.escapeAttributeValue(interpolated)}"`
  }

  private escapeAttributeValue(value: string): string {
    return value
      .split(/({{[\s\S]*?}})/g)
      .map((part) =>
        part.startsWith('{{') ? part.replace(/"/g, "'") : part.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'),
      )
      .join('')
  }

  private callHandler(
    body: CallExpression,
    prefix: string,
    domMode: boolean,
    eventName: string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const callee = _match(prefix !== '' && !this.isMemberAccess(this.generate(body.callee, renames, context)))
      .with(true, () => `${prefix}${this.generate(body.callee, renames, context)}`)
      .with(false, () => this.generate(body.callee, renames, context))
      .exec() as string
    const args = body.arguments.map((arg) => this.callArgument(arg, domMode, eventName, renames, context)).join(', ')
    return `${callee}(${args})`
  }

  private isMemberAccess(callee: string): boolean {
    return callee.includes('.') || callee.includes('[')
  }

  private callArgument(
    arg: CallExpression['arguments'][number],
    domMode: boolean,
    eventName: string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const value = this.generate(arg as Node, renames, context)
    return _match(domMode && value === eventName)
      .with(true, () => 'event')
      .with(false, () => value)
      .exec() as string
  }

  private bodyHandler(
    arrowFunction: ArrowFunctionExpression,
    prefix: string,
    eventName: string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const body = this.generate(arrowFunction.body as Node, renames, context)
    return _match(prefix === '')
      .with(true, () => body)
      .with(false, () => this.prefixBody(body, prefix, eventName, arrowFunction))
      .exec() as string
  }

  private prefixBody(body: string, prefix: string, eventName: string, arrowFunction: ArrowFunctionExpression): string {
    const renamed = _match(eventName !== 'event')
      .with(true, () => body.replace(new RegExp(`\\b${eventName}\\b`, 'g'), 'event'))
      .with(false, () => body)
      .exec() as string
    return _match(isBlockStatement(arrowFunction.body))
      .with(true, () => renamed)
      .with(false, () => `${prefix}${renamed}`)
      .exec() as string
  }

  private generate(node: Node, renames?: Record<string, string>, context?: ParsingContext): string {
    return this.expressionParser.generateJavaScript(node, renames, context)
  }

  public convertReference(name: string, attributeName: string, context?: ParsingContext): string {
    const componentName = context?.componentName || this.componentName
    return _match(!this.isDomMode(context) || !componentName)
      .with(true, () => '')
      .with(false, () => ` ${attributeName}="liquidify['${pascalToKebab(componentName as string)}'].${name}(event)"`)
      .exec() as string
  }

  public isDomMode(context?: ParsingContext): boolean {
    const mode = context?.mode || this.mode
    return mode === 'dom' || mode === 'dom:global'
  }
}
