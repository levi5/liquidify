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

import type { Node, Expression } from '@babel/types'
import { ParsingContext } from '../core/entities/parsing-context'

export interface ILiquidExpressionParser {
  generateLiquidCode(node: Node, inCondition?: boolean, renames?: Record<string, string>, context?: ParsingContext): string
  parseExpression(node: Expression, renames?: Record<string, string>, context?: ParsingContext): string
}
