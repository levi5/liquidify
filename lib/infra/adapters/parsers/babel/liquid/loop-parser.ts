import generate from '@babel/generator'
import type { LiquidVariableParser } from './variable-parser'
import {
  type Expression,
  type Node,
  isCallExpression,
  isMemberExpression,
  isIdentifier,
  type CallExpression,
  isArrowFunctionExpression,
  identifier,
  isObjectPattern,
  variableDeclarator,
  type ArrowFunctionExpression,
  isBlockStatement,
  type ReturnStatement,
  isReturnStatement,
  isOptionalCallExpression,
  isOptionalMemberExpression,
  type OptionalCallExpression,
  isVariableDeclaration,
  isIfStatement,
  isConditionalExpression,
  isLogicalExpression,
} from '@babel/types'

import type { ParsingContext } from '../../../../../core/entities/parsing-context'

export class LiquidLoopParser {
  constructor(
    private _jsxToHtml: (node: any, renames?: Record<string, string>, context?: ParsingContext) => string,
    private liquidVariableParser: LiquidVariableParser,
  ) {}

  public isMapCallExpression(expr: Expression): boolean {
    const isMapCall = isCallExpression(expr) || isOptionalCallExpression(expr)
    if (!isMapCall) return false

    const callee = (expr as any).callee
    const isMapMember = isMemberExpression(callee) || isOptionalMemberExpression(callee)

    if (!isMapMember || !isIdentifier(callee.property)) return false

    const methodName = callee.property.name
    return methodName === 'map' || methodName === 'filter'
  }

  public transformMap(expr: CallExpression | OptionalCallExpression, renames?: Record<string, string>, context?: ParsingContext): string {
    const callee = expr.callee
    if (!isMemberExpression(callee) && !isOptionalMemberExpression(callee)) return ''

    let arrayName = generate(callee.object).code.replace(/\?\.$/, '').replace(/\?/g, '')
    const callback = expr.arguments[0]
    let filterCondition = ''
    let assignments = ''
    let itemName = 'item'

    const calleeProperty = callee.property
    const methodName = isIdentifier(calleeProperty) ? calleeProperty.name : ''

    if (methodName === 'map') {
      if (
        (isCallExpression(callee.object) || isOptionalCallExpression(callee.object)) &&
        (isMemberExpression(callee.object.callee) || isOptionalMemberExpression(callee.object.callee)) &&
        isIdentifier(callee.object.callee.property) &&
        callee.object.callee.property.name === 'filter'
      ) {
        const filterCall = callee.object
        const filterCallback = filterCall.arguments[0]

        if (isArrowFunctionExpression(filterCallback) && filterCallback.params.length > 0) {
          const filterParam = filterCallback.params[0]
          if (isIdentifier(filterParam)) {
            filterCondition = this.liquidVariableParser.generateLiquidCode(filterCallback.body, true, undefined, context)
          }
        }

        arrayName = generate((callee.object.callee as any).object)
          .code.replace(/\?\.$/, '')
          .replace(/\?/g, '')
      }
    } else if (methodName === 'filter') {
      if (isArrowFunctionExpression(callback) && callback.params.length > 0) {
        const body = callback.body
        const param = callback.params[0]
        itemName = isIdentifier(param) ? param.name : 'item'

        if (isBlockStatement(body)) {
          for (const stmt of body.body) {
            if (isVariableDeclaration(stmt)) {
              for (const decl of stmt.declarations) {
                assignments += `${this.liquidVariableParser.parseVariableDeclaration(decl, undefined, context).join('\n')}\n`
              }
            } else if (isIfStatement(stmt)) {
              assignments += `${this.liquidVariableParser
                .parseIfStatement(stmt, (n, ctx) => this.jsxToHtml(n, undefined, ctx), undefined, context)
                .join('\n')}\n`
            } else if (isReturnStatement(stmt)) {
              assignments += `${this.jsxToHtml(stmt.argument as any, undefined, context)}\n`
            }
          }

          return `{% for ${itemName} in ${arrayName} %}${assignments}{% endfor %}`
        }

        if (isConditionalExpression(body) || isLogicalExpression(body)) {
          const result = this.jsxToHtml(body as any, undefined, context)
          return `{% for ${itemName} in ${arrayName} %}${result}{% endfor %}`
        }
        filterCondition = this.liquidVariableParser.generateLiquidCode(body, true, undefined, context)
      }
    }

    let limit = ''
    let offset = ''

    if (
      isCallExpression(callee.object) &&
      isMemberExpression(callee.object.callee) &&
      isIdentifier(callee.object.callee.property) &&
      callee.object.callee.property.name === 'slice'
    ) {
      arrayName = generate(callee.object.callee.object).code.replace(/\?\.$/, '').replace(/\?/g, '')
      const args = callee.object.arguments

      const startArg = args[0]
      const endArg = args[1]

      const start = startArg && 'value' in startArg ? Number(startArg.value) : 0

      if (start > 0) {
        offset = ` offset: ${start}`
      }

      if (endArg && 'value' in endArg) {
        const end = Number(endArg.value)
        limit = ` limit: ${end - start}`
      }
    }

    if (!isArrowFunctionExpression(callback) || callback.params.length === 0) return ''

    const param = callback.params[0]

    if (!isIdentifier(param) && !isObjectPattern(param)) return ''

    if (isIdentifier(param)) {
      itemName = param.name
    }

    const localRenames = { ...renames }
    if (callback.params.length > 1) {
      const indexParam = callback.params[1]
      if (isIdentifier(indexParam)) {
        localRenames[indexParam.name] = 'forloop.index'
      }
    }

    if (!isIdentifier(param)) {
      const fakeDeclarator = variableDeclarator(param, identifier(itemName))
      assignments = this.liquidVariableParser.parseVariableDeclaration(fakeDeclarator, undefined, context).join('\n')
    }

    if (isBlockStatement(callback.body)) {
      for (const stmt of callback.body.body) {
        if (isVariableDeclaration(stmt)) {
          for (const decl of stmt.declarations) {
            assignments += `${this.liquidVariableParser.parseVariableDeclaration(decl, undefined, context).join('\n')}\n`
          }
        } else if (isIfStatement(stmt)) {
          assignments += `${this.liquidVariableParser.parseIfStatement(stmt, undefined, undefined, context).join('\n')}\n`
        }
      }
    }

    const returnNode = this.extractReturnNode(callback)
    let body = returnNode ? this.jsxToHtml(returnNode as any, localRenames, context) : ''

    if (filterCondition) {
      body = `{% if ${filterCondition} %}${body}{% endif %}`
    }

    return `{% for ${itemName} in ${arrayName}${limit}${offset} %}${assignments}${body}{% endfor %}`
  }

  private extractReturnNode(fn: ArrowFunctionExpression): Node | null {
    if (isBlockStatement(fn.body)) {
      const returnStmt = fn.body.body.find((stmt): stmt is ReturnStatement => isReturnStatement(stmt))
      return returnStmt?.argument ?? null
    }

    return fn.body
  }

  private jsxToHtml(node: any, renames?: Record<string, string>, context?: ParsingContext): string {
    return this._jsxToHtml(node, renames, context)
  }
}
