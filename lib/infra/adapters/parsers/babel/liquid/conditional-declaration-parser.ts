import { _match } from 'funcio'
import type { ConditionalExpression, Expression } from '@babel/types'
import { isConditionalExpression } from '@babel/types'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

type GenerateCode = (node: unknown, inCondition?: boolean, renames?: Record<string, string>, context?: ParsingContext) => string

export class ConditionalDeclarationParser {
  constructor(private readonly generateLiquidCode: GenerateCode) {}

  public parseConditionalExpressionRecursive(
    idName: string,
    expr: ConditionalExpression,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    return [
      `{% if ${this.generateLiquidCode(expr.test, true, renames, context)} %}`,
      `  {% assign ${idName} = ${this.generateLiquidCode(expr.consequent, false, renames, context)} %}`,
      ...this.elsifLines(idName, expr.alternate, renames, context),
      `{% endif %}`,
    ]
  }

  private elsifLines(idName: string, alternate: Expression, renames?: Record<string, string>, context?: ParsingContext): string[] {
    return _match(isConditionalExpression(alternate))
      .with(true, () => this.elsifBranch(idName, alternate as ConditionalExpression, renames, context))
      .with(false, () => this.elseBranch(idName, alternate, renames, context))
      .exec() as string[]
  }

  private elsifBranch(
    idName: string,
    alternate: ConditionalExpression,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    return [
      `{% elsif ${this.generateLiquidCode(alternate.test, true, renames, context)} %}`,
      `  {% assign ${idName} = ${this.generateLiquidCode(alternate.consequent, false, renames, context)} %}`,
      ...this.elsifLines(idName, alternate.alternate, renames, context),
    ]
  }

  private elseBranch(idName: string, alternate: Expression, renames?: Record<string, string>, context?: ParsingContext): string[] {
    return _match(alternate === null || alternate === undefined)
      .with(true, () => [] as string[])
      .with(false, () => [`{% else %}`, `  {% assign ${idName} = ${this.generateLiquidCode(alternate, false, renames, context)} %}`])
      .exec() as string[]
  }
}
