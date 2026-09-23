import {
  isIdentifier,
  isObjectPattern,
  isTemplateLiteral,
  isConditionalExpression,
  isLogicalExpression,
  type VariableDeclarator,
} from '@babel/types'
import { _Maybe, _Object, _match } from 'funcio'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'
import type { FilterCallParser } from './filter-call-parser'
import type { FallbackParser } from './fallback-parser'
import type { ConditionalDeclarationParser } from './conditional-declaration-parser'
import type { ObjectPatternParser } from './object-pattern-parser'

export class VariableDeclarationParser {
  constructor(
    private readonly generateLiquidCode: (
      node: any,
      inCondition?: boolean,
      renames?: Record<string, string>,
      context?: ParsingContext,
    ) => string,
    private readonly filterCallParser: FilterCallParser,
    private readonly fallbackParser: FallbackParser,
    private readonly conditionalParser: ConditionalDeclarationParser,
    private readonly objectPatternParser: ObjectPatternParser,
  ) {}

  public parse(declaration: VariableDeclarator, renames?: Record<string, string>, context?: ParsingContext): string[] {
    const id = _Maybe
      .of(_Object.getPathValue(['id'], declaration))
      .map((value) => value)
      .getOrElse(null)
    const init = _Maybe
      .of(_Object.getPathValue(['init'], declaration))
      .map((value) => value)
      .getOrElse(null)
    return _Maybe
      .of(!id || !init)
      .map((missing) => (missing ? [] : this.dispatchDeclaration(id, init, renames, context)))
      .getOrElse([])
  }

  private dispatchDeclaration(id: any, init: any, renames?: Record<string, string>, context?: ParsingContext): string[] {
    return _match(true)
      .with(isIdentifier(id) && isTemplateLiteral(init) && init.expressions.length === 0, () => [
        this.assignConstant(id.name, init.quasis[0].value.raw),
      ])
      .with(isIdentifier(id) && isConditionalExpression(init), () =>
        this.conditionalParser.parseConditionalExpressionRecursive(id.name, init, renames, context),
      )
      .with(isIdentifier(id) && isLogicalExpression(init) && init.operator === '||', () =>
        this.fallbackParser.parseOrFallback(id.name, init, renames, context),
      )
      .with(isIdentifier(id) && isLogicalExpression(init) && init.operator === '??', () =>
        this.fallbackParser.parseNilFallback(id.name, init, renames, context),
      )
      .with(isIdentifier(id) && this.filterCallParser.isFilterCall(init), () =>
        this.filterCallParser.parseFilterAssign(id.name, init, renames, context),
      )
      .with(isIdentifier(id), () => [`{% assign ${id.name} = ${this.generateLiquidCode(init, false, renames, context)} %}`])
      .with(isObjectPattern(id), () => this.objectPatternParser.flatten(id, this.generateLiquidCode(init, false, renames, context)))
      .with(true, () => [])
      .exec() as string[]
  }

  private assignConstant(name: string, raw: string): string {
    return `{% assign ${name} = ${JSON.stringify(raw)} %}`
  }
}
