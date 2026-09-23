import { isConditionalExpression } from '@babel/types'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

export class ConditionalDeclarationParser {
  constructor(
    private readonly generateLiquidCode: (
      node: any,
      inCondition?: boolean,
      renames?: Record<string, string>,
      context?: ParsingContext,
    ) => string,
  ) {}

  public parseConditionalExpressionRecursive(
    idName: string,
    expr: any,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    const lines: string[] = [
      `{% if ${this.generateLiquidCode(expr.test, true, renames, context)} %}`,
      `  {% assign ${idName} = ${this.generateLiquidCode(expr.consequent, false, renames, context)} %}`,
    ]
    let alternate = expr.alternate
    while (isConditionalExpression(alternate)) {
      lines.push(`{% elsif ${this.generateLiquidCode(alternate.test, true, renames, context)} %}`)
      lines.push(`  {% assign ${idName} = ${this.generateLiquidCode(alternate.consequent, false, renames, context)} %}`)
      alternate = alternate.alternate
    }
    if (alternate) {
      lines.push(`{% else %}`)
      lines.push(`  {% assign ${idName} = ${this.generateLiquidCode(alternate, false, renames, context)} %}`)
    }
    lines.push(`{% endif %}`)
    return lines
  }
}
