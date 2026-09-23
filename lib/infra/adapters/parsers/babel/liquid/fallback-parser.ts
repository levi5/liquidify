import { isLogicalExpression, isObjectExpression } from '@babel/types'
import { _Maybe, _match } from 'funcio'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

export class FallbackParser {
  constructor(
    private readonly generateLiquidCode: (
      node: any,
      inCondition?: boolean,
      renames?: Record<string, string>,
      context?: ParsingContext,
    ) => string,
  ) {}

  private collectOrParts(expr: any): any[] {
    return _match(true)
      .with(isLogicalExpression(expr) && (expr.operator === '||' || expr.operator === '??'), () => [
        ...this.collectOrParts(expr.left),
        expr.right,
      ])
      .with(true, () => [expr])
      .exec() as any[]
  }

  public parseOrFallback(idName: string, init: any, renames?: Record<string, string>, context?: ParsingContext): string[] {
    const nodes = this.collectOrParts(init)
    const baseNode = nodes.shift()
    const baseCode = this.generateLiquidCode(baseNode, false, renames, context)
    const hasObjectLiteral = nodes.some((n) => isObjectExpression(n))
    return _match(hasObjectLiteral)
      .with(true, () => {
        const lines = [`{% assign ${idName} = ${baseCode} %}`]
        nodes.forEach((node) => {
          const code = this.generateLiquidCode(node, false, renames, context)
          lines.push(`{% if ${idName} == nil or ${idName} == "" or ${idName} == false %}`)
          _Maybe
            .of(!isObjectExpression(node))
            .map((assignable) => (assignable ? lines.push(`  {% assign ${idName} = ${code} %}`) : null))
            .getOrElse(null)
          lines.push(`{% endif %}`)
        })
        return lines
      })
      .with(hasObjectLiteral, () => {
        const defaults = nodes.map((n) => ` | default: ${this.generateLiquidCode(n, false, renames, context)}`).join('')
        return [`{% assign ${idName} = ${baseCode}${defaults} %}`]
      })
      .exec() as string[]
  }

  public parseNilFallback(idName: string, init: any, renames?: Record<string, string>, context?: ParsingContext): string[] {
    const nodes = this.collectOrParts(init)
    const baseNode = nodes.shift()
    const baseCode = this.generateLiquidCode(baseNode, false, renames, context)
    const lines = [`{% assign ${idName} = ${baseCode} %}`]
    nodes.forEach((node) => {
      const code = this.generateLiquidCode(node, false, renames, context)
      lines.push(`{% if ${idName} == nil %}`)
      lines.push(`  {% assign ${idName} = ${code} %}`)
      lines.push(`{% endif %}`)
    })
    return lines
  }
}
