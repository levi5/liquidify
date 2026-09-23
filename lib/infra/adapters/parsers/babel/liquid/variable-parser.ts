import type { ParsingContext } from '../../../../../core/entities/parsing-context'
import { VariableDeclarationParser } from './variable-declaration-parser'
import { FilterCallParser } from './filter-call-parser'
import { FallbackParser } from './fallback-parser'
import { ConditionalDeclarationParser } from './conditional-declaration-parser'
import { ObjectPatternParser } from './object-pattern-parser'
import { AssignmentExtractor } from './assignment-extractor'

export class LiquidVariableParser {
  private readonly filterCallParser: FilterCallParser
  private readonly fallbackParser: FallbackParser
  private readonly conditionalParser: ConditionalDeclarationParser
  private readonly objectPatternParser: ObjectPatternParser
  private readonly variableDeclarationParser: VariableDeclarationParser
  private readonly assignmentExtractor: AssignmentExtractor

  public get parseExpression(): ((node: any, renames?: Record<string, string>, context?: ParsingContext) => string) | undefined {
    return this.assignmentExtractor.parseExpression
  }

  public set parseExpression(fn: ((node: any, renames?: Record<string, string>, context?: ParsingContext) => string) | undefined) {
    this.assignmentExtractor.parseExpression = fn
  }

  constructor(
    public generateLiquidCode: (node: any, inCondition?: boolean, renames?: Record<string, string>, context?: ParsingContext) => string,
  ) {
    this.filterCallParser = new FilterCallParser(generateLiquidCode)
    this.fallbackParser = new FallbackParser(generateLiquidCode)
    this.conditionalParser = new ConditionalDeclarationParser(generateLiquidCode)
    this.objectPatternParser = new ObjectPatternParser()
    this.variableDeclarationParser = new VariableDeclarationParser(
      generateLiquidCode,
      this.filterCallParser,
      this.fallbackParser,
      this.conditionalParser,
      this.objectPatternParser,
    )
    this.assignmentExtractor = new AssignmentExtractor(generateLiquidCode)
  }

  public parseVariableDeclaration(declaration: any, renames?: Record<string, string>, context?: ParsingContext): string[] {
    return this.variableDeclarationParser.parse(declaration, renames, context)
  }

  public parseIfStatement(
    statement: any,
    onReturn?: (node: any, context?: ParsingContext) => string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    return this.assignmentExtractor.parseIfStatement(statement, onReturn, renames, context)
  }

  public extractAssignments(
    node: any,
    onReturn?: (node: any, context?: ParsingContext) => string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    return this.assignmentExtractor.extract(node, onReturn, renames, context)
  }
}
