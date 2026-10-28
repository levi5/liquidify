import {
  identifier,
  isCallExpression,
  isIdentifier,
  isNumericLiteral,
  isObjectExpression,
  isObjectProperty,
  isStringLiteral,
  type CallExpression,
  type Expression,
  type Node,
} from '@babel/types'
import { HELPER_TO_FILTER, JSON_HELPERS, RAW_HELPERS, TRANSLATE_HELPERS } from '../../../../../shared/tsx-helper-filters'
import { liquidJsonOutput } from '../../../../../shared/html'
import { hoistLogicalOperators } from './pipe-guard'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

type GenerateFn = (node: unknown, inCondition?: boolean, renames?: Record<string, string>, context?: ParsingContext) => string

export class HelperCallParser {
  constructor(private readonly generate: GenerateFn) {}

  public parseHelperExpression(expr: Expression, renames?: Record<string, string>, context?: ParsingContext): string | null {
    if (!isCallExpression(expr) || !isIdentifier(expr.callee)) return null
    const name = (expr.callee as { name: string }).name
    const arg = (expr as CallExpression).arguments[0]
    if (arg === undefined || !hasNodeType(arg)) return null
    if (RAW_HELPERS.has(name)) {
      const inner = this.generate(arg as Expression, false, renames, context)
      return `${this.pendingOf(context)}{{ ${inner} }}`
    }
    if (JSON_HELPERS.has(name)) {
      const inner = this.generate(arg as Expression, false, renames, context)
      return `${this.pendingOf(context)}${liquidJsonOutput(inner)}`
    }
    return null
  }

  public rewriteHelperCall(n: CallExpression, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): boolean {
    if (!isIdentifier(n.callee)) return false
    const name = (n.callee as { name: string }).name
    if (RAW_HELPERS.has(name) || JSON_HELPERS.has(name)) {
      this.rewritePassthrough(n, name, inCondition, renames, context)
      return true
    }
    if (TRANSLATE_HELPERS.has(name)) {
      this.rewriteTranslate(n, inCondition, renames, context)
      return true
    }
    if (name === 'imageUrl' || name === 'image_url') {
      this.rewriteImageUrl(n, inCondition, renames, context)
      return true
    }
    if (name === 'defaultValue') {
      this.rewriteDefaultValue(n, inCondition, renames, context)
      return true
    }
    const filter = HELPER_TO_FILTER[name]
    if (filter === undefined) return false
    this.rewriteFilter(n, filter, inCondition, renames, context)
    return true
  }

  private rewritePassthrough(
    n: CallExpression,
    name: string,
    inCondition: boolean,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): void {
    const arg = n.arguments.find(hasNodeType)
    if (arg === undefined) return
    const inner = this.generate(arg as Expression, inCondition, renames, context)
    Object.assign(n, identifier(name === 'json' ? `${inner} | json` : inner))
  }

  private rewriteTranslate(n: CallExpression, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    const args = n.arguments.filter(hasNodeType)
    if (args.length === 0) return
    const key = this.generate(args[0] as Expression, inCondition, renames, context)
    const suffix = this.translateParams(args.slice(1), inCondition, renames, context)
    Object.assign(n, identifier(`${key} | t${suffix}`))
  }

  private translateParams(args: unknown[], inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): string {
    if (args.length === 0) return ''
    if (args.length === 1 && isObjectExpression(args[0] as Node)) {
      const pairs = this.objectPairs(args[0] as Parameters<HelperCallParser['objectPairs']>[0], inCondition, renames, context)
      return pairs === '' ? '' : `: ${pairs}`
    }
    const rest = args
      .map((arg) => hoistLogicalOperators(this.generate(arg as Expression, inCondition, renames, context), 't', context))
      .join(', ')
    return `: ${rest}`
  }

  private rewriteImageUrl(n: CallExpression, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    const args = n.arguments.filter(hasNodeType)
    if (args.length === 0) return
    const src = this.generate(args[0] as Expression, inCondition, renames, context)
    const suffix = this.imageSize(args[1], inCondition, renames, context)
    Object.assign(n, identifier(`${src} | image_url${suffix}`))
  }

  private imageSize(arg: unknown, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): string {
    if (arg === undefined || !hasNodeType(arg)) return ''
    if (isNumericLiteral(arg as Node)) return `: width: ${(arg as { value: number }).value}`
    if (isObjectExpression(arg as Node)) {
      const pairs = this.objectPairs(arg as Parameters<HelperCallParser['objectPairs']>[0], inCondition, renames, context)
      return pairs === '' ? '' : `: ${pairs}`
    }
    return `: width: ${hoistLogicalOperators(this.generate(arg as Expression, inCondition, renames, context), 'image_url', context)}`
  }

  private rewriteDefaultValue(n: CallExpression, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    const args = n.arguments.filter(hasNodeType)
    if (args.length === 0) return
    const value = this.generate(args[0] as Expression, inCondition, renames, context)
    const fallback =
      args.length > 1
        ? hoistLogicalOperators(this.generate(args[1] as Expression, inCondition, renames, context), 'default', context)
        : '""'
    Object.assign(n, identifier(`${value} | default: ${fallback}`))
  }

  private rewriteFilter(
    n: CallExpression,
    filter: string,
    inCondition: boolean,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): void {
    const args = n.arguments.filter(hasNodeType)
    if (args.length === 0) return
    const input = this.generate(args[0] as Expression, inCondition, renames, context)
    const rest = args
      .slice(1)
      .map((arg) => hoistLogicalOperators(this.generate(arg as Expression, inCondition, renames, context), filter, context))
    const suffix = rest.length > 0 ? `: ${rest.join(', ')}` : ''
    Object.assign(n, identifier(`${input} | ${filter}${suffix}`))
  }

  private objectPairs(
    obj: { properties: Array<{ key?: unknown; value?: unknown }> },
    inCondition: boolean,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    return obj.properties
      .filter((prop) => isObjectProperty(prop as Node))
      .map((prop) => {
        const key = this.objectKey((prop as { key: unknown }).key)
        const valueNode = (prop as { value: Expression }).value as Expression
        let value: string
        if (isNumericLiteral(valueNode)) {
          value = String((valueNode as { value: number }).value)
        } else {
          value = hoistLogicalOperators(this.generate(valueNode, inCondition, renames, context), 'param', context)
        }
        return key === '' ? '' : `${key}: ${value}`
      })
      .filter(Boolean)
      .join(', ')
  }

  private objectKey(key: unknown): string {
    if (isIdentifier(key as Node)) return (key as { name: string }).name
    if (isStringLiteral(key as Node)) return (key as { value: string }).value
    return ''
  }

  private pendingOf(context?: ParsingContext): string {
    if (context === undefined) return ''
    return context.getPendingAssigns()
  }
}

function hasNodeType(arg: unknown): boolean {
  return typeof arg === 'object' && arg !== null && 'type' in arg
}
