import { isCallExpression, isMemberExpression, isIdentifier, isArrowFunctionExpression } from '@babel/types'
import { _Maybe, _match } from 'funcio'
import { ValidationError } from '../../../../../core/errors/validation-error'
import generate from '@babel/generator'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

export class FilterCallParser {
  constructor(
    private readonly generateLiquidCode: (
      node: any,
      inCondition?: boolean,
      renames?: Record<string, string>,
      context?: ParsingContext,
    ) => string,
  ) {}

  public isFilterCall(init: any): boolean {
    return (
      isCallExpression(init) &&
      isMemberExpression(init.callee) &&
      isIdentifier(init.callee.property) &&
      (init.callee.property.name === 'filter' || init.callee.property.name === 'find')
    )
  }

  public parseFilterAssign(idName: string, init: any, renames?: Record<string, string>, context?: ParsingContext): string[] {
    const methodName = (init.callee.property as any).name
    const callback = init.arguments[0]
    return _Maybe
      .of(isArrowFunctionExpression(callback) && callback.params.length > 0)
      .map(
        (valid) =>
          _match(valid)
            .with(false, () => [`{% assign ${idName} = ${this.generateLiquidCode(init, false, renames, context)} %}`])
            .with(valid, () => {
              const arrayName = this.generateLiquidCode(init.callee.object, false, renames, context)
              const itemName = isIdentifier(callback.params[0]) ? (callback.params[0] as any).name : 'item'
              const where = this.whereFilter(arrayName, itemName, callback.body)
              return (
                _Maybe
                  .of(where)
                  .map(
                    (filtered) =>
                      _match(methodName)
                        .with('find', () => [`{% assign ${idName} = ${filtered} | first %}`])
                        .with(methodName, () => [`{% assign ${idName} = ${filtered} %}`])
                        .exec() as string[],
                  )
                  .getOrElse(null) ?? this.unsupportedFilter(idName, context)
              )
            })
            .exec() as string[],
      )
      .getOrElse([`{% assign ${idName} = ${this.generateLiquidCode(init, false, renames, context)} %}`])
  }

  private whereFilter(arrayName: string, itemName: string, body: any): string | null {
    return _match(true)
      .with(
        isMemberExpression(body) && isIdentifier((body as any).object, { name: itemName }),
        () => `${arrayName} | where: "${(body.property as any).name ?? (body.property as any).value}"`,
      )
      .with(
        body?.type === 'BinaryExpression' &&
          (body.operator === '==' || (body.operator === '===' && true)) &&
          body.left?.type === 'MemberExpression' &&
          body.left?.object?.name === itemName,
        () => `${arrayName} | where: "${body.left.property.name ?? body.left.property.value}", ${generate(body.right).code}`,
      )
      .with(true, () => null)
      .exec() as string | null
  }

  private unsupportedFilter(idName: string, context?: ParsingContext): string[] {
    throw new ValidationError(
      `Unsupported filter assignment for "${idName}": only member and equality predicates compile to where filters.`,
      context?.currentFilePath,
    )
  }
}
