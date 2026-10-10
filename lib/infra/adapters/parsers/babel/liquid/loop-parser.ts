import generate from '@babel/generator'
import type { LiquidVariableParser } from './variable-parser'
import {
  type Expression,
  type Node,
  type LVal,
  type VariableDeclaration,
  isCallExpression,
  isMemberExpression,
  isIdentifier,
  type CallExpression,
  type MemberExpression,
  isArrowFunctionExpression,
  identifier,
  variableDeclarator,
  type ArrowFunctionExpression,
  type BlockStatement,
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
import { _match } from 'funcio'
import { ValidationError } from '../../../../../core/errors/validation-error'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

const cleanCode = (code: string): string => code.replace(/\?\.\s*/g, '.')

export class LiquidLoopParser {
  public renderBody?: (body: unknown, renames?: Record<string, string>, context?: ParsingContext) => string

  constructor(
    private readonly jsxToHtml: (node: unknown, renames?: Record<string, string>, context?: ParsingContext) => string,
    private liquidVariableParser: LiquidVariableParser,
  ) {}

  public isMapCallExpression(expr: Expression): boolean {
    return _match(isCallExpression(expr) || isOptionalCallExpression(expr))
      .with(true, () => this.isMapOrFilter(expr as CallExpression | OptionalCallExpression))
      .with(false, () => false)
      .exec() as boolean
  }

  private isMapOrFilter(expr: CallExpression | OptionalCallExpression): boolean {
    return _match(this.methodName(expr.callee))
      .with('map', () => true)
      .with('filter', () => true)
      .with(this.methodName(expr.callee), () => false)
      .exec() as boolean
  }

  private methodName(callee: CallExpression['callee'] | OptionalCallExpression['callee']): string {
    return _match(isMemberExpression(callee) || isOptionalMemberExpression(callee))
      .with(true, () => this.propertyName((callee as { property: unknown }).property))
      .with(false, () => '')
      .exec() as string
  }

  private propertyName(property: unknown): string {
    return _match(isIdentifier(property as Node))
      .with(true, () => (property as { name: string }).name)
      .with(false, () => '')
      .exec() as string
  }

  public transformMap(expr: CallExpression | OptionalCallExpression, renames?: Record<string, string>, context?: ParsingContext): string {
    return _match(this.methodName(expr.callee))
      .with('map', () => this.renderMap(expr, expr.callee as MemberExpression, renames, context))
      .with('filter', () => this.renderFilter(expr, expr.callee as MemberExpression, renames, context))
      .with(this.methodName(expr.callee), () => '')
      .exec() as string
  }

  private arrayCodeOf(node: unknown): string {
    return _match(node === null || node === undefined)
      .with(true, () => '')
      .with(false, () => cleanCode(generate(node as Node).code))
      .exec() as string
  }

  private paramNameOf(params: ArrowFunctionExpression['params'], index: number, fallback: string): string {
    const param = params[index]
    return _match(param !== undefined && isIdentifier(param))
      .with(true, () => (param as { name: string }).name)
      .with(false, () => fallback)
      .exec() as string
  }

  private renderMap(
    expr: CallExpression | OptionalCallExpression,
    callee: MemberExpression,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const callback = expr.arguments[0]
    return _match(!isArrowFunctionExpression(callback as Node) || (callback as { params: unknown[] }).params.length === 0)
      .with(true, () => {
        throw new ValidationError('Liquid .map() requires an inline arrow callback such as items.map(item => item.title).')
      })
      .with(false, () => this.renderValidMap(callee, callback as ArrowFunctionExpression, renames, context))
      .exec() as string
  }

  private renderValidMap(
    callee: MemberExpression,
    callback: ArrowFunctionExpression,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const itemName = this.paramNameOf(callback.params, 0, 'item')
    const localRenames = { ...renames, ...this.indexRenames(callback) }
    const filterCondition = this.filterCondition(callee, itemName, renames, context)
    const slice = this.sliceSuffix(callee, renames, context)
    const arrayTarget = this.mapArrayTarget(callee)
    const arrayCode = this.arrayCodeOf(arrayTarget)
    return _match(arrayCode === '')
      .with(true, () => {
        throw new ValidationError('Liquid .map() requires an array target (e.g. items.map(...)).')
      })
      .with(false, () => {
        const assignments = this.mapAssignments(callback, context)
        const body = this.mapBody(callback, localRenames, context)
        const guarded = _match(filterCondition === '')
          .with(true, () => body)
          .with(false, () => `{% if ${filterCondition} %}${body}{% endif %}`)
          .exec() as string
        return `{% for ${itemName} in ${arrayCode}${slice} %}${assignments}${guarded}{% endfor %}`
      })
      .exec() as string
  }

  private filterCondition(callee: MemberExpression, itemName: string, renames?: Record<string, string>, context?: ParsingContext): string {
    const filterInfo = this.extractFilterChain(callee)
    return _match(filterInfo === null)
      .with(true, () => '')
      .with(false, () =>
        this.liquidVariableParser.generateLiquidCode(
          (filterInfo as { body: Node }).body,
          true,
          { ...renames, [(filterInfo as { param: string }).param]: itemName },
          context,
        ),
      )
      .exec() as string
  }

  private mapArrayTarget(callee: MemberExpression): unknown {
    const filterInfo = this.extractFilterChain(callee)
    return _match(filterInfo === null)
      .with(true, () => this.extractArrayTarget(callee))
      .with(false, () => (filterInfo as { array: unknown }).array)
      .exec()
  }

  private mapBody(callback: ArrowFunctionExpression, localRenames: Record<string, string>, context?: ParsingContext): string {
    const returnNode = this.extractReturnNode(callback)
    return _match(returnNode === null)
      .with(true, () => '')
      .with(false, () => this.jsxToHtml(returnNode as Node, localRenames, context))
      .exec() as string
  }

  private extractArrayTarget(callee: MemberExpression): unknown {
    const object = (callee as { object?: unknown }).object
    return _match(this.isSliceCall(object))
      .with(true, () => ((object as CallExpression).callee as MemberExpression).object)
      .with(false, () => object)
      .exec()
  }

  private isSliceCall(object: unknown): boolean {
    const callee = (object as { callee?: unknown }).callee
    return (
      isCallExpression(object as Node) &&
      isMemberExpression(callee as Node) &&
      isIdentifier((callee as { property?: unknown }).property as Node) &&
      ((callee as { property: { name: string } }).property as { name: string }).name === 'slice'
    )
  }

  private extractFilterChain(callee: MemberExpression): { array: unknown; param: string; body: unknown } | null {
    const target = this.extractArrayTarget(callee)
    return _match(isCallExpression(target as Node) || isOptionalCallExpression(target as Node))
      .with(true, () => this.matchFilterCall(target))
      .with(false, () => null)
      .exec() as { array: unknown; param: string; body: unknown } | null
  }

  private matchFilterCall(target: unknown): { array: unknown; param: string; body: unknown } | null {
    const innerCallee = (target as { callee: unknown }).callee
    return _match(this.isFilterCallee(innerCallee))
      .with(true, () => this.filterCallback((target as { arguments: unknown[] }).arguments[0], innerCallee))
      .with(false, () => null)
      .exec() as { array: unknown; param: string; body: unknown } | null
  }

  private isFilterCallee(innerCallee: unknown): boolean {
    return (
      (isMemberExpression(innerCallee as Node) || isOptionalMemberExpression(innerCallee as Node)) &&
      isIdentifier((innerCallee as { property?: unknown }).property as Node) &&
      ((innerCallee as { property: { name: string } }).property as { name: string }).name === 'filter'
    )
  }

  private filterCallback(filterCallback: unknown, innerCallee: unknown): { array: unknown; param: string; body: unknown } | null {
    return _match(isArrowFunctionExpression(filterCallback as Node) && (filterCallback as { params: unknown[] }).params.length > 0)
      .with(true, () => this.filterClosure(filterCallback as ArrowFunctionExpression, innerCallee))
      .with(false, () => null)
      .exec() as { array: unknown; param: string; body: unknown } | null
  }

  private filterClosure(
    filterCallback: ArrowFunctionExpression,
    innerCallee: unknown,
  ): { array: unknown; param: string; body: unknown } | null {
    const param = filterCallback.params[0]
    return _match(!isIdentifier(param))
      .with(true, () => null)
      .with(false, () => ({
        array: (innerCallee as { object: unknown }).object,
        param: (param as { name: string }).name,
        body: filterCallback.body,
      }))
      .exec() as { array: unknown; param: string; body: unknown } | null
  }

  private indexRenames(callback: ArrowFunctionExpression): Record<string, string> {
    const param = callback.params[1]
    return _match(param !== undefined && isIdentifier(param))
      .with(true, () => ({ [(param as { name: string }).name]: 'forloop.index0' }))
      .with(false, () => ({}))
      .exec() as Record<string, string>
  }

  private sliceSuffix(callee: MemberExpression, renames?: Record<string, string>, context?: ParsingContext): string {
    const object = (callee as { object?: unknown }).object
    return _match(this.isSliceCall(object))
      .with(true, () => this.sliceRange(object as { arguments?: unknown[] }, renames, context))
      .with(false, () => '')
      .exec() as string
  }

  private sliceRange(object: { arguments?: unknown[] }, renames?: Record<string, string>, context?: ParsingContext): string {
    const args = object.arguments ?? []
    const startNum = this.readNumeric(args[0])
    const endNum = this.readNumeric(args[1])
    const startArg = args[0]
    const endArg = args[1]
    if (endNum !== null && startNum !== null && endNum <= startNum) return ' limit: 0'
    const limit =
      endNum !== null && startNum !== null
        ? ` limit: ${endNum - startNum}`
        : this.dynamicLimit(endArg, startNum, startArg, renames, context)
    const offset =
      startNum !== null && startNum > 0
        ? ` offset: ${startNum}`
        : startArg && startNum !== 0
          ? ` offset: ${this.liquidVariableParser.generateLiquidCode(startArg as Node, true, undefined, context)}`
          : ''
    return `${limit}${offset}`
  }

  private dynamicLimit(
    endArg: unknown,
    startNum: number | null,
    startArg: unknown,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    return _match(true)
      .with(endArg === null || endArg === undefined, () => (startNum !== null && startNum > 0 ? ` limit: 9999` : ''))
      .with(startNum !== null && startNum > 0, () => {
        const endCode = this.liquidVariableParser.generateLiquidCode(endArg as Node, true, renames, context)
        return _match(context === undefined)
          .with(true, () => ` limit: ${endCode} | minus: ${startNum}`)
          .with(false, () => {
            const parsed = context as ParsingContext
            const temp = parsed.allocateName('limit')
            parsed.addPendingAssign(`{% assign ${temp} = ${endCode} | minus: ${startNum} %}`)
            return ` limit: ${temp}`
          })
          .exec() as string
      })
      .with(startArg !== null && startArg !== undefined, () => {
        const endCode = this.liquidVariableParser.generateLiquidCode(endArg as Node, true, renames, context)
        const startCode = this.liquidVariableParser.generateLiquidCode(startArg as Node, true, renames, context)
        return _match(context === undefined)
          .with(true, () => ` limit: ${endCode} | minus: ${startCode}`)
          .with(false, () => {
            const parsed = context as ParsingContext
            const temp = parsed.allocateName('limit')
            parsed.addPendingAssign(`{% assign ${temp} = ${endCode} | minus: ${startCode} %}`)
            return ` limit: ${temp}`
          })
          .exec() as string
      })
      .with(true, () => ` limit: ${this.liquidVariableParser.generateLiquidCode(endArg as Node, true, renames, context)}`)
      .exec() as string
  }

  private readNumeric(arg: unknown): number | null {
    const num =
      arg !== null && arg !== undefined && typeof arg === 'object' && 'value' in (arg as Record<string, unknown>)
        ? Number((arg as { value: unknown }).value)
        : NaN
    return Number.isFinite(num) && Number.isInteger(num) && num >= 0 ? num : null
  }

  private mapAssignments(callback: ArrowFunctionExpression, context?: ParsingContext): string {
    return _match(isBlockStatement(callback.body))
      .with(true, () => this.blockAssignments(callback, context))
      .with(false, () => this.destructureAssign(callback, context))
      .exec() as string
  }

  private blockAssignments(callback: ArrowFunctionExpression, context?: ParsingContext): string {
    const lines = ((callback.body as BlockStatement).body ?? []).flatMap((stmt) => this.statementLines(stmt, context))
    const body = lines.filter(Boolean).join('\n')
    const tailed = _match(body !== '')
      .with(true, () => `${body}\n`)
      .with(false, () => '')
      .exec() as string
    return `${this.destructureAssign(callback, context)}${tailed}`
  }

  private statementLines(stmt: BlockStatement['body'][number], context?: ParsingContext): string {
    return _match(true)
      .with(isVariableDeclaration(stmt), () =>
        (stmt as VariableDeclaration).declarations
          .map((decl) => this.liquidVariableParser.parseVariableDeclaration(decl, undefined, context).join('\n'))
          .join('\n'),
      )
      .with(isIfStatement(stmt), () => this.liquidVariableParser.parseIfStatement(stmt, undefined, undefined, context).join('\n'))
      .with(true, () => '')
      .exec() as string
  }

  private destructureAssign(callback: ArrowFunctionExpression, context?: ParsingContext): string {
    const param = callback.params[0]
    if (param === undefined || isIdentifier(param)) return ''
    return this.destructureLine(param as LVal, this.paramNameOf(callback.params, 0, 'item'), context)
  }

  private destructureLine(param: LVal, itemName: string, context?: ParsingContext): string {
    const fakeDeclarator = variableDeclarator(param, identifier(itemName))
    return `${this.liquidVariableParser.parseVariableDeclaration(fakeDeclarator, undefined, context).join('\n')}\n`
  }

  private renderFilter(
    expr: CallExpression | OptionalCallExpression,
    callee: MemberExpression,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const callback = expr.arguments[0]
    const arrayName = this.arrayCodeOf((callee as { object: unknown }).object)
    if (!arrayName) throw new ValidationError('Liquid .filter() requires an array target.')
    if (!isArrowFunctionExpression(callback as Node) || (callback as { params: unknown[] }).params.length === 0) {
      throw new ValidationError('Liquid .filter() requires an inline arrow predicate.')
    }
    return this.renderValidFilter(callback as ArrowFunctionExpression, arrayName, renames, context)
  }

  private renderValidFilter(
    callback: ArrowFunctionExpression,
    arrayName: string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const body = callback.body
    const itemName = isIdentifier(callback.params[0]) ? (callback.params[0] as { name: string }).name : 'item'
    return _match(true)
      .with(isBlockStatement(body), () => this.renderFilterBlock(arrayName, itemName, body as BlockStatement, renames, context))
      .with(isConditionalExpression(body) || isLogicalExpression(body), () => {
        const cond = this.liquidVariableParser.generateLiquidCode(body as Node, true, { ...renames, [itemName]: itemName }, context)
        return `{% for ${itemName} in ${arrayName} %}{% if ${cond} %}{{ ${itemName} }}{% endif %}{% endfor %}`
      })
      .with(true, () => this.renderFilterCondition(arrayName, itemName, body, renames, context))
      .exec() as string
  }

  private renderFilterCondition(
    arrayName: string,
    itemName: string,
    body: ArrowFunctionExpression['body'],
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const condition = this.liquidVariableParser.generateLiquidCode(body as Node, true, renames, context)
    return `{% for ${itemName} in ${arrayName} %}{% if ${condition} %}{{ ${itemName} }}{% endif %}{% endfor %}`
  }

  private renderFilterBlock(
    arrayName: string,
    itemName: string,
    body: BlockStatement,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const assignments = (body.body ?? [])
      .map((stmt) => this.filterBlockLine(stmt, itemName, renames, context))
      .filter(Boolean)
      .join('\n')
    return `{% for ${itemName} in ${arrayName} %}${assignments}{% endfor %}`
  }

  private filterBlockLine(
    stmt: BlockStatement['body'][number],
    itemName: string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    if (isVariableDeclaration(stmt)) {
      return (stmt as VariableDeclaration).declarations
        .map((decl) => this.liquidVariableParser.parseVariableDeclaration(decl, renames, context).join('\n'))
        .join('\n')
    }
    if (isIfStatement(stmt)) {
      return this.liquidVariableParser
        .parseIfStatement(stmt, (node, ctx) => this.jsxToHtml(node, renames, ctx), renames, context)
        .join('\n')
    }
    if (isReturnStatement(stmt)) {
      const arg = (stmt as ReturnStatement).argument as Node | null | undefined
      return arg ? this.jsxToHtml(arg, renames, context) : ''
    }
    void itemName
    return ''
  }

  private extractReturnNode(fn: ArrowFunctionExpression): Node | null {
    return _match(isBlockStatement(fn.body))
      .with(true, () => this.blockReturnNode(fn.body as BlockStatement))
      .with(false, () => fn.body as Node)
      .exec() as Node | null
  }

  private blockReturnNode(body: BlockStatement): Node | null {
    const argument = body.body
      .filter((stmt): stmt is ReturnStatement => isReturnStatement(stmt))
      .map((stmt) => stmt.argument)
      .find((arg) => arg !== null && arg !== undefined)
    return (argument ?? null) as Node | null
  }
}
