import {
  isIdentifier,
  isObjectPattern,
  isArrayPattern,
  isTemplateLiteral,
  isConditionalExpression,
  isLogicalExpression,
  isAssignmentPattern,
  isRestElement,
  type VariableDeclarator,
  type ArrayPattern,
  type Identifier,
  type Node,
} from '@babel/types'
import { _Object, _match } from 'funcio'
import { hoistPipedArg } from './pipe-guard'
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
    const id = _Object.getPathValue(['id'], declaration)
    const init = _Object.getPathValue(['init'], declaration)
    return _match(true)
      .with(id === null || id === undefined, () => [] as string[])
      .with(init === null || init === undefined, () => this.parseWithoutInit(id))
      .with(true, () => this.dispatchDeclaration(id, init, renames, context))
      .exec() as string[]
  }

  private parseWithoutInit(id: unknown): string[] {
    return _match(isIdentifier(id as Node))
      .with(true, () => [`{% assign ${(id as Identifier).name} = nil %}`])
      .with(false, () => [] as string[])
      .exec() as string[]
  }

  private dispatchDeclaration(id: any, init: any, renames?: Record<string, string>, context?: ParsingContext): string[] {
    const idNode = id as Node
    return _match(true)
      .with(isIdentifier(idNode) && isTemplateLiteral(init) && init.expressions.length === 0, () => [
        this.assignConstant(id.name, init.quasis[0].value.raw),
      ])
      .with(isIdentifier(idNode) && isConditionalExpression(init), () =>
        this.conditionalParser.parseConditionalExpressionRecursive(id.name, init, renames, context),
      )
      .with(isIdentifier(idNode) && isLogicalExpression(init) && init.operator === '||', () =>
        this.fallbackParser.parseOrFallback(id.name, init, renames, context),
      )
      .with(isIdentifier(idNode) && isLogicalExpression(init) && init.operator === '??', () =>
        this.fallbackParser.parseNilFallback(id.name, init, renames, context),
      )
      .with(isIdentifier(idNode) && this.filterCallParser.isFilterCall(init), () =>
        this.filterCallParser.parseFilterAssign(id.name, init, renames, context),
      )
      .with(isIdentifier(idNode), () => [`{% assign ${id.name} = ${this.generateLiquidCode(init, false, renames, context)} %}`])
      .with(isObjectPattern(idNode), () => this.objectPatternParser.flatten(id, this.generateLiquidCode(init, false, renames, context)))
      .with(isArrayPattern(idNode), () =>
        this.flattenArrayPattern(id as ArrayPattern, this.generateLiquidCode(init, false, renames, context), context),
      )
      .with(true, () => [])
      .exec() as string[]
  }

  private flattenArrayPattern(pattern: ArrayPattern, basePath: string, context?: ParsingContext): string[] {
    let index = 0
    const lines: string[] = []
    const base = hoistPipedArg(basePath, 'array', context)
    for (const element of pattern.elements) {
      const el = element as Node | null
      _match(true)
        .with(el === null || el === undefined, () => {
          index += 1
        })
        .with(isIdentifier(el), () => {
          lines.push(`{% assign ${(el as Identifier).name} = ${base}[${index}] %}`)
          index += 1
        })
        .with(isAssignmentPattern(el), () => {
          const left = (el as { left: unknown }).left
          const right = (el as { right: unknown }).right
          _match(isIdentifier(left as Node))
            .with(true, () =>
              lines.push(`{% assign ${(left as Identifier).name} = ${base}[${index}] | default: ${this.literalOf(right)} %}`),
            )
            .with(false, () => undefined)
            .exec()
          index += 1
        })
        .with(isRestElement(el), () => {
          const arg = (el as { argument: unknown }).argument
          _match(isIdentifier(arg as Node))
            .with(true, () => lines.push(`{% assign ${(arg as Identifier).name} = ${base} | slice: ${index}, ${base}.size %}`))
            .with(false, () => undefined)
            .exec()
          index += 1
        })
        .with(true, () => {
          index += 1
        })
        .exec()
    }
    return lines
  }

  private literalOf(node: unknown): string {
    const value = (node as { value?: unknown; name?: string }).value
    return _match(typeof value !== 'undefined')
      .with(true, () => JSON.stringify(value))
      .with(false, () => (node as { name?: string }).name ?? 'nil')
      .exec() as string
  }

  private assignConstant(name: string, raw: string): string {
    return `{% assign ${name} = ${JSON.stringify(raw)} %}`
  }
}
