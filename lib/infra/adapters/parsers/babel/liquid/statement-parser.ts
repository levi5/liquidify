import {
  isBlockStatement,
  isReturnStatement,
  isIfStatement,
  isVariableDeclaration,
  isIdentifier,
  isExpressionStatement,
  isAssignmentExpression,
  isEmptyStatement,
  isDirective,
  isStringLiteral,
  variableDeclarator,
  type Statement,
  type ReturnStatement,
  type BlockStatement,
  type IfStatement,
  type VariableDeclaration,
  type VariableDeclarator,
  type ExpressionStatement,
  type AssignmentExpression,
  type Identifier,
  type Expression,
  type Node,
} from '@babel/types'
import { _match } from 'funcio'
import { ValidationError } from '../../../../../core/errors/validation-error'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'
import type { LiquidVariableParser } from './variable-parser'
import { renderCondition } from './condition'

export class LiquidStatementParser {
  constructor(
    private readonly variables: LiquidVariableParser,
    private readonly render: (node: unknown, renames?: Record<string, string>, context?: ParsingContext) => string,
  ) {}

  public renderBody(statements: Statement[], renames?: Record<string, string>, context?: ParsingContext): string {
    const [statement, ...rest] = statements
    return _match(statement === undefined)
      .with(true, () => '')
      .with(false, () => this.renderStatement(statement as Statement, rest, renames, context))
      .exec() as string
  }

  private renderStatement(statement: Statement, rest: Statement[], renames?: Record<string, string>, context?: ParsingContext): string {
    const next = () => this.renderBody(rest, renames, context)
    return _match(true)
      .with(isReturnStatement(statement), () => this.renderReturn(statement as ReturnStatement, renames, context))
      .with(isBlockStatement(statement), () => this.renderBody([...(statement as BlockStatement).body, ...rest], renames, context))
      .with(isIfStatement(statement), () => this.renderBranch(statement as IfStatement, rest, renames, context))
      .with(isVariableDeclaration(statement), () => this.renderDeclarations(statement as VariableDeclaration, rest, renames, context))
      .with(this.isSimpleAssignment(statement), () => this.renderAssignment(statement, next, renames, context))
      .with(this.isIgnorable(statement), () => next())
      .with(true, () => {
        throw new ValidationError(`Unsupported statement in Liquid component: ${statement.type}`, this.filePathOf(context))
      })
      .exec() as string
  }

  private renderReturn(statement: ReturnStatement, renames?: Record<string, string>, context?: ParsingContext): string {
    return _match(statement.argument === null || statement.argument === undefined)
      .with(true, () => '')
      .with(false, () => this.render(statement.argument as Expression, renames, context))
      .exec() as string
  }

  private renderBranch(statement: IfStatement, rest: Statement[], renames?: Record<string, string>, context?: ParsingContext): string {
    const yes = this.renderBody(this.branchBody(statement.consequent, rest), renames, context)
    const no = this.renderBody(this.branchBody(statement.alternate, rest), renames, context)
    const markup = renderCondition(statement.test, yes, no, (node: Node) => this.variables.generateLiquidCode(node, true, renames, context))
    return `${this.pendingAssignsOf(context)}${markup}`
  }

  private branchBody(node: Statement | null | undefined, rest: Statement[]): Statement[] {
    return _match(node === null || node === undefined)
      .with(true, () => rest)
      .with(false, () => [...this.branchBlock(node as Statement), ...rest])
      .exec() as Statement[]
  }

  private branchBlock(node: Statement): Statement[] {
    return _match(isBlockStatement(node))
      .with(true, () => (node as BlockStatement).body)
      .with(false, () => [node])
      .exec() as Statement[]
  }

  private renderDeclarations(
    statement: VariableDeclaration,
    rest: Statement[],
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const assigns = statement.declarations.flatMap((declaration) => this.declarationLines(declaration, renames, context)).join('\n')
    return `${assigns}\n${this.renderBody(rest, renames, context)}`
  }

  private declarationLines(declaration: VariableDeclarator, renames?: Record<string, string>, context?: ParsingContext): string[] {
    return _match(isIdentifier(declaration.id) && this.isInlineComponent((declaration.id as Identifier).name, context))
      .with(true, () => [] as string[])
      .with(false, () => this.assignmentLines(declaration, renames, context))
      .exec() as string[]
  }

  private isInlineComponent(name: string, context?: ParsingContext): boolean {
    return _match(context === undefined)
      .with(true, () => false)
      .with(false, () => (context as ParsingContext).inlineComponents?.has(name) === true)
      .exec() as boolean
  }

  private assignmentLines(declaration: VariableDeclarator, renames?: Record<string, string>, context?: ParsingContext): string[] {
    const lines = this.variables.parseVariableDeclaration(declaration, renames, context)
    return [this.pendingAssignsOf(context), ...lines]
  }

  private isSimpleAssignment(statement: Statement): boolean {
    return (
      isExpressionStatement(statement) &&
      isAssignmentExpression((statement as ExpressionStatement).expression) &&
      isIdentifier(((statement as ExpressionStatement).expression as AssignmentExpression).left)
    )
  }

  private renderAssignment(statement: Statement, next: () => string, renames?: Record<string, string>, context?: ParsingContext): string {
    const expression = (statement as ExpressionStatement).expression as AssignmentExpression
    _match(expression.operator !== '=')
      .with(true, () => {
        throw new ValidationError(`Unsupported Liquid assignment operator: ${expression.operator}`, this.filePathOf(context))
      })
      .with(false, () => undefined)
      .exec()
    const assigns = this.variables
      .parseVariableDeclaration(variableDeclarator(expression.left as Identifier, expression.right), renames, context)
      .join('\n')
    return `${this.pendingAssignsOf(context)}${assigns}\n${next()}`
  }

  private isIgnorable(statement: Statement): boolean {
    return _match(true)
      .with(isEmptyStatement(statement) || isDirective(statement), () => true)
      .with(isExpressionStatement(statement), () => isStringLiteral((statement as ExpressionStatement).expression))
      .with(true, () => false)
      .exec() as boolean
  }

  private pendingAssignsOf(context?: ParsingContext): string {
    return _match(context === undefined)
      .with(true, () => '')
      .with(false, () => (context as ParsingContext).getPendingAssigns())
      .exec() as string
  }

  private filePathOf(context?: ParsingContext): string | undefined {
    return _match(context === undefined)
      .with(true, () => undefined)
      .with(false, () => (context as ParsingContext).currentFilePath)
      .exec() as string | undefined
  }
}
