import {
	isReturnStatement,
	isJSXElement,
	isJSXFragment,
	isLogicalExpression,
	isConditionalExpression,
	isVariableDeclaration,
	Statement,
	isDirective,
	isExpressionStatement,
	isStringLiteral,
	isIfStatement,
	isArrowFunctionExpression,
	isFunctionExpression,
} from '@babel/types'
import generate from '@babel/generator'
import { ComponentMetadataType } from '../../../../../types/component'

import { LiquidVariableParser } from '../liquid/variable-parser'

export class StatementCollector {
	private liquidVariableParser = new LiquidVariableParser((node: any) => {
		return generate(node)
			.code.replace(/\s*===\s*/g, ' == ')
			.replace(/\s*!==\s*/g, ' != ')
			.replace(/\.toLowerCase\s*\(\)\s*/g, ' | downcase ')
			.replace(/\.toUpperCase\s*\(\)\s*/g, ' | upcase ')
			.trim()
	})

	public collect(statements: Statement[], metadata: ComponentMetadataType): void {
		this.collectDirectives(statements, metadata)

		for (const statement of statements) {
			if (this.handleReturnStatement(statement, metadata)) continue
			if (this.handleLiquidAssignments(statement, metadata)) continue

			metadata.scriptStatements.push(statement)
		}
	}

	private collectDirectives(statements: Statement[], metadata: ComponentMetadataType): void {
		for (const statement of statements) {
			const value = this.getDirectiveValue(statement)
			if (!value) continue

			if (value.match(/^use\s+(dom(:global)?|script)$/)) {
				metadata.hasUseScript = true
				const isGlobal = value === 'use dom:global' || value.includes('script')
				if (metadata.mode !== 'react') metadata.mode = isGlobal ? 'dom:global' : 'dom'
			} else if (value.match(/^use react/)) {
				metadata.hasUseScript = true
				metadata.mode = 'react'
			}
		}
	}

	private getDirectiveValue(statement: Statement): string | null {
		if (isDirective(statement as any)) return (statement as any).value.value
		if (isExpressionStatement(statement) && isStringLiteral(statement.expression)) return statement.expression.value
		return null
	}

	private handleReturnStatement(statement: Statement, metadata: ComponentMetadataType): boolean {
		if (!isReturnStatement(statement)) return false

		const arg = statement.argument
		const isJsx = arg && (isJSXElement(arg) || isJSXFragment(arg) || isLogicalExpression(arg) || isConditionalExpression(arg))

		if (isJsx) {
			metadata.jsxElement = arg as any
		}

		return true
	}

	private isJsxReturningFunction(node: any): any {
		if (isArrowFunctionExpression(node) || isFunctionExpression(node)) {
			if (isJSXElement(node.body) || isJSXFragment(node.body) || isLogicalExpression(node.body) || isConditionalExpression(node.body)) {
				return node.body
			}
			if (node.body.type === 'BlockStatement') {
				const returnStmt = node.body.body.find((stmt: any) => isReturnStatement(stmt))
				if (returnStmt) {
					const arg = (returnStmt as any).argument
					if (isJSXElement(arg) || isJSXFragment(arg) || isLogicalExpression(arg) || isConditionalExpression(arg)) {
						return arg
					}
				}
			}
		}
		return null
	}

	private handleLiquidAssignments(statement: Statement, metadata: ComponentMetadataType): boolean {
		if (metadata.mode === 'react' || metadata.mode === 'dom' || metadata.mode === 'dom:global') return false

		if (isVariableDeclaration(statement)) {
			let handledAll = true
			for (const decl of statement.declarations) {
				if (decl.id.type === 'Identifier') {
					const jsxBody = this.isJsxReturningFunction(decl.init)
					if (jsxBody) {
						metadata.inlineComponents?.set(decl.id.name, jsxBody)
						continue
					}
				}
				metadata.liquidAssignments.push(...this.liquidVariableParser.parseVariableDeclaration(decl))
				handledAll = false
			}
			return true
		}

		if (isIfStatement(statement)) {
			metadata.liquidAssignments.push(...this.liquidVariableParser.parseIfStatement(statement))
			return true
		}

		return false
	}
}
