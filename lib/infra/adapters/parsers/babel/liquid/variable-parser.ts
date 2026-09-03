import generate from '@babel/generator'
import {
  isIdentifier,
  isObjectPattern,
  isObjectProperty,
  type VariableDeclarator,
  isConditionalExpression,
  isLogicalExpression,
  isIfStatement,
  isBlockStatement,
  isExpressionStatement,
  isAssignmentExpression,
  isObjectExpression,
  isTemplateLiteral,
  type IfStatement,
  isCallExpression,
  isMemberExpression,
  isArrowFunctionExpression,
  isReturnStatement,
  ObjectPattern,
} from '@babel/types'
import { _Maybe, _Object } from 'funcio'

import { ParsingContext } from '../../../../../core/entities/parsing-context'

export class LiquidVariableParser {
  public parseExpression?: (node: any, renames?: Record<string, string>, context?: ParsingContext) => string

  constructor(
    public generateLiquidCode: (node: any, inCondition?: boolean, renames?: Record<string, string>, context?: ParsingContext) => string,
  ) {}

  public parseVariableDeclaration(declaration: VariableDeclarator, renames?: Record<string, string>, context?: ParsingContext): string[] {
    const id = _Maybe
      .of(_Object.getPathValue(['id'], declaration))
      .map((value) => value)
      .getOrElse(null)
    const init = _Maybe
      .of(_Object.getPathValue(['init'], declaration))
      .map((value) => value)
      .getOrElse(null)

    if (!id || !init) return []

    if (isIdentifier(id) && isTemplateLiteral(init) && init.expressions.length === 0) {
      const raw = init.quasis[0].value.raw
      return [`{% assign ${id.name} = ${raw} %}`]
    }

    if (isIdentifier(id) && isConditionalExpression(init)) {
      return this.parseConditionalExpressionRecursive(id.name, init, renames, context)
    }

    if (isIdentifier(id) && isLogicalExpression(init) && (init.operator === '||' || init.operator === '??')) {
      const extractOrPartsNodes = (expr: any): any[] => {
        if (isLogicalExpression(expr) && (expr.operator === '||' || expr.operator === '??')) {
          return [...extractOrPartsNodes(expr.left), expr.right]
        }
        return [expr]
      }

      const nodes = extractOrPartsNodes(init)
      const baseNode = nodes.shift()
      const baseCode = this.generateLiquidCode(baseNode, false, renames, context)

      const hasObjectLiteral = nodes.some((n) => isObjectExpression(n))

      if (hasObjectLiteral) {
        const lines = [`{% assign ${id.name} = ${baseCode} %}`]
        for (const node of nodes) {
          const code = this.generateLiquidCode(node, false, renames, context)
          lines.push(`{% if ${id.name} == nil or ${id.name} == "" or ${id.name} == false %}`)
          if (!isObjectExpression(node)) {
            lines.push(`  {% assign ${id.name} = ${code} %}`)
          }
          lines.push(`{% endif %}`)
        }
        return lines
      }

      const parts = nodes.map((n) => this.generateLiquidCode(n, false, renames, context))
      const defaults = parts.map((p) => ` | default: ${p}`).join('')
      return [`{% assign ${id.name} = ${baseCode}${defaults} %}`]
    }

    const valueCode = this.generateLiquidCode(init, false, renames, context)

    if (isIdentifier(id)) {
      if (
        isCallExpression(init) &&
        isMemberExpression(init.callee) &&
        isIdentifier(init.callee.property) &&
        (init.callee.property.name === 'filter' || init.callee.property.name === 'find')
      ) {
        const methodName = init.callee.property.name
        const callback = init.arguments[0]
        if (isArrowFunctionExpression(callback) && callback.params.length > 0) {
          const arrayName = this.generateLiquidCode(init.callee.object, false, renames, context)
          const itemName = isIdentifier(callback.params[0]) ? callback.params[0].name : 'item'
          const condition = this.generateLiquidCode(callback.body, false, renames, context)

          const loopBody = [
            `{% for ${itemName} in ${arrayName} %}`,
            `  {% if ${condition} %}`,
            `    {% assign ${id.name} = ${itemName} %}`,
            methodName === 'find' ? `    {% break %}` : '',
            `  {% endif %}`,
            `{% endfor %}`,
          ].filter(Boolean)

          return [`{% assign ${id.name} = "" %}`, ...loopBody]
        }
      }
      return [`{% assign ${id.name} = ${valueCode} %}`]
    }

    if (isObjectPattern(declaration.id)) {
      return this.flattenObjectPattern(declaration.id, valueCode)
    }
    return []
  }

  private flattenObjectPattern(pattern: ObjectPattern, basePath: string): string[] {
    const assigns: string[] = []
    for (const prop of pattern.properties) {
      if (!isObjectProperty(prop) || !isIdentifier(prop.key)) continue
      const keyName = prop.key.name
      const fullPath = `${basePath}.${keyName}`
      if (isIdentifier(prop.value)) {
        assigns.push(`{% assign ${prop.value.name} = ${fullPath} %}`)
      } else if (isObjectPattern(prop.value)) {
        assigns.push(...this.flattenObjectPattern(prop.value, fullPath))
      }
    }
    return assigns
  }

  private parseConditionalExpressionRecursive(
    idName: string,
    expr: any,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    const lines: string[] = []
    lines.push(`{% if ${this.generateLiquidCode(expr.test, true, renames, context)} %}`)
    lines.push(`  {% assign ${idName} = ${this.generateLiquidCode(expr.consequent, false, renames, context)} %}`)

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

  public parseIfStatement(
    statement: IfStatement,
    onReturn?: (node: any, context?: ParsingContext) => string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    const lines: string[] = []

    const parseBranch = (stmt: IfStatement, isElsif = false) => {
      const keyword = isElsif ? 'elsif' : 'if'
      lines.push(`{% ${keyword} ${this.generateLiquidCode(stmt.test, true, renames, context)} %}`)

      lines.push(...this.extractAssignments(stmt.consequent, onReturn, renames, context).map((s) => `  ${s}`))

      if (stmt.alternate) {
        if (isIfStatement(stmt.alternate)) {
          parseBranch(stmt.alternate, true)
        } else {
          lines.push(`{% else %}`)
          lines.push(...this.extractAssignments(stmt.alternate, onReturn, renames, context).map((s) => `  ${s}`))
        }
      }
    }

    parseBranch(statement)
    lines.push(`{% endif %}`)

    return lines
  }

  private extractAssignments(
    node: any,
    onReturn?: (node: any, context?: ParsingContext) => string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    const assignments: string[] = []
    if (isBlockStatement(node)) {
      for (const stmt of node.body) {
        if (isExpressionStatement(stmt)) {
          if (isAssignmentExpression(stmt.expression)) {
            if (isIdentifier(stmt.expression.left)) {
              const rightCode = this.generateLiquidCode(stmt.expression.right, false, renames, context)
              if (stmt.expression.operator === '+=') {
                assignments.push(`{% assign ${stmt.expression.left.name} = ${stmt.expression.left.name} | append: ${rightCode} %}`)
              } else {
                assignments.push(`{% assign ${stmt.expression.left.name} = ${rightCode} %}`)
              }
            }
          } else if (
            isCallExpression(stmt.expression) &&
            isMemberExpression(stmt.expression.callee) &&
            isIdentifier(stmt.expression.callee.property) &&
            stmt.expression.callee.property.name === 'map'
          ) {
            if (this.parseExpression) {
              assignments.push(this.parseExpression(stmt.expression, renames, context))
            }
          }
        } else if (isReturnStatement(stmt) && onReturn) {
          assignments.push(onReturn((stmt as any).argument, context))
        } else if (isIfStatement(stmt)) {
          assignments.push(...this.parseIfStatement(stmt, onReturn, renames, context))
        }
      }
    } else if (isExpressionStatement(node)) {
      if (isAssignmentExpression(node.expression)) {
        if (isIdentifier(node.expression.left)) {
          const rightCode = this.generateLiquidCode(node.expression.right, false, renames, context)
          if (node.expression.operator === '+=') {
            assignments.push(`{% assign ${node.expression.left.name} = ${node.expression.left.name} | append: ${rightCode} %}`)
          } else {
            assignments.push(`{% assign ${node.expression.left.name} = ${rightCode} %}`)
          }
        }
      } else if (
        isCallExpression(node.expression) &&
        isMemberExpression(node.expression.callee) &&
        isIdentifier(node.expression.callee.property) &&
        node.expression.callee.property.name === 'map'
      ) {
        if (this.parseExpression) {
          assignments.push(this.parseExpression(node.expression, renames, context))
        }
      }
    } else if (isReturnStatement(node) && onReturn) {
      assignments.push(onReturn(node.argument, context))
    }
    return assignments
  }
}
