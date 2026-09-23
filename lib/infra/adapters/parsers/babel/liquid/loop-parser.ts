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
import { _Maybe, _match } from 'funcio'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

const cleanCode = (code: string): string => code.replace(/\?\.$/, '').replace(/\?/g, '')

export class LiquidLoopParser {
  public renderBody?: (body: any, renames?: Record<string, string>, context?: ParsingContext) => string

  constructor(
    private _jsxToHtml: (node: any, renames?: Record<string, string>, context?: ParsingContext) => string,
    private liquidVariableParser: LiquidVariableParser,
  ) {}

  public isMapCallExpression(expr: Expression): boolean {
    return _Maybe
      .of(isCallExpression(expr) || isOptionalCallExpression(expr))
      .map((isCall) => {
        if (!isCall) return false
        const callee = (expr as any).callee
        const isMember = isMemberExpression(callee) || isOptionalMemberExpression(callee)
        if (!isMember || !isIdentifier(callee.property)) return false
        return _match(callee.property.name)
          .with('map', () => true)
          .with('filter', () => true)
          .with(callee.property.name, () => false)
          .exec() as boolean
      })
      .getOrElse(false)
  }

  public transformMap(expr: CallExpression | OptionalCallExpression, renames?: Record<string, string>, context?: ParsingContext): string {
    const callee = expr.callee
    return _Maybe
      .of(isMemberExpression(callee) || isOptionalMemberExpression(callee))
      .map((isMember) => {
        if (!isMember) return ''
        const methodName = isIdentifier((callee as any).property) ? (callee as any).property.name : ''
        return _match(methodName)
          .with('map', () => this.renderMap(expr, callee as any, renames, context))
          .with('filter', () => this.renderFilter(expr, callee as any, renames, context))
          .with(methodName, () => '')
          .exec() as string
      })
      .getOrElse('')
  }

  private arrayCodeOf(node: any): string {
    return _Maybe
      .of(node)
      .map((target) => cleanCode(generate(target).code))
      .getOrElse('')
  }

  private paramNameOf(params: any[], index: number, fallback: string): string {
    return _Maybe
      .of(params?.[index])
      .map((param) => (isIdentifier(param) ? param.name : fallback))
      .getOrElse(fallback)
  }

  private renderMap(
    expr: CallExpression | OptionalCallExpression,
    callee: any,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const filterInfo = this.extractFilterChain(callee)
    const callback = expr.arguments[0] as ArrowFunctionExpression
    return _Maybe
      .of(isArrowFunctionExpression(callback) && callback.params.length > 0)
      .map((valid) => {
        if (!valid) return ''
        const itemName = this.paramNameOf(callback.params as any[], 0, 'item')
        const localRenames = { ...renames, ...this.indexRenames(callback) }
        const filterCondition = _Maybe
          .of(filterInfo)
          .map((info) => {
            if (!info) return ''
            const mapped = { ...renames, [info.param]: itemName }
            return this.liquidVariableParser.generateLiquidCode(info.body, true, mapped, context)
          })
          .getOrElse('')
        const slice = this.sliceSuffix(callee)
        const arrayTarget = filterInfo ? filterInfo.array : this.extractArrayTarget(callee)
        const assignments = this.mapAssignments(callback, context)
        const returnNode = this.extractReturnNode(callback)
        const body = _Maybe
          .of(returnNode)
          .map((node) => this.jsxToHtml(node as any, localRenames, context))
          .getOrElse('')
        const guarded = filterCondition ? `{% if ${filterCondition} %}${body}{% endif %}` : body
        return `{% for ${itemName} in ${this.arrayCodeOf(arrayTarget)}${slice} %}${assignments}${guarded}{% endfor %}`
      })
      .getOrElse('')
  }

  private extractArrayTarget(callee: any): any {
    const object = callee?.object
    const isSliceCall =
      isCallExpression(object) &&
      isMemberExpression((object as any).callee) &&
      isIdentifier((object as any).callee.property) &&
      (object as any).callee.property.name === 'slice'
    if (isSliceCall) {
      return (object as any).callee.object
    }
    return object
  }

  private extractFilterChain(callee: any): { array: any; param: string; body: any } | null {
    const target = this.extractArrayTarget(callee)
    return _Maybe
      .of(target)
      .map((object) => {
        const isChainedCall = isCallExpression(object) || isOptionalCallExpression(object)
        if (!isChainedCall) return null
        const innerCallee = (object as any).callee
        const isInnerMember = isMemberExpression(innerCallee) || isOptionalMemberExpression(innerCallee)
        if (!isInnerMember || !isIdentifier(innerCallee.property) || innerCallee.property.name !== 'filter') return null
        const filterCallback = (object as any).arguments?.[0]
        if (!isArrowFunctionExpression(filterCallback) || filterCallback.params.length === 0) return null
        const param = filterCallback.params[0]
        if (!isIdentifier(param)) return null
        return { array: (innerCallee as any).object, param: param.name, body: filterCallback.body }
      })
      .getOrElse(null)
  }

  private indexRenames(callback: ArrowFunctionExpression): Record<string, string> {
    return _Maybe
      .of(callback.params?.[1])
      .map((param) => (isIdentifier(param) ? { [param.name]: 'forloop.index0' } : {}))
      .getOrElse({})
  }

  private sliceSuffix(callee: any): string {
    return _Maybe
      .of(callee?.object)
      .map((object) => {
        const isSliceCall =
          isCallExpression(object) &&
          isMemberExpression((object as any).callee) &&
          isIdentifier((object as any).callee.property) &&
          (object as any).callee.property.name === 'slice'
        if (!isSliceCall) return ''
        const args = (object as any).arguments || []
        const start = args[0] && 'value' in args[0] ? Number(args[0].value) : 0
        const end = args[1] && 'value' in args[1] ? Number(args[1].value) : null
        const offset = start > 0 ? ` offset: ${start}` : ''
        const limit = end !== null ? ` limit: ${Number(end) - start}` : ''
        return `${limit}${offset}`
      })
      .getOrElse('')
  }

  private mapAssignments(callback: ArrowFunctionExpression, context?: ParsingContext): string {
    return _Maybe
      .of(isBlockStatement(callback.body))
      .map((isBlock) => {
        if (!isBlock) return this.destructureAssign(callback, context)
        const statements = (callback.body as any).body || []
        const lines = statements.flatMap(
          (stmt: any) =>
            _match(true)
              .with(isVariableDeclaration(stmt), () =>
                (stmt.declarations || [])
                  .map((decl: any) => this.liquidVariableParser.parseVariableDeclaration(decl, undefined, context).join('\n'))
                  .join('\n'),
              )
              .with(isIfStatement(stmt), () => this.liquidVariableParser.parseIfStatement(stmt, undefined, undefined, context).join('\n'))
              .with(true, () => '')
              .exec() as string,
        )
        const prefix = this.destructureAssign(callback, context)
        const body = lines.filter(Boolean).join('\n')
        return `${prefix}${body ? `${body}\n` : ''}`
      })
      .getOrElse('')
  }

  private destructureAssign(callback: ArrowFunctionExpression, context?: ParsingContext): string {
    const param = callback.params[0]
    return _Maybe
      .of(param && !isIdentifier(param))
      .map((needs) => {
        if (!needs) return ''
        const fakeDeclarator = variableDeclarator(param as any, identifier('item'))
        return `${this.liquidVariableParser.parseVariableDeclaration(fakeDeclarator, undefined, context).join('\n')}\n`
      })
      .getOrElse('')
  }

  private renderFilter(
    expr: CallExpression | OptionalCallExpression,
    callee: any,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const callback = expr.arguments[0]
    const arrayName = this.arrayCodeOf(callee.object)
    return _Maybe
      .of(isArrowFunctionExpression(callback) && callback.params.length > 0)
      .map((valid) => {
        if (!valid) return ''
        const body = (callback as ArrowFunctionExpression).body
        const param = (callback as ArrowFunctionExpression).params[0]
        const itemName = isIdentifier(param) ? param.name : 'item'
        return _match(true)
          .with(isBlockStatement(body), () => this.renderFilterBlock(arrayName, itemName, body as any, context))
          .with(
            isConditionalExpression(body) || isLogicalExpression(body),
            () => `{% for ${itemName} in ${arrayName} %}${this.jsxToHtml(body as any, renames, context)}{% endfor %}`,
          )
          .with(true, () => {
            const condition = this.liquidVariableParser.generateLiquidCode(body, true, renames, context)
            return `{% for ${itemName} in ${arrayName} %}{% if ${condition} %}{{ ${itemName} }}{% endif %}{% endfor %}`
          })
          .exec() as string
      })
      .getOrElse('')
  }

  private renderFilterBlock(arrayName: string, itemName: string, body: any, context?: ParsingContext): string {
    const assignments = (body.body || [])
      .map(
        (stmt: any) =>
          _match(true)
            .with(isVariableDeclaration(stmt), () =>
              (stmt.declarations || [])
                .map((decl: any) => this.liquidVariableParser.parseVariableDeclaration(decl, undefined, context).join('\n'))
                .join('\n'),
            )
            .with(isIfStatement(stmt), () =>
              this.liquidVariableParser
                .parseIfStatement(stmt, (n, ctx) => this.jsxToHtml(n, undefined, ctx), undefined, context)
                .join('\n'),
            )
            .with(isReturnStatement(stmt), () => this.jsxToHtml(stmt.argument as any, undefined, context))
            .with(true, () => '')
            .exec() as string,
      )
      .filter(Boolean)
      .join('\n')
    return `{% for ${itemName} in ${arrayName} %}${assignments}{% endfor %}`
  }

  private extractReturnNode(fn: ArrowFunctionExpression): Node | null {
    return _Maybe
      .of(isBlockStatement(fn.body))
      .map((isBlock) => {
        if (!isBlock) return fn.body as Node
        const returnStmt = (fn.body as any).body.find((stmt: any): stmt is ReturnStatement => isReturnStatement(stmt))
        return (returnStmt?.argument as Node) ?? null
      })
      .getOrElse(null)
  }

  private jsxToHtml(node: any, renames?: Record<string, string>, context?: ParsingContext): string {
    return this._jsxToHtml(node, renames, context)
  }
}
