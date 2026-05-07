import { type ConditionalExpression, type LogicalExpression, type Node } from '@babel/types'
import { ParsingContext } from '../../../../../core/entities/parsing-context'

export class LiquidConditionalParser {
	constructor(
		private jsxToHtml: (node: any, renames?: Record<string, string>, context?: ParsingContext) => string,
		private generateLiquidCode: (node: Node, inCondition?: boolean, renames?: Record<string, string>, context?: ParsingContext) => string,
		private getAssigns: (context?: ParsingContext) => string,
	) { }

	public parseLogicalExpression(node: LogicalExpression, renames?: Record<string, string>, context?: ParsingContext): string | null {
		if (node.operator === '&&') {
			const condition = this.generateLiquidCode(node.left, true, renames, context)
			const assigns = this.getAssigns(context)
			return `${assigns}{% if ${condition} %}\n${this.jsxToHtml(node.right as any, renames, context)}\n{% endif %}`
		} else if (node.operator === '||') {
			const condition = this.generateLiquidCode(node.left, true, renames, context)
			const assigns = this.getAssigns(context)
			return `${assigns}{% if ${condition} %}\n${this.jsxToHtml(node.left as any, renames, context)}\n{% else %}\n${this.jsxToHtml(node.right as any, renames, context)}\n{% endif %}`
		}
		return null
	}

	public parseConditionalExpression(node: ConditionalExpression, renames?: Record<string, string>, context?: ParsingContext): string {
		const condition = this.generateLiquidCode(node.test, true, renames, context)
		const assigns = this.getAssigns(context)
		return `${assigns}{% if ${condition} %}\n${this.jsxToHtml(node.consequent as any, renames, context)}\n{% else %}\n${this.jsxToHtml(node.alternate as any, renames, context)}\n{% endif %}`
	}
}
