import { isCallExpression, isMemberExpression, isIdentifier, isArrowFunctionExpression, type Node } from '@babel/types'
import { _match } from 'funcio'
import { ValidationError } from '../../../../../core/errors/validation-error'
import generate from '@babel/generator'
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
      .with(true, () => this.assignFiltered(idName, call, callback as { params: unknown[]; body: unknown }, renames, context))
      .with(false, () => [this.assignRaw(idName, init, renames, context)])
      .exec() as string[]
  }

  private assignRaw(idName: string, init: unknown, renames?: Record<string, string>, context?: ParsingContext): string {
    return `{% assign ${idName} = ${this.generateLiquidCode(init, false, renames, context)} %}`
  }

  private assignFiltered(
    idName: string,
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
    const where = this.whereFilter(arrayName, itemName, callback.body)
    return _match(where === null)
      .with(true, () => this.unsupportedFilter(idName, context))
      .with(false, () => this.filteredAssign(idName, call.callee.property.name, where as string))
      .exec() as string[]
  }

  private filteredAssign(idName: string, methodName: string, filtered: string): string[] {
    return _match(methodName === 'find')
      .with(true, () => [`{% assign ${idName} = ${filtered} | first %}`])
      .with(false, () => [`{% assign ${idName} = ${filtered} %}`])
      .exec() as string[]
  }

  private whereFilter(arrayName: string, itemName: string, body: unknown): string | null {
    return _match(true)
      .with(this.isMemberAccess(body, itemName), () => `${arrayName} | where: "${this.memberName(body)}"`)
      .with(
        this.isEqualityCheck(body, itemName),
        () => `${arrayName} | where: "${this.equalityProp(body)}", ${generate(this.equalityValue(body))}`,
      )
      .with(true, () => null)
      .exec() as string | null
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

  private unsupportedFilter(idName: string, context?: ParsingContext): string[] {
    throw new ValidationError(
      `Unsupported filter assignment for "${idName}": only member and equality predicates compile to where filters.`,
      context?.currentFilePath,
    )
  }
}
