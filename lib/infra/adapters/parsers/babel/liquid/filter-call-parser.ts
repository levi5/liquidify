import { isCallExpression, isMemberExpression, isIdentifier, isArrowFunctionExpression, type Node } from '@babel/types'
import { _match } from 'funcio'
import { ValidationError } from '../../../../../core/errors/validation-error'
import { hoistLogicalOperators } from './pipe-guard'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

export class FilterCallParser {
  constructor(
    private readonly generateLiquidCode: (
      node: unknown,
      inCondition?: boolean,
      renames?: Record<string, string>,
      context?: ParsingContext,
    ) => string,
  ) {}

  public isFilterCall(init: unknown): boolean {
    const callee = (init as { callee?: unknown }).callee
    return (
      isCallExpression(init as Node) &&
      isMemberExpression(callee as Node) &&
      isIdentifier((callee as { property?: unknown }).property as Node) &&
      ['filter', 'find'].includes(((callee as { property: { name: string } }).property as { name: string }).name)
    )
  }

  public parseFilterAssign(idName: string, init: unknown, renames?: Record<string, string>, context?: ParsingContext): string[] {
    const call = init as { callee: { object: unknown; property: { name: string } }; arguments: unknown[] }
    const callback = call.arguments[0]
    return _match(isArrowFunctionExpression(callback as Node) && (callback as { params: unknown[] }).params.length > 0)
      .with(true, () => this.assignFiltered(idName, init, call, callback as { params: unknown[]; body: unknown }, renames, context))
      .with(false, () => this.unsupportedFilter(idName, init, context))
      .exec() as string[]
  }

  private assignFiltered(
    idName: string,
    init: unknown,
    call: { callee: { object: unknown; property: { name: string } }; arguments: unknown[] },
    callback: { params: unknown[]; body: unknown },
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    const arrayName = this.generateLiquidCode(call.callee.object, false, renames, context)
    const itemName = _match(isIdentifier(callback.params[0] as Node))
      .with(true, () => (callback.params[0] as { name: string }).name)
      .with(false, () => 'item')
      .exec() as string
    const predicate = this.predicateBody(callback.body)
    const where = this.whereFilter(arrayName, itemName, predicate, renames, context)
    return _match(where === null)
      .with(true, () => this.unsupportedFilter(idName, init, context))
      .with(false, () => this.filteredAssign(idName, call.callee.property.name, where as string))
      .exec() as string[]
  }

  private predicateBody(body: unknown): unknown {
    const node = body as { type?: string; body?: Array<{ type?: string; argument?: unknown }> }
    return _match(node.type === 'BlockStatement' && (node.body ?? []).length === 1 && node.body?.[0].type === 'ReturnStatement')
      .with(true, () => (node.body as Array<{ argument: unknown }>)[0].argument)
      .with(false, () => body)
      .exec()
  }

  private filteredAssign(idName: string, methodName: string, filtered: string): string[] {
    return _match(methodName === 'find')
      .with(true, () => [`{% assign ${idName} = ${filtered} | first %}`])
      .with(false, () => [`{% assign ${idName} = ${filtered} %}`])
      .exec() as string[]
  }

  private whereFilter(
    arrayName: string,
    itemName: string,
    body: unknown,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string | null {
    return _match(true)
      .with(this.isMemberAccess(body, itemName), () => `${arrayName} | where: "${this.memberName(body)}"`)
      .with(
        this.isEqualityCheck(body, itemName),
        () => {
          const value = this.generateLiquidCode(this.equalityValue(body), false, renames, context)
          return `${arrayName} | where: "${this.equalityProp(body)}", ${hoistLogicalOperators(value, 'where', context)}`
        },
      )
      .with(
        this.isNegationOfMember(body, itemName),
        () =>
          `${arrayName} | where_exp: "${itemName}", "${itemName}.${this.negatedMember(body, itemName)} == nil or ${itemName}.${this.negatedMember(body, itemName)} == false or ${itemName}.${this.negatedMember(body, itemName)} == 0 or ${itemName}.${this.negatedMember(body, itemName)} == """`,
      )
      .with(this.isComparison(body, itemName), () => this.comparisonFilter(arrayName, itemName, body, renames, context))
      .with(this.isSupportedWhereExp(body), () => this.whereExpFilter(arrayName, itemName, body, renames, context))
      .with(true, () => null)
      .exec() as string | null
  }

  private isNegationOfMember(body: unknown, itemName: string): boolean {
    const node = body as { type?: string; operator?: string; argument?: { type?: string; object?: { name?: string } } }
    return (
      node.type === 'UnaryExpression' &&
      node.operator === '!' &&
      node.argument?.type === 'MemberExpression' &&
      node.argument?.object?.name === itemName
    )
  }

  private negatedMember(body: unknown, _itemName: string): string {
    const arg = (body as { argument: { property: { name?: string; value?: string } } }).argument
    return arg.property.name ?? arg.property.value ?? ''
  }

  private isComparison(body: unknown, itemName: string): boolean {
    const node = body as { type?: string; operator?: string; left?: { type?: string; object?: { name?: string } } }
    return (
      node.type === 'BinaryExpression' &&
      ['>', '<', '>=', '<=', '!=', '!=='].includes(node.operator ?? '') &&
      node.left?.type === 'MemberExpression' &&
      node.left?.object?.name === itemName
    )
  }

  private comparisonFilter(
    arrayName: string,
    itemName: string,
    body: unknown,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const condition = this.generateLiquidCode(this.rewriteStrict(body), true, { ...renames, [itemName]: itemName }, context)
    return `${arrayName} | where_exp: "${itemName}", "${condition.replace(/"/g, "'")}"`
  }

  private rewriteStrict(body: unknown): unknown {
    const node = body as { operator?: string }
    _match(node.operator === '===')
      .with(true, () => {
        node.operator = '=='
      })
      .with(false, () => undefined)
      .exec()
    _match(node.operator === '!==')
      .with(true, () => {
        node.operator = '!='
      })
      .with(false, () => undefined)
      .exec()
    return body
  }

  private isSupportedWhereExp(body: unknown): boolean {
    const node = body as { type?: string }
    return ['LogicalExpression', 'CallExpression', 'UnaryExpression', 'BinaryExpression'].includes(node.type ?? '')
  }

  private whereExpFilter(
    arrayName: string,
    itemName: string,
    body: unknown,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string {
    const condition = this.generateLiquidCode(this.rewriteStrict(body), true, { ...renames, [itemName]: itemName }, context)
    return `${arrayName} | where_exp: "${itemName}", "${condition.replace(/"/g, "'")}"`
  }

  private isMemberAccess(body: unknown, itemName: string): boolean {
    const node = body as { object?: unknown }
    return isMemberExpression(body as Node) && isIdentifier(node.object as Node, { name: itemName })
  }

  private memberName(body: unknown): string {
    const property = (body as { property: { name?: string; value?: string } }).property
    return property.name ?? property.value ?? ''
  }

  private isEqualityCheck(body: unknown, itemName: string): boolean {
    const node = body as {
      type?: string
      operator?: string
      left?: { type?: string; object?: { name?: string }; property?: { name?: string; value?: string } }
    }
    return (
      node.type === 'BinaryExpression' &&
      (node.operator === '==' || node.operator === '===') &&
      node.left?.type === 'MemberExpression' &&
      node.left?.object?.name === itemName
    )
  }

  private equalityProp(body: unknown): string {
    const property = (body as { left: { property: { name?: string; value?: string } } }).left.property
    return property.name ?? property.value ?? ''
  }

  private equalityValue(body: unknown): Node {
    return (body as { right: Node }).right
  }

  private unsupportedFilter(idName: string, init: unknown, context?: ParsingContext): string[] {
    throw new ValidationError(
      `Unsupported filter assignment for "${idName}": use member access (p => p.available), equality (p => p.type == "x"), comparisons (p => p.price > 10), negation (!p.draft) or && / || combinations, which compile to where / where_exp filters.`,
      context?.currentFilePath,
      this.locationOf(init),
    )
  }

  private locationOf(node: unknown): { line: number; column: number } | undefined {
    const loc = (node as { loc?: { start: { line: number; column: number } } }).loc
    return loc === undefined ? undefined : { line: loc.start.line, column: loc.start.column + 1 }
  }
}
