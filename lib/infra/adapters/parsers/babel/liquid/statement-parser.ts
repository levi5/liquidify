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
  isForStatement,
  isWhileStatement,
  isTryStatement,
  isThrowStatement,
  isSwitchStatement,
  isUpdateExpression,
  isObjectPattern,
  isArrayPattern,
  isBinaryExpression,
  isNumericLiteral,
  isUnaryExpression,
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
  type ForStatement,
  type WhileStatement,
  type TryStatement,
  type ThrowStatement,
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
      .with(false, () => this.renderStatementGuarded(statement as Statement, rest, renames, context))
      .exec() as string
  }

  private renderStatementGuarded(statement: Statement, rest: Statement[], renames?: Record<string, string>, context?: ParsingContext): string {
    const collector = context?.errorCollector
    if (collector === undefined) return this.renderStatement(statement, rest, renames, context)
    try {
      return this.renderStatement(statement, rest, renames, context)
    } catch (error) {
      collector.add(error, context?.currentFilePath)
      return this.renderBody(rest, renames, context)
    }
  }

  private renderStatement(statement: Statement, rest: Statement[], renames?: Record<string, string>, context?: ParsingContext): string {
    const next = () => this.renderBody(rest, renames, context)
    return _match(true)
      .with(isReturnStatement(statement), () => this.renderReturn(statement as ReturnStatement, renames, context))
      .with(isBlockStatement(statement), () => this.renderBody([...(statement as BlockStatement).body, ...rest], renames, context))
      .with(isIfStatement(statement), () => this.renderBranch(statement as IfStatement, rest, renames, context))
      .with(isForOfStatement(statement), () => this.renderForLoop(statement as ForOfStatement, rest, renames, context))
      .with(isForInStatement(statement), () => this.renderForIn(statement as ForInStatement, rest, renames, context))
      .with(isForStatement(statement), () => this.renderFor(statement as ForStatement, rest, renames, context))
      .with(isWhileStatement(statement), () => this.renderWhile(statement as WhileStatement, rest, renames, context))
      .with(isTryStatement(statement), () => this.renderTry(statement as TryStatement, rest, renames, context))
      .with(isThrowStatement(statement), () => this.renderThrow(statement as ThrowStatement, rest, renames, context))
      .with(isSwitchStatement(statement), () => this.renderSwitch(statement as SwitchStatement, rest, renames, context))
      .with(isVariableDeclaration(statement), () => this.renderDeclarations(statement as VariableDeclaration, rest, renames, context))
      .with(this.isSimpleAssignment(statement), () => this.renderAssignment(statement, next, renames, context))
      .with(this.isUpdateAssignment(statement), () => this.renderUpdate(statement, next, renames, context))
      .with(this.isIgnorable(statement), () => next())
      .with(true, () => {
        throw new ValidationError(
          `Unsupported statement in Liquid component: ${statement.type}. Supported: return, if/else, try/catch/finally, while (counter loops), for (counter loops), for...of, for...in, switch, throw (rendered as comment), variable declarations, assignments (=, +=, -=, *=, /=, %=) and i++/i--.`,
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
    const yes = this.renderBody(this.branchBlock(statement.consequent), renames, context)
    const no = statement.alternate ? this.renderBody(this.branchBlock(statement.alternate as Statement), renames, context) : ''
    const tail = rest.length > 0 ? this.renderBody(rest, renames, context) : ''
    const markup = renderCondition(statement.test, yes, no, (node: Node) => this.variables.generateLiquidCode(node, true, renames, context))
    return `${this.pendingAssignsOf(context)}${markup}${tail}`
  }

  private branchBlock(node: Statement): Statement[] {
    if (isBlockStatement(node)) return (node as BlockStatement).body
    return [node]
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

  private renderUpdate(statement: Statement, next: () => string, _renames?: Record<string, string>, context?: ParsingContext): string {
    const expression = (statement as ExpressionStatement).expression as UpdateExpression
    if (!isIdentifier(expression.argument)) {
      throw new ValidationError(
        `Unsupported Liquid update target: ${expression.argument.type}. Use i++ or i-- on a variable.`,
        this.filePathOf(context),
        this.locationOf(statement),
      )
    }
    const name = (expression.argument as Identifier).name
    const filter = expression.operator === '--' ? 'minus' : 'plus'
    return `${this.pendingAssignsOf(context)}{% assign ${name} = ${name} | ${filter}: 1 %}\n${next()}`
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
    const isNumeric =
      right.type === 'NumericLiteral' ||
      (right.type === 'UnaryExpression' &&
        ['+', '-'].includes((right as { operator: string }).operator) &&
        (right as { argument: { type?: string } }).argument?.type === 'NumericLiteral') ||
      (right.type === 'Identifier' && /^(count|total|index|quantity|price|amount|size|length)$/i.test((right as Identifier).name))
    if (isNumeric) return [`{% assign ${name} = ${name} | plus: ${this.codeOf(right, renames, context)} %}`]
    return [appendLine]
  }

  private codeOf(node: Expression, renames?: Record<string, string>, context?: ParsingContext): string {
    return this.variables.generateLiquidCode(node, false, renames, context)
  }

  private renderForLoop(statement: ForOfStatement, rest: Statement[], renames?: Record<string, string>, context?: ParsingContext): string {
    const left = statement.left
    const right = (statement as ForOfStatement).right
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
    const itemName = context?.allocateName('item') ?? '__liquidify_item'
    const destructure = this.variables
      .parseVariableDeclaration(
        variableDeclarator(
          pattern as unknown as import('@babel/types').LVal,
          { type: 'Identifier', name: itemName } as unknown as Expression,
        ),
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

  private renderForIn(statement: ForInStatement, rest: Statement[], renames?: Record<string, string>, context?: ParsingContext): string {
    const left = statement.left
    const target = _match(isVariableDeclaration(left))
      .with(true, () => (left as VariableDeclaration).declarations[0]?.id)
      .with(false, () => (isIdentifier(left) ? left : undefined))
      .exec() as Identifier | undefined
    if (target === undefined) {
      throw new ValidationError(
        'Unsupported for...in loop variable: use `for (const key in obj)`.',
        this.filePathOf(context),
        this.locationOf(statement),
      )
    }
    const objectCode = this.variables.generateLiquidCode(statement.right, false, renames, context)
    const pairName = context?.allocateName('key') ?? '__liquidify_key'
    const body = this.renderBody(this.loopBodyOf(statement), { ...renames, [target.name]: target.name }, context)
    return `${this.pendingAssignsOf(context)}{% comment %} for...in: Liquid iterates objects as [key, value] pairs {% endcomment %}\n{% for ${pairName} in ${objectCode} %}\n{% assign ${target.name} = ${pairName}[0] %}\n${body}\n{% endfor %}\n${this.renderBody(rest, renames, context)}`
  }

  private renderTry(statement: TryStatement, rest: Statement[], renames?: Record<string, string>, context?: ParsingContext): string {
    const guard = context?.allocateName('try') ?? '__liquidify_try'
    const tryBody = this.renderBody(this.blockStatements(statement.block), renames, context)
    const parts: string[] = [
      `{% comment %} try/catch: Liquid has no exceptions — assign ${guard} inside the try block; the catch block runs only when ${guard} == nil {% endcomment %}`,
      `{% assign ${guard} = nil %}`,
      tryBody,
    ]
    if (statement.handler) {
      const catchBody = this.renderBody(this.blockStatements(statement.handler.body), renames, context)
      const binding = isIdentifier(statement.handler.param)
        ? `\n{% assign ${(statement.handler.param as Identifier).name} = nil %}`
        : ''
      parts.push(`{% if ${guard} == nil %}${binding}\n${catchBody}\n{% endif %}`)
    }
    if (statement.finalizer) {
      parts.push(`{% comment %} finally block (always runs) {% endcomment %}`)
      parts.push(this.renderBody(this.blockStatements(statement.finalizer), renames, context))
    }
    return `${this.pendingAssignsOf(context)}${parts.join('\n')}\n${this.renderBody(rest, renames, context)}`
  }

  private renderWhile(statement: WhileStatement, rest: Statement[], renames?: Record<string, string>, context?: ParsingContext): string {
    const parsed = this.parseCountingTest(statement.test, renames, context)
    if (parsed === undefined) {
      throw new ValidationError(
        'Unsupported while loop: only counter comparisons are supported (e.g. `let i = 0; while (i < n) { ...; i++ }`). Use `for...of` over a precomputed array instead.',
        this.filePathOf(context),
        this.locationOf(statement),
      )
    }
    const step = this.findCounterStep(this.blockStatements(statement.body), parsed.name)
    if (step === undefined) {
      throw new ValidationError(
        `Unsupported while loop: no \`${parsed.name}++\` or \`${parsed.name} += 1\` update found — infinite loops cannot be compiled to Liquid.`,
        this.filePathOf(context),
        this.locationOf(statement),
      )
    }
    this.assertAscendingStep(step, statement, context)
    return this.countingLoopMarkup('while', parsed.name, '0', parsed.limit, statement.body, rest, renames, context)
  }

  private renderFor(statement: ForStatement, rest: Statement[], renames?: Record<string, string>, context?: ParsingContext): string {
    const parsed = this.parseCountingTest(statement.test, renames, context)
    if (parsed === undefined) {
      throw new ValidationError(
        'Unsupported for loop: test must compare a counter against a limit (e.g. `for (let i = 0; i < n; i++)`). Use `for...of` over an array instead.',
        this.filePathOf(context),
        this.locationOf(statement),
      )
    }
    const init = statement.init
    const start = _match(true)
      .with(
        isVariableDeclaration(init) &&
          (init as VariableDeclaration).declarations.length === 1 &&
          isIdentifier((init as VariableDeclaration).declarations[0].id),
        () => {
          const declarator = (init as VariableDeclaration).declarations[0]
          return {
            name: (declarator.id as Identifier).name,
            start: declarator.init ? this.codeOf(declarator.init as Expression, renames, context) : '0',
          }
        },
      )
      .with(isAssignmentExpression(init) && isIdentifier((init as AssignmentExpression).left), () => ({
        name: ((init as AssignmentExpression).left as Identifier).name,
        start: this.codeOf((init as AssignmentExpression).right as Expression, renames, context),
      }))
      .with(init === null || init === undefined, () => ({ name: parsed.name, start: '0' }))
      .with(true, () => undefined)
      .exec() as { name: string; start: string } | undefined
    if (start === undefined) {
      throw new ValidationError(
        'Unsupported for loop: init must declare or assign a single counter (e.g. `for (let i = 0; i < n; i++)`). Use `for...of` over an array instead.',
        this.filePathOf(context),
        this.locationOf(statement),
      )
    }
    if (start.name !== parsed.name) {
      throw new ValidationError(
        'Unsupported for loop: init and test must use the same counter variable.',
        this.filePathOf(context),
        this.locationOf(statement),
      )
    }
    const step = statement.update ? this.stepOf(statement.update, parsed.name) : undefined
    const resolved = step !== undefined ? step : this.findCounterStep(this.blockStatements(statement.body), parsed.name)
    if (resolved === undefined) {
      throw new ValidationError(
        `Unsupported for loop: no \`${parsed.name}++\` or \`${parsed.name} += 1\` update found — infinite loops cannot be compiled to Liquid.`,
        this.filePathOf(context),
        this.locationOf(statement),
      )
    }
    this.assertAscendingStep(resolved, statement, context)
    return this.countingLoopMarkup('for', parsed.name, start.start, parsed.limit, statement.body, rest, renames, context)
  }

  private renderThrow(statement: ThrowStatement, rest: Statement[], renames?: Record<string, string>, context?: ParsingContext): string {
    const message = statement.argument ? this.codeOf(statement.argument as Expression, renames, context) : 'error'
    return `${this.pendingAssignsOf(context)}{% comment %} throw ${message} — Liquid cannot throw errors; rendering continues after this point. Replace with a guard, e.g. {% if value == nil %}...{% endif %}. {% endcomment %}\n${this.renderBody(rest, renames, context)}`
  }

  private countingLoopMarkup(
    kind: string,
    name: string,
    start: string,
    limit: Expression,
    body: Statement,
    rest: Statement[],
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const limitCode = this.variables.generateLiquidCode(limit, false, renames, context)
    const bodyCode = this.renderBody(this.blockStatements(body), renames, context)
    return `{% comment %} ${kind} loop → {% for ${name} in (${start}..${limitCode}) %} (Liquid ranges are inclusive) {% endcomment %}\n{% for ${name} in (${start}..${limitCode}) %}\n${bodyCode}\n{% endfor %}\n${this.renderBody(rest, renames, context)}`
  }

  private parseCountingTest(
    test: Expression | null | undefined,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): { name: string; limit: Expression } | undefined {
    if (test === null || test === undefined || !isBinaryExpression(test)) return undefined
    if (test.operator !== '<' && test.operator !== '<=' && test.operator !== '>' && test.operator !== '>=') return undefined
    const left = test.left as Expression
    const right = test.right as Expression
    const counter = isIdentifier(left) ? left : isIdentifier(right) ? right : undefined
    if (counter === undefined) return undefined
    const limit = isIdentifier(left) ? right : left
    const limitCode = this.variables.generateLiquidCode(limit, false, renames, context)
    if (new RegExp(`\\b${(counter as Identifier).name}\\b`).test(limitCode)) return undefined
    return { name: (counter as Identifier).name, limit }
  }

  private assertAscendingStep(step: number, statement: Statement, context?: ParsingContext): void {
    if (step === 1) return
    throw new ValidationError(
      step < 0
        ? 'Unsupported loop: counting down cannot be expressed with a Liquid range. Iterate a reversed array with `for...of` instead.'
        : 'Unsupported loop: only a step of 1 is supported (`i++` or `i += 1`) — Liquid ranges step by 1.',
      this.filePathOf(context),
      this.locationOf(statement),
    )
  }

  private stepOf(expression: Expression, name: string): number | undefined {
    if (isUpdateExpression(expression) && isIdentifier(expression.argument) && (expression.argument as Identifier).name === name) {
      return expression.operator === '++' ? 1 : -1
    }
    if (isAssignmentExpression(expression) && isIdentifier(expression.left) && (expression.left as Identifier).name === name) {
      if (expression.operator === '+=') return this.numericValue(expression.right as Expression)
      if (expression.operator === '-=') {
        const value = this.numericValue(expression.right as Expression)
        return value === undefined ? undefined : -value
      }
      if (expression.operator === '=') {
        const right = expression.right as Expression
        if (isBinaryExpression(right) && right.operator === '+') {
          if (isIdentifier(right.left) && (right.left as Identifier).name === name) {
            return this.numericValue(right.right as Expression)
          }
          if (isIdentifier(right.right) && (right.right as Identifier).name === name) {
            return this.numericValue(right.left as Expression)
          }
        }
      }
    }
    return undefined
  }

  private numericValue(node: Expression): number | undefined {
    if (isNumericLiteral(node)) return node.value
    if (isUnaryExpression(node) && node.operator === '-' && isNumericLiteral(node.argument)) {
      return -(node.argument as unknown as { value: number }).value
    }
    return undefined
  }

  private findCounterStep(statements: Statement[], name: string): number | undefined {
    for (const statement of statements) {
      if (isExpressionStatement(statement)) {
        const step = this.stepOf((statement as ExpressionStatement).expression as Expression, name)
        if (step !== undefined) return step
      }
      const nested = this.findCounterStep(this.childStatements(statement), name)
      if (nested !== undefined) return nested
    }
    return undefined
  }

  private childStatements(statement: Statement): Statement[] {
    return _match(true)
      .with(isBlockStatement(statement), () => (statement as BlockStatement).body)
      .with(isIfStatement(statement), () => {
        const branches: Statement[] = []
        if ((statement as IfStatement).consequent) branches.push((statement as IfStatement).consequent as Statement)
        if ((statement as IfStatement).alternate) branches.push((statement as IfStatement).alternate as Statement)
        return branches
      })
      .with(
        isForStatement(statement) || isForOfStatement(statement) || isForInStatement(statement) || isWhileStatement(statement),
        () => {
          const body = (statement as { body?: Statement | null }).body
          return body ? [body] : []
        },
      )
      .with(isTryStatement(statement), () => {
        const children: Statement[] = [(statement as TryStatement).block]
        if ((statement as TryStatement).handler) children.push((statement as TryStatement).handler?.body as Statement)
        if ((statement as TryStatement).finalizer) children.push((statement as TryStatement).finalizer as Statement)
        return children
      })
      .with(isSwitchStatement(statement), () => (statement as SwitchStatement).cases.flatMap((clause) => clause.consequent))
      .with(true, () => [] as Statement[])
      .exec() as Statement[]
  }

  private blockStatements(node: BlockStatement | Statement): Statement[] {
    return _match(isBlockStatement(node))
      .with(true, () => (node as BlockStatement).body)
      .with(false, () => [node as Statement])
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
    const hasFallthrough = (clause.consequent ?? []).length === 0
    if (hasFallthrough) return ''
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
