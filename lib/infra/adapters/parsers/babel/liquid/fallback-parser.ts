import { isLogicalExpression, type LogicalExpression, type Node } from '@babel/types'
import { _match } from 'funcio'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

export class FallbackParser {
  constructor(
    private readonly generateLiquidCode: (
      node: unknown,
      inCondition?: boolean,
      renames?: Record<string, string>,
      context?: ParsingContext,
    ) => string,
  ) {}

  private collectOrParts(expr: unknown): unknown[] {
    return _match(isLogicalExpression(expr as Node) && this.isFallbackOperator(expr as LogicalExpression))
      .with(true, () => [...this.collectOrParts((expr as LogicalExpression).left), (expr as LogicalExpression).right])
      .with(false, () => [expr])
      .exec() as unknown[]
  }

  private isFallbackOperator(expr: LogicalExpression): boolean {
    return expr.operator === '||' || expr.operator === '??'
  }

  public parseOrFallback(idName: string, init: unknown, renames?: Record<string, string>, context?: ParsingContext): string[] {
    const [baseNode, ...rest] = this.collectOrParts(init)
    const baseCode = this.generateLiquidCode(baseNode, false, renames, context)
    return [`{% assign ${idName} = ${baseCode} %}`, ...rest.flatMap((node) => this.orGuard(idName, node, renames, context))]
  }

  private orGuard(idName: string, node: unknown, renames?: Record<string, string>, context?: ParsingContext): string[] {
    const code = this.generateLiquidCode(node as Node, false, renames, context)
    const guard = `{% if ${idName} == nil or ${idName} == "" or ${idName} == false or ${idName} == 0 %}`
    return [guard, `  {% assign ${idName} = ${code} %}`, '{% endif %}']
  }

  public parseNilFallback(idName: string, init: unknown, renames?: Record<string, string>, context?: ParsingContext): string[] {
    const [baseNode, ...rest] = this.collectOrParts(init)
    const baseCode = this.generateLiquidCode(baseNode, false, renames, context)
    return [`{% assign ${idName} = ${baseCode} %}`, ...rest.flatMap((node) => this.nilGuard(idName, node, renames, context))]
  }

  private nilGuard(idName: string, node: unknown, renames?: Record<string, string>, context?: ParsingContext): string[] {
    const code = this.generateLiquidCode(node, false, renames, context)
    return [`{% if ${idName} == nil %}`, `  {% assign ${idName} = ${code} %}`, '{% endif %}']
  }
}
