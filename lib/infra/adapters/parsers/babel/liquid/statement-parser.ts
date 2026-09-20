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
  type Node,
} from '@babel/types'
import { ValidationError } from '../../../../../core/errors/validation-error'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'
import type { LiquidVariableParser } from './variable-parser'
import { renderCondition } from './condition'

export class LiquidStatementParser {
  constructor(
    private readonly variables: LiquidVariableParser,
    private readonly render: (node: any, renames?: Record<string, string>, context?: ParsingContext) => string,
  ) {}

  public renderBody(statements: Statement[], renames?: Record<string, string>, context?: ParsingContext): string {
    const [statement, ...rest] = statements
    if (!statement) return ''
    const next = () => this.renderBody(rest, renames, context)
    if (isReturnStatement(statement)) return statement.argument ? this.render(statement.argument, renames, context) : ''
    if (isBlockStatement(statement)) return this.renderBody([...statement.body, ...rest], renames, context)
    if (isIfStatement(statement)) {
      const branch = (node: Statement | null | undefined): Statement[] =>
        !node ? rest : [...(isBlockStatement(node) ? node.body : [node]), ...rest]
      const yes = this.renderBody(branch(statement.consequent), renames, context)
      const no = this.renderBody(branch(statement.alternate), renames, context)
      const markup = renderCondition(statement.test, yes, no, (node: Node) =>
        this.variables.generateLiquidCode(node, true, renames, context),
      )
      return `${context?.getPendingAssigns() || ''}${markup}`
    }
    if (isVariableDeclaration(statement)) {
      const assigns = statement.declarations
        .flatMap((declaration) => {
          if (isIdentifier(declaration.id) && context?.inlineComponents?.has(declaration.id.name)) return []
          const lines = this.variables.parseVariableDeclaration(declaration, renames, context)
          return [context?.getPendingAssigns() || '', ...lines]
        })
        .join('\n')
      return `${assigns}\n${next()}`
    }
    if (isExpressionStatement(statement) && isAssignmentExpression(statement.expression) && isIdentifier(statement.expression.left)) {
      const { left, right, operator } = statement.expression
      if (operator !== '=') throw new ValidationError(`Unsupported Liquid assignment operator: ${operator}`, context?.currentFilePath)
      const assigns = this.variables.parseVariableDeclaration(variableDeclarator(left, right), renames, context).join('\n')
      return `${context?.getPendingAssigns() || ''}${assigns}\n${next()}`
    }
    if (
      isEmptyStatement(statement) ||
      isDirective(statement) ||
      (isExpressionStatement(statement) && isStringLiteral(statement.expression))
    )
      return next()
    throw new ValidationError(`Unsupported statement in Liquid component: ${statement.type}`, context?.currentFilePath)
  }
}
