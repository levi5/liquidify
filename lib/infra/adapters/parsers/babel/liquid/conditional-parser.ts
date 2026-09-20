import type { ConditionalExpression, LogicalExpression, Node } from '@babel/types'
import { _match } from 'funcio'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'
import { escapedOutput, liquidJsonOutput } from '../../../../../shared/html'

export class LiquidConditionalParser {
  constructor(
    private jsxToHtml: (node: any, renames?: Record<string, string>, context?: ParsingContext) => string,
    private generateLiquidCode: (node: Node, inCondition?: boolean, renames?: Record<string, string>, context?: ParsingContext) => string,
    private getAssigns: (context?: ParsingContext) => string,
  ) {}

  public parseLogicalExpression(node: LogicalExpression, renames?: Record<string, string>, context?: ParsingContext): string | null {
    return _match(node.operator)
      .with('&&', () => {
        const condition = this.generateLiquidCode(node.left, true, renames, context)
        return `${this.getAssigns(context)}{% if ${condition} %}\n${this.jsxToHtml(node.right as any, renames, context)}\n{% endif %}`
      })
      .with('||', () => {
        const condition = this.generateLiquidCode(node.left, true, renames, context)
        return `${this.getAssigns(context)}{% if ${condition} %}\n${this.jsxToHtml(node.left as any, renames, context)}\n{% else %}\n${this.jsxToHtml(node.right as any, renames, context)}\n{% endif %}`
      })
      .with('??', () => {
        const condition = this.generateLiquidCode(node.left, false, renames, context)
        const left = this.outputOf(node.left, renames, context)
        const right = this.outputOf(node.right, renames, context)
        return `${this.getAssigns(context)}{% if ${condition} != nil %}\n${left}\n{% else %}\n${right}\n{% endif %}`
      })
      .with(node.operator, () => null)
      .exec() as string | null
  }

  private outputOf(node: any, renames?: Record<string, string>, context?: ParsingContext): string {
    return _match(context?.outputContext)
      .with('raw', () => `{{ ${this.generateLiquidCode(node, false, renames, context)} }}`)
      .with('json', () => liquidJsonOutput(this.generateLiquidCode(node, false, renames, context)))
      .with(context?.outputContext, () => escapedOutput(this.generateLiquidCode(node, false, renames, context)))
      .exec() as string
  }

  public parseConditionalExpression(node: ConditionalExpression, renames?: Record<string, string>, context?: ParsingContext): string {
    const condition = this.generateLiquidCode(node.test, true, renames, context)
    return `${this.getAssigns(context)}{% if ${condition} %}\n${this.jsxToHtml(node.consequent as any, renames, context)}\n{% else %}\n${this.jsxToHtml(node.alternate as any, renames, context)}\n{% endif %}`
  }
}
