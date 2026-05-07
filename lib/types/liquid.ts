
export interface JSXResult {
	html: string
	blocksSchema: { type: string }[]
	scriptAssets?: string[]
}

export type ReactComponentConfig = {
	rootId: string
	script: string
	scriptAssets?: string[]
	mode?: string
}

export interface JSXToLiquidConfig {
	dynamicBlockTag?: string
	renderSnippetTag?: string
	renderSvgTag?: string
}

import { ParsingContext } from '../core/entities/parsing-context'

export interface ILiquidExpressionParser {
	generateLiquidCode(node: any, inCondition?: boolean, renames?: Record<string, string>, context?: ParsingContext): string
	parseExpression(node: any, renames?: Record<string, string>, context?: ParsingContext): string
}
