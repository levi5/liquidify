import {
  type VariableDeclaration,
  isIdentifier,
  isArrowFunctionExpression,
  isBlockStatement,
  isReturnStatement,
  isJSXElement,
  isJSXFragment,
  isParenthesizedExpression,
  returnStatement,
} from '@babel/types'
import type { ComponentMetadataType } from '../../../../../types/component'
import type { StatementCollector } from './statement-collector'

export class VariableParser {
  constructor(private statementCollector: StatementCollector) {}

  public parse(node: VariableDeclaration, metadata: ComponentMetadataType): void {
    const declarator = node.declarations[0]
    if (!declarator) return

    const name = isIdentifier(declarator.id) ? declarator.id.name : ''

    if (declarator.init && isArrowFunctionExpression(declarator.init)) {
      const hasJSX = this.arrowFunctionHasJSX(declarator.init)

      if (hasJSX || !metadata.name) {
        metadata.name = name
      }

      if (declarator.init.params.length > 0) {
        const param = declarator.init.params[0]
        if (param.type === 'ObjectPattern') {
          for (const prop of param.properties) {
            if (prop.type === 'ObjectProperty' && prop.value.type === 'AssignmentPattern' && prop.value.left.type === 'Identifier') {
              const propName = prop.value.left.name
              const generate = require('@babel/generator').default
              const defaultValue = generate(prop.value.right).code
              metadata.liquidAssignments = metadata.liquidAssignments || []
              metadata.liquidAssignments.push(`{% if ${propName} == nil %}\n  {% assign ${propName} = ${defaultValue} %}\n{% endif %}`)
            }
          }
        }
      }

      if (isBlockStatement(declarator.init.body)) {
        const statements = [...(declarator.init.body.directives || []), ...declarator.init.body.body]
        this.statementCollector.collect(statements as any[], metadata)
      } else {
        this.statementCollector.collect([returnStatement(declarator.init.body)], metadata)
      }
    } else if (!metadata.name) {
      metadata.name = name
    }
  }

  private arrowFunctionHasJSX(fn: any): boolean {
    const body = fn.body
    if (isJSXElement(body) || isJSXFragment(body)) return true
    if (isParenthesizedExpression(body)) {
      return isJSXElement(body.expression) || isJSXFragment(body.expression)
    }
    if (isBlockStatement(body)) {
      return body.body.some(
        (stmt: any) => isReturnStatement(stmt) && stmt.argument && (isJSXElement(stmt.argument) || isJSXFragment(stmt.argument)),
      )
    }
    return false
  }
}
