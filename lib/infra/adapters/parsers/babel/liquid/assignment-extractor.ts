import {
  isBlockStatement,
  isExpressionStatement,
  isReturnStatement,
  isIfStatement,
  isAssignmentExpression,
  isIdentifier,
  isCallExpression,
  isMemberExpression,
} from '@babel/types'
import { _Maybe, _match } from 'funcio'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

export class AssignmentExtractor {
  public parseExpression?: (node: any, renames?: Record<string, string>, context?: ParsingContext) => string

  constructor(
    private readonly generateLiquidCode: (
      node: any,
      inCondition?: boolean,
      renames?: Record<string, string>,
      context?: ParsingContext,
    ) => string,
    parseExpression?: (node: any, renames?: Record<string, string>, context?: ParsingContext) => string,
  ) {
    this.parseExpression = parseExpression
  }

  public extract(
    node: any,
    onReturn?: (node: any, context?: ParsingContext) => string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    return _match(true)
      .with(isBlockStatement(node), () => (node.body || []).flatMap((stmt: any) => this.extractSingle(stmt, onReturn, renames, context)))
      .with(isExpressionStatement(node) || isReturnStatement(node), () => this.extractSingle(node, onReturn, renames, context))
      .with(true, () => [])
      .exec() as string[]
  }

  private isMapCall(expr: any): boolean {
    return (
      isCallExpression(expr) && isMemberExpression(expr.callee) && isIdentifier(expr.callee.property) && expr.callee.property.name === 'map'
    )
  }

  private extractSingle(
    stmt: any,
    onReturn?: (node: any, context?: ParsingContext) => string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    return _match(true)
      .with(isExpressionStatement(stmt) && isAssignmentExpression(stmt.expression) && isIdentifier(stmt.expression.left), () => [
        this.assignLine(
          stmt.expression.left.name,
          this.generateLiquidCode(stmt.expression.right, false, renames, context),
          stmt.expression.operator,
        ),
      ])
      .with(isExpressionStatement(stmt) && this.isMapCall(stmt.expression), () =>
        _Maybe
          .of(this.parseExpression)
          .map((parse: any) => [(parse as any)(stmt.expression, renames, context)])
          .getOrElse([]),
      )
      .with(isReturnStatement(stmt) && Boolean(onReturn), () => [(onReturn as any)((stmt as any).argument, context)])
      .with(isIfStatement(stmt), () => this.parseIfStatement(stmt, onReturn, renames, context))
      .with(true, () => [])
      .exec() as string[]
  }

  public parseIfStatement(
    statement: any,
    onReturn?: (node: any, context?: ParsingContext) => string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    const lines: string[] = []
    const parseBranch = (stmt: any, isElsif = false): void => {
      const keyword = isElsif ? 'elsif' : 'if'
      lines.push(`{% ${keyword} ${this.generateLiquidCode(stmt.test, true, renames, context)} %}`)
      lines.push(...this.extract(stmt.consequent, onReturn, renames, context).map((s) => `  ${s}`))
      if (stmt.alternate) {
        if (isIfStatement(stmt.alternate)) {
          parseBranch(stmt.alternate, true)
        } else {
          lines.push(`{% else %}`)
          lines.push(...this.extract(stmt.alternate, onReturn, renames, context).map((s) => `  ${s}`))
        }
      }
    }
    parseBranch(statement)
    lines.push(`{% endif %}`)
    return lines
  }

  private assignLine(name: string, code: string, operator: string): string {
    return operator === '+=' ? `{% assign ${name} = ${name} | append: ${code} %}` : `{% assign ${name} = ${code} %}`
  }
}
