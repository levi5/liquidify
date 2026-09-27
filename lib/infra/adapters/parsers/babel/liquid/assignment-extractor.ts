import {
  isBlockStatement,
  isExpressionStatement,
  isReturnStatement,
  isIfStatement,
  isAssignmentExpression,
  isIdentifier,
  isCallExpression,
  isMemberExpression,
  type BlockStatement,
  type ExpressionStatement,
  type AssignmentExpression,
  type Identifier,
  type Node,
} from '@babel/types'
import { _match } from 'funcio'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

export class AssignmentExtractor {
  public parseExpression?: (node: unknown, renames?: Record<string, string>, context?: ParsingContext) => string

  constructor(
    private readonly generateLiquidCode: (
      node: unknown,
      inCondition?: boolean,
      renames?: Record<string, string>,
      context?: ParsingContext,
    ) => string,
    parseExpression?: (node: unknown, renames?: Record<string, string>, context?: ParsingContext) => string,
  ) {
    this.parseExpression = parseExpression
  }

  public extract(
    node: unknown,
    onReturn?: (node: unknown, context?: ParsingContext) => string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    return _match(true)
      .with(isBlockStatement(node as Node), () =>
        ((node as BlockStatement).body ?? []).flatMap((stmt) => this.extractSingle(stmt, onReturn, renames, context)),
      )
      .with(isExpressionStatement(node as Node) || isReturnStatement(node as Node), () =>
        this.extractSingle(node, onReturn, renames, context),
      )
      .with(true, () => [] as string[])
      .exec() as string[]
  }

  private isMapCall(expr: unknown): boolean {
    const node = expr as { callee?: unknown }
    return (
      isCallExpression(expr as Node) &&
      isMemberExpression(node.callee as Node) &&
      isIdentifier((node.callee as { property?: unknown }).property as Node) &&
      ((node.callee as { property: { name: string } }).property as { name: string }).name === 'map'
    )
  }

  private extractSingle(
    stmt: unknown,
    onReturn?: (node: unknown, context?: ParsingContext) => string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    return _match(true)
      .with(this.isSimpleAssign(stmt), () => [this.assignLine(stmt as ExpressionStatement, renames, context)])
      .with(isExpressionStatement(stmt as Node) && this.isMapCall((stmt as ExpressionStatement).expression), () =>
        this.mapLine(stmt as ExpressionStatement, renames, context),
      )
      .with(isReturnStatement(stmt as Node) && onReturn !== undefined, () => [
        (onReturn as (node: unknown, context?: ParsingContext) => string)((stmt as { argument: unknown }).argument, context),
      ])
      .with(isIfStatement(stmt as Node), () => this.parseIfStatement(stmt, onReturn, renames, context))
      .with(true, () => [] as string[])
      .exec() as string[]
  }

  private isSimpleAssign(stmt: unknown): boolean {
    return (
      isExpressionStatement(stmt as Node) &&
      isAssignmentExpression((stmt as ExpressionStatement).expression) &&
      isIdentifier(((stmt as ExpressionStatement).expression as AssignmentExpression).left)
    )
  }

  private assignLine(stmt: ExpressionStatement, renames?: Record<string, string>, context?: ParsingContext): string {
    const assignment = stmt.expression as AssignmentExpression
    return this.assignText(
      (assignment.left as Identifier).name,
      this.generateLiquidCode(assignment.right, false, renames, context),
      assignment.operator,
    )
  }

  private mapLine(stmt: ExpressionStatement, renames?: Record<string, string>, context?: ParsingContext): string[] {
    return _match(this.parseExpression === undefined)
      .with(true, () => [] as string[])
      .with(false, () => [
        (this.parseExpression as (node: unknown, renames?: Record<string, string>, context?: ParsingContext) => string)(
          stmt.expression,
          renames,
          context,
        ),
      ])
      .exec() as string[]
  }

  public parseIfStatement(
    statement: unknown,
    onReturn?: (node: unknown, context?: ParsingContext) => string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    return [...this.branchLines(statement, false, onReturn, renames, context), '{% endif %}']
  }

  private branchLines(
    stmt: unknown,
    isElsif: boolean,
    onReturn?: (node: unknown, context?: ParsingContext) => string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    const keyword = _match(isElsif)
      .with(true, () => 'elsif')
      .with(false, () => 'if')
      .exec() as string
    const branch = stmt as { test: unknown; consequent: unknown; alternate?: unknown }
    return [
      `{% ${keyword} ${this.generateLiquidCode(branch.test, true, renames, context)} %}`,
      ...this.extract(branch.consequent, onReturn, renames, context).map((line) => `  ${line}`),
      ...this.alternateLines(branch.alternate, onReturn, renames, context),
    ]
  }

  private alternateLines(
    alternate: unknown,
    onReturn?: (node: unknown, context?: ParsingContext) => string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    return _match(alternate === null || alternate === undefined)
      .with(true, () => [] as string[])
      .with(false, () => this.alternateBranch(alternate, onReturn, renames, context))
      .exec() as string[]
  }

  private alternateBranch(
    alternate: unknown,
    onReturn?: (node: unknown, context?: ParsingContext) => string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    return _match(isIfStatement(alternate as Node))
      .with(true, () => this.branchLines(alternate, true, onReturn, renames, context))
      .with(false, () => ['{% else %}', ...this.extract(alternate, onReturn, renames, context).map((line) => `  ${line}`)])
      .exec() as string[]
  }

  private assignText(name: string, code: string, operator: string): string {
    return _match(operator)
      .with('+=', () => `{% assign ${name} = ${name} | append: ${code} %}`)
      .with('-=', () => `{% assign ${name} = ${name} | minus: ${code} %}`)
      .with('*=', () => `{% assign ${name} = ${name} | times: ${code} %}`)
      .with('/=', () => `{% assign ${name} = ${name} | divided_by: ${code} %}`)
      .with('%=', () => `{% assign ${name} = ${name} | modulo: ${code} %}`)
      .with(operator, () => `{% assign ${name} = ${code} %}`)
      .exec() as string
  }
}
