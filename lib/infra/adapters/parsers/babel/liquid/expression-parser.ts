
import generate from '@babel/generator'
import type { Compiler } from '../../../../../core/protocols/compiler'
import type { ImportResolver } from './import-resolver'
import type { LiquidLoopParser } from './loop-parser'
import { cloneNode, traverseFast, type Node, isBinaryExpression, isMemberExpression, isIdentifier, stringLiteral, isTemplateLiteral, isStringLiteral, isCallExpression, type CallExpression, type TemplateLiteral, type Expression, isParenthesizedExpression, isLogicalExpression, identifier, isArrowFunctionExpression, isObjectPattern, isUnaryExpression, type UnaryExpression } from '@babel/types'

import { ParsingContext } from '../../../../../core/entities/parsing-context'

export class ExpressionParser {

	constructor(
		private readonly compiler: Compiler,
		private readonly importResolver: ImportResolver,
		private readonly loopParser: LiquidLoopParser
	) { }

	public getPendingAssigns(context?: ParsingContext): string {
		return context?.getPendingAssigns() || ''
	}

	public generateLiquidCode(node: Node, inCondition = false, renames?: Record<string, string>, context?: ParsingContext): string {
		if (isTemplateLiteral(node)) {
			return this.transformTemplateLiteralToLiquid(node, context)
		}

		const cloned = cloneNode(node, true)
		traverseFast(cloned, (n) => {
			if (isIdentifier(n) && renames?.[n.name]) {
				n.name = renames[n.name]
				return
			}

			if (isParenthesizedExpression(n)) {
				Object.assign(n, n.expression)
			}

			if (isCallExpression(n)) {
				if (isMemberExpression(n.callee) && isIdentifier(n.callee.property)) {
					const methodName = n.callee.property.name
					if (inCondition && ['toLowerCase', 'toUpperCase', 'trim'].includes(methodName)) {
						const objectCode = generate(n.callee.object).code
						const filter = methodName === 'toLowerCase' ? 'downcase' : methodName === 'toUpperCase' ? 'upcase' : 'strip'
						const varName = `${objectCode.replace(/[^a-zA-Z0-9_]/g, '_')}_${filter}`
						context?.addPendingAssign(`{% assign ${varName} = ${objectCode} | ${filter} %}`)
						Object.assign(n, identifier(varName))
						return
					}

					if (methodName === 'find') {
						const callback = n.arguments[0]
						if (isArrowFunctionExpression(callback) && callback.params.length > 0) {
							const objectCode = generate(n.callee.object).code
							const param = callback.params[0]
							const itemName = isIdentifier(param) ? param.name : isObjectPattern(param) ? 'item' : 'item'
							const varBaseName = objectCode.replace(/[^a-zA-Z0-9_]/g, '_')
							const varName = `${varBaseName}_found`
							const condition = this.generateLiquidCode(callback.body, true, renames, context)

							context?.addPendingAssign(
								`{% assign ${varName} = nil %}\n` +
								`{% for ${itemName} in ${objectCode} %}\n` +
								`  {% if ${condition} %}\n` +
								`    {% assign ${varName} = ${itemName} %}\n` +
								`    {% break %}\n` +
								`  {% endif %}\n` +
								`{% endfor %}`
							)
							Object.assign(n, identifier(varName))
							return
						}
					}
				}
			}

			if (isUnaryExpression(n) && n.operator === '!') {
				const innerCode = this.generateLiquidCode(n.argument, true, renames, context).trim()
				const newCode = `${innerCode} == false`
				Object.assign(n, identifier(newCode))
				return
			}

			if (isBinaryExpression(n)) {
				if (n.operator === '===') (n as any).operator = '=='
				if (n.operator === '!==') (n as any).operator = '!='
			}

			if (isMemberExpression(n)) {
				if (isIdentifier(n.object) && this.importResolver.getCssModules().has(n.object.name) && isIdentifier(n.property)) {
					Object.assign(n, stringLiteral(n.property.name))
				} else if (isIdentifier(n.property, { name: 'length' }) && !n.computed) {
					n.property.name = 'size'
				}
			}
		})
		let code = generate(cloned).code
		try {
			const result = this.compiler.transpileSync(code, { loader: 'ts', format: 'esm', minify: false })
			code = result.code.replace(/;\n$/, '').trim()
		} catch (e) {

		}

		code = code
			.replace(/\s*===\s*/g, ' == ')
			.replace(/\s*!==\s*/g, ' != ')
			.replace(/\s*&&\s*/g, ' and ')
			.replace(/\s*\|\|\s*/g, ' or ')
			.replace(/\.toLowerCase\s*\(\)/g, ' | downcase')
			.replace(/\.toUpperCase\s*\(\)/g, ' | upcase')
			.replace(/\.trim\s*\(\)/g, ' | strip')
			.replace(/\.includes\s*\(([^)]+)\)/g, ' contains $1')
			.trim()

		return code
	}

	public parseExpression(expr: Expression, renames?: Record<string, string>, context?: ParsingContext): string {

		if (isStringLiteral(expr)) {
			if (expr.value.includes('|')) {
				return `{{ ${expr.value} }}`
			}
			return expr.value
		}

		if (this.loopParser.isMapCallExpression(expr)) {
			return this.loopParser.transformMap(expr as CallExpression, renames, context)
		}

		if (isCallExpression(expr) && isMemberExpression(expr.callee) && isIdentifier(expr.callee.object, { name: 'console' })) {
			return `<script>${this.generateLiquidCode(expr, false, renames, context)}</script>`
		}

		if (isUnaryExpression(expr) && expr.operator === '!') {
			const argCode = this.generateLiquidCode(expr.argument, false, renames, context)
			return `{% if ${argCode} %}false{% else %}true{% endif %}`
		}

		const code = this.generateLiquidCode(expr, false, renames, context)
		const assigns = this.getPendingAssigns(context)
		return `${assigns}{{ ${code} }}`
	}

	private transformTemplateLiteralToLiquid(expr: TemplateLiteral, context?: ParsingContext): string {
		if (expr.expressions.length === 0) {
			const raw = expr.quasis.map((q) => q.value.raw).join('')
			if (raw.includes('|')) return raw
			return `"${raw}"`
		}

		let result = expr.quasis[0].value.raw ? `"${expr.quasis[0].value.raw}"` : ''
		const arg = `(?:[a-zA-Z0-9_]+\\s*:\\s*)?(?:'[^']*'|"[^"]*"|[^,'\\"\\s|]+)`
		const regex = new RegExp(`^\\s*\\|\\s*([a-zA-Z0-9_]+(?:\\s*:\\s*${arg}(?:\\s*,\\s*${arg})*)?)`)

		for (let i = 0; i < expr.expressions.length; i++) {
			const base = this.generateLiquidCode(expr.expressions[i], false, undefined, context)
			let quasi = expr.quasis[i + 1].value.raw

			let filters: string[] = []
			let remaining = quasi

			while (true) {
				const match = remaining.match(regex)
				if (!match) break

				let filterStr = match[1].trim()
				filterStr = filterStr.replace(/crop\s*:\s*([^,'"\s]+)/g, (m, val) => {
					if (val === 'center' || val === 'top' || val === 'bottom' || val === 'left' || val === 'right') {
						return `crop: '${val}'`
					}
					return m
				})

				filters.push(filterStr)
				remaining = remaining.substring(match[0].length)
			}

			const filterSuffix = filters.length > 0 ? ` | ${filters.join(' | ')}` : ''

			if (!result) {
				result = `${base}${filterSuffix}`
			} else {
				result += ` | append: ${base}${filterSuffix}`
			}

			if (remaining) {
				result += ` | append: "${remaining}"`
			}
		}

		return result
	}
}
