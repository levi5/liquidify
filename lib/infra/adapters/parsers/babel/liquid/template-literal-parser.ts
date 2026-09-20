import { _match } from 'funcio'
import type { Node, TemplateLiteral } from '@babel/types'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

type GenerateCode = (node: Node, renames?: Record<string, string>, context?: ParsingContext) => string

export class TemplateLiteralParser {
  constructor(private readonly generateCode: GenerateCode) {}

  public parse(expr: TemplateLiteral, context?: ParsingContext, renames?: Record<string, string>): string {
    return _match(expr.expressions.length === 0)
      .with(true, () => this.constantTemplate(expr))
      .with(false, () => this.dynamicTemplate(expr, context, renames))
      .exec()
  }

  private constantTemplate(expr: TemplateLiteral): string {
    const raw = expr.quasis.map((q) => q.value.raw).join('')
    return raw.includes('|') ? raw : `"${raw}"`
  }

  private dynamicTemplate(expr: TemplateLiteral, context?: ParsingContext, renames?: Record<string, string>): string {
    let result = expr.quasis[0].value.raw ? `"${expr.quasis[0].value.raw}"` : ''
    const arg = `(?:[a-zA-Z0-9_]+\\s*:\\s*)?(?:'[^']*'|"[^"]*"|[^,'\\"\\s|]+)`
    const regex = new RegExp(`^\\s*\\|\\s*([a-zA-Z0-9_]+(?:\\s*:\\s*${arg}(?:\\s*,\\s*${arg})*)?)`)
    for (let i = 0; i < expr.expressions.length; i++) {
      const base = this.generateCode(expr.expressions[i], renames, context)
      const quasi = expr.quasis[i + 1].value.raw
      const filters: string[] = []
      let remaining = quasi
      while (true) {
        const matched = remaining.match(regex)
        if (!matched) break
        let filterStr = matched[1].trim()
        filterStr = filterStr.replace(/crop\s*:\s*([^,'"\s]+)/g, (m, val) => {
          if (val === 'center' || val === 'top' || val === 'bottom' || val === 'left' || val === 'right') return `crop: '${val}'`
          return m
        })
        filters.push(filterStr)
        remaining = remaining.substring(matched[0].length)
      }
      const filterSuffix = filters.length > 0 ? ` | ${filters.join(' | ')}` : ''
      result = !result ? `${base}${filterSuffix}` : `${result} | append: ${base}${filterSuffix}`
      if (remaining) result += ` | append: "${remaining}"`
    }
    return result
  }
}
