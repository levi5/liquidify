import type { ConditionalExpression, LogicalExpression, Node } from '@babel/types'
import { _match } from 'funcio'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'
import { escapedOutput, liquidJsonOutput } from '../../../../../shared/html'
import { truthyTest } from './condition'

export class LiquidConditionalParser {
  constructor(
    private readonly jsxToHtml: (node: Node, renames?: Record<string, string>, context?: ParsingContext) => string,
    private readonly generateLiquidCode: (
      node: Node,
      inCondition?: boolean,
      renames?: Record<string, string>,
      context?: ParsingContext,
    ) => string,
    private readonly getAssigns: (context?: ParsingContext) => string,
  ) {}

  public parseLogicalExpression(node: LogicalExpression, renames?: Record<string, string>, context?: ParsingContext): string | null {
    return _match(node.operator)
      .with('&&', () => this.renderAnd(node, renames, context))
      .with('||', () => this.renderOr(node, renames, context))
      .with('??', () => this.renderNilCoalescing(node, renames, context))
      .with(node.operator, () => null)
      .exec() as string | null
  }

  private renderAnd(node: LogicalExpression, renames?: Record<string, string>, context?: ParsingContext): string {
    const condition = truthyTest(node.left, this.generateLiquidCode(node.left, true, renames, context))
    return `${this.getAssigns(context)}{% if ${condition} %}\n${this.jsxToHtml(node.right, renames, context)}\n{% endif %}`
  }

  private renderOr(node: LogicalExpression, renames?: Record<string, string>, context?: ParsingContext): string {
    const condition = truthyTest(node.left, this.generateLiquidCode(node.left, true, renames, context))
    return `${this.getAssigns(context)}{% if ${condition} %}\n${this.jsxToHtml(node.left, renames, context)}\n{% else %}\n${this.jsxToHtml(node.right, renames, context)}\n{% endif %}`
  }

  private renderNilCoalescing(node: LogicalExpression, renames?: Record<string, string>, context?: ParsingContext): string {
    const condition = this.generateLiquidCode(node.left, false, renames, context)
    const left = this.outputOf(node.left, renames, context)
    const right = this.outputOf(node.right, renames, context)
    return `${this.getAssigns(context)}{% if ${condition} != nil %}\n${left}\n{% else %}\n${right}\n{% endif %}`
  }

  private outputOf(node: Node, renames?: Record<string, string>, context?: ParsingContext): string {
    const code = this.generateLiquidCode(node, false, renames, context)
    return _match(this.outputContextOf(context))
      .with('raw', () => `{{ ${code} }}`)
      .with('json', () => liquidJsonOutput(code))
      .with('text', () => escapedOutput(code))
      .with(this.outputContextOf(context), () => escapedOutput(code))
      .exec() as string
  }

  private outputContextOf(context?: ParsingContext): string {
    return _match(context === undefined || context.outputContext === undefined)
      .with(true, () => 'text')
      .with(false, () => (context as ParsingContext).outputContext as string)
      .exec() as string
  }

  public parseConditionalExpression(node: ConditionalExpression, renames?: Record<string, string>, context?: ParsingContext): string {
    const condition = truthyTest(node.test, this.generateLiquidCode(node.test, true, renames, context))
    return `${this.getAssigns(context)}{% if ${condition} %}\n${this.jsxToHtml(node.consequent, renames, context)}\n{% else %}\n${this.jsxToHtml(node.alternate, renames, context)}\n{% endif %}`
  }
}
