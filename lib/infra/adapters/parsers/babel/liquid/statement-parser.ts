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
  isForOfStatement,
  isForInStatement,
  isSwitchStatement,
  isUpdateExpression,
  isObjectPattern,
  isArrayPattern,
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
  type ForOfStatement,
  type ForInStatement,
  type SwitchStatement,
  type UpdateExpression,
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
      .with(isForOfStatement(statement) || isForInStatement(statement), () =>
        this.renderForLoop(statement as ForOfStatement | ForInStatement, rest, renames, context),
      )
      .with(isSwitchStatement(statement), () => this.renderSwitch(statement as SwitchStatement, rest, renames, context))
      .with(isVariableDeclaration(statement), () => this.renderDeclarations(statement as VariableDeclaration, rest, renames, context))
      .with(this.isSimpleAssignment(statement), () => this.renderAssignment(statement, next, renames, context))
      .with(this.isUpdateAssignment(statement), () => this.renderUpdate(statement, next, renames, context))
      .with(this.isIgnorable(statement), () => next())
      .with(true, () => {
        throw new ValidationError(
          `Unsupported statement in Liquid component: ${statement.type}. Supported: return, if/else, for...of, switch, variable declarations, assignments (=, +=, -=, *=, /=, %=) and i++/i--.`,
          this.filePathOf(context),
          this.locationOf(statement),
        )
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

  private isUpdateAssignment(statement: Statement): boolean {
    return isExpressionStatement(statement) && isUpdateExpression((statement as ExpressionStatement).expression)
  }

  private renderUpdate(statement: Statement, next: () => string, renames?: Record<string, string>, context?: ParsingContext): string {
    const expression = (statement as ExpressionStatement).expression as UpdateExpression
    return _match(!isIdentifier(expression.argument))
      .with(true, () => {
        throw new ValidationError(
          `Unsupported Liquid update target: ${expression.argument.type}. Use i++ or i-- on a variable.`,
          this.filePathOf(context),
          this.locationOf(statement),
        )
      })
      .with(false, () => {
        const name = (expression.argument as Identifier).name
        const filter = expression.operator === '--' ? 'minus' : 'plus'
        const assigns = this.variables
          .parseVariableDeclaration(
            variableDeclarator(expression.argument as Identifier, { type: 'NumericLiteral', value: 0 } as unknown as Expression),
            renames,
            context,
          )
          .join('\n')
        void assigns
        void renames
        return `${this.pendingAssignsOf(context)}{% assign ${name} = ${name} | ${filter}: 1 %}\n${next()}`
      })
      .exec() as string
  }

  private renderAssignment(statement: Statement, next: () => string, renames?: Record<string, string>, context?: ParsingContext): string {
    const expression = (statement as ExpressionStatement).expression as AssignmentExpression
    _match(['=', '+=', '-=', '*=', '/=', '%='].includes(expression.operator))
      .with(true, () => undefined)
      .with(false, () => {
        throw new ValidationError(
          `Unsupported Liquid assignment operator: ${expression.operator}. Use =, +=, -=, *=, /= or %= (e.g. count += 1).`,
          this.filePathOf(context),
          this.locationOf(statement),
        )
      })
      .exec()
    const assigns = this.compoundAssignLines(expression, renames, context).join('\n')
    return `${this.pendingAssignsOf(context)}${assigns}\n${next()}`
  }

  private compoundAssignLines(expression: AssignmentExpression, renames?: Record<string, string>, context?: ParsingContext): string[] {
    const name = (expression.left as Identifier).name
    return _match(expression.operator)
      .with('=', () =>
        this.variables.parseVariableDeclaration(variableDeclarator(expression.left as Identifier, expression.right), renames, context),
      )
      .with('+=', () =>
        [`{% assign ${name} = ${name} | append: ${this.codeOf(expression.right, renames, context)} %}`].flatMap((line) =>
          this.preferNumericPlus(name, expression, line, renames, context),
        ),
      )
      .with('-=', () => [`{% assign ${name} = ${name} | minus: ${this.codeOf(expression.right, renames, context)} %}`])
      .with('*=', () => [`{% assign ${name} = ${name} | times: ${this.codeOf(expression.right, renames, context)} %}`])
      .with('/=', () => [`{% assign ${name} = ${name} | divided_by: ${this.codeOf(expression.right, renames, context)} %}`])
      .with('%=', () => [`{% assign ${name} = ${name} | modulo: ${this.codeOf(expression.right, renames, context)} %}`])
      .with(expression.operator, () => [] as string[])
      .exec() as string[]
  }

  private preferNumericPlus(
    name: string,
    expression: AssignmentExpression,
    appendLine: string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    const right = expression.right
    return _match(right.type === 'NumericLiteral')
      .with(true, () => [`{% assign ${name} = ${name} | plus: ${this.codeOf(right, renames, context)} %}`])
      .with(false, () => [appendLine])
      .exec() as string[]
  }

  private codeOf(node: Expression, renames?: Record<string, string>, context?: ParsingContext): string {
    return this.variables.generateLiquidCode(node, false, renames, context)
  }

  private renderForLoop(
    statement: ForOfStatement | ForInStatement,
    rest: Statement[],
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const left = (statement as ForOfStatement).left ?? (statement as ForInStatement).left
    const right = (statement as ForOfStatement).right ?? (statement as ForInStatement).right
    const loopVar = _match(isVariableDeclaration(left))
      .with(true, () => (left as VariableDeclaration).declarations[0])
      .with(false, () => undefined)
      .exec() as VariableDeclarator | undefined
    return _match(loopVar === undefined)
      .with(true, () => {
        throw new ValidationError(
          'Unsupported for loop: use `for (const item of items)`.',
          this.filePathOf(context),
          this.locationOf(statement),
        )
      })
      .with(false, () => this.forLoopMarkup(statement, loopVar as VariableDeclarator, right as Expression, rest, renames, context))
      .exec() as string
  }

  private forLoopMarkup(
    statement: ForOfStatement | ForInStatement,
    declarator: VariableDeclarator,
    right: Expression,
    rest: Statement[],
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const arrayCode = this.variables.generateLiquidCode(right, false, renames, context)
    const id = declarator.id
    return _match(true)
      .with(isIdentifier(id), () => this.identifierForLoop((id as Identifier).name, arrayCode, statement, rest, renames, context))
      .with(isObjectPattern(id) || isArrayPattern(id), () => this.patternForLoop(id, arrayCode, statement, rest, renames, context))
      .with(true, () => {
        throw new ValidationError(
          'Unsupported for loop variable: use an identifier or destructuring pattern.',
          this.filePathOf(context),
          this.locationOf(statement),
        )
      })
      .exec() as string
  }

  private identifierForLoop(
    itemName: string,
    arrayCode: string,
    statement: ForOfStatement | ForInStatement,
    rest: Statement[],
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const body = this.renderBody(this.loopBodyOf(statement), { ...renames, [itemName]: itemName }, context)
    return `{% for ${itemName} in ${arrayCode} %}\n${body}\n{% endfor %}\n${this.renderBody(rest, renames, context)}`
  }

  private patternForLoop(
    pattern: unknown,
    arrayCode: string,
    statement: ForOfStatement | ForInStatement,
    rest: Statement[],
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const itemName = '__liquidify_item'
    const destructure = this.variables
      .parseVariableDeclaration(
        variableDeclarator(pattern as Identifier, { type: 'Identifier', name: itemName } as unknown as Expression),
        renames,
        context,
      )
      .join('\n')
    const body = this.renderBody(this.loopBodyOf(statement), renames, context)
    return `{% for ${itemName} in ${arrayCode} %}\n${this.pendingAssignsOf(context)}${destructure}\n${body}\n{% endfor %}\n${this.renderBody(rest, renames, context)}`
  }

  private loopBodyOf(statement: ForOfStatement | ForInStatement): Statement[] {
    const body = (statement as { body: unknown }).body
    return _match(isBlockStatement(body as Node))
      .with(true, () => (body as BlockStatement).body)
      .with(false, () => [body as Statement])
      .exec() as Statement[]
  }

  private renderSwitch(statement: SwitchStatement, rest: Statement[], renames?: Record<string, string>, context?: ParsingContext): string {
    const discriminant = this.variables.generateLiquidCode(statement.discriminant, false, renames, context)
    const cases = statement.cases
      .map((clause) => this.switchClause(clause, renames, context))
      .filter(Boolean)
      .join('\n')
    return `{% case ${discriminant} %}\n${cases}\n{% endcase %}\n${this.renderBody(rest, renames, context)}`
  }

  private switchClause(clause: SwitchStatement['cases'][number], renames?: Record<string, string>, context?: ParsingContext): string {
    const body = this.renderBody(
      (clause.consequent ?? []).filter((stmt) => stmt.type !== 'BreakStatement'),
      renames,
      context,
    )
    return _match(clause.test === null || clause.test === undefined)
      .with(true, () => `{% else %}\n${body}`)
      .with(false, () => `{% when ${this.variables.generateLiquidCode(clause.test as Expression, false, renames, context)} %}\n${body}`)
      .exec() as string
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

  private locationOf(node: unknown): { line: number; column: number } | undefined {
    const loc = (node as { loc?: { start: { line: number; column: number } } }).loc
    return _match(loc === undefined)
      .with(true, () => undefined)
      .with(false, () => ({
        line: (loc as { start: { line: number } }).start.line,
        column: (loc as { start: { column: number } }).start.column + 1,
      }))
      .exec() as { line: number; column: number } | undefined
  }
}
