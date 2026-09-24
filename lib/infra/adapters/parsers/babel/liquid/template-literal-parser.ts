import { _match } from 'funcio'
import type { Node, TemplateLiteral } from '@babel/types'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

type GenerateCode = (node: Node, renames?: Record<string, string>, context?: ParsingContext) => string

const CROP_POSITIONS = new Set(['center', 'top', 'bottom', 'left', 'right'])

export class TemplateLiteralParser {
  constructor(private readonly generateCode: GenerateCode) {}

  public parse(expr: TemplateLiteral, context?: ParsingContext, renames?: Record<string, string>): string {
    return _match(expr.expressions.length === 0)
      .with(true, () => this.constantTemplate(expr))
      .with(false, () => this.dynamicTemplate(expr, context, renames))
      .exec() as string
  }

  private constantTemplate(expr: TemplateLiteral): string {
    const raw = expr.quasis.map((q) => q.value.raw).join('')
    return _match(raw.includes('|'))
      .with(true, () => raw)
      .with(false, () => `"${raw}"`)
      .exec() as string
  }

  private dynamicTemplate(expr: TemplateLiteral, context?: ParsingContext, renames?: Record<string, string>): string {
    const arg = `(?:[a-zA-Z0-9_]+\\s*:\\s*)?(?:'[^']*'|"[^"]*"|[^,'\\"\\s|]+)`
    const pattern = new RegExp(`^\\s*\\|\\s*([a-zA-Z0-9_]+(?:\\s*:\\s*${arg}(?:\\s*,\\s*${arg})*)?)`)
    const head = _match(expr.quasis[0].value.raw !== '')
      .with(true, () => `"${expr.quasis[0].value.raw}"`)
      .with(false, () => '')
      .exec() as string
    return expr.expressions.reduce(
      (acc, expression, index) => this.appendExpression(acc, expression, expr.quasis[index + 1].value.raw, pattern, context, renames),
      head,
    )
  }

  private appendExpression(
    acc: string,
    expression: Node,
    quasi: string,
    pattern: RegExp,
    context?: ParsingContext,
    renames?: Record<string, string>,
  ): string {
    const base = this.generateCode(expression, renames, context)
    const filters = this.extractFilters(quasi, pattern)
    const suffixed = _match(filters.text === '')
      .with(true, () => base)
      .with(false, () => `${base} | ${filters.text}`)
      .exec() as string
    const appended = _match(acc === '')
      .with(true, () => suffixed)
      .with(false, () => `${acc} | append: ${suffixed}`)
      .exec() as string
    return _match(filters.remaining === '')
      .with(true, () => appended)
      .with(false, () => `${appended} | append: "${filters.remaining}"`)
      .exec() as string
  }

  private extractFilters(quasi: string, pattern: RegExp, collected: string[] = []): { text: string; remaining: string } {
    const matched = quasi.match(pattern)
    return _match(matched === null)
      .with(true, () => ({ text: collected.join(' | '), remaining: quasi }))
      .with(false, () => this.consumeFilter(quasi, matched as string[], pattern, collected))
      .exec() as { text: string; remaining: string }
  }

  private consumeFilter(quasi: string, matched: string[], pattern: RegExp, collected: string[]): { text: string; remaining: string } {
    return this.extractFilters(quasi.substring(matched[0].length), pattern, [...collected, this.normalizeFilter(matched[1].trim())])
  }

  private normalizeFilter(filterStr: string): string {
    return filterStr.replace(
      /crop\s*:\s*([^,'"\s]+)/g,
      (m, val) =>
        _match(CROP_POSITIONS.has(val))
          .with(true, () => `crop: '${val}'`)
          .with(false, () => m)
          .exec() as string,
    )
  }
}
