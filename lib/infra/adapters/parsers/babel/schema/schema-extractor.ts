import traverse from '@babel/traverse'
import {
	isArrayExpression,
	isBooleanLiteral,
	isIdentifier,
	isNumericLiteral,
	isObjectExpression,
	isObjectProperty,
	isStringLiteral,
	isVariableDeclaration,
	isVariableDeclarator,
	isSpreadElement,
	type Node,
	type File,
} from '@babel/types'

import { parse } from '@babel/parser'
import * as path from 'path'
import type { IFileSystem } from '../../../../../core/protocols/file-system'
import { NodeFileSystem } from '../../../fs/node-file-system'

type Schema = Record<string, unknown>

interface ImportMapValue {
	source: string
	specifierName: string
	isDefault: boolean
}

export class SchemaExtractor {
	private readonly allowedExtensions = ['.ts', '.tsx', '.js', '.jsx']

	private localDecls = new Map<string, Node>()
	private currentImports = new Map<string, ImportMapValue>()
	private currentFilePath?: string
	private visitedIdentifiers = new Set<string>()

	constructor(private readonly fs: IFileSystem = new NodeFileSystem()) { }

	public extract(ast: File, currentFilePath?: string): Schema {
		this.currentFilePath = currentFilePath
		this.currentImports = this.collectImports(ast)
		this.localDecls = this.collectLocalDecls(ast)
		this.visitedIdentifiers.clear()

		let schema: Schema | null = null

		traverse(ast, {
			ExportDefaultDeclaration: (path) => {
				schema = this.extractFromNode(path.node.declaration) || schema
			},

			VariableDeclaration: (path) => {
				schema = this.extractFromVariable(path.node) || schema
			},

			AssignmentExpression: (path) => {
				schema = this.extractFromAssignment(path.node.right) || schema
			},
		})

		return (schema as any) ?? {}
	}

	private collectImports(ast: File): Map<string, ImportMapValue> {
		const imports = new Map<string, ImportMapValue>()

		traverse(ast, {
			ImportDeclaration: (path) => {
				const source = path.node.source.value

				for (const spec of path.node.specifiers) {
					if (spec.type === 'ImportSpecifier') {
						const importedName = isIdentifier(spec.imported) ? spec.imported.name : spec.imported.value
						imports.set(spec.local.name, { source, specifierName: importedName, isDefault: false })
					}

					if (spec.type === 'ImportDefaultSpecifier') {
						imports.set(spec.local.name, { source, specifierName: 'default', isDefault: true })
					}
				}
			},
		})

		return imports
	}

	private collectLocalDecls(ast: File): Map<string, Node> {
		const decls = new Map<string, Node>()

		for (const node of ast.program.body) {
			const declaration = this.getDeclarationFromNode(node)
			if (!declaration) continue

			for (const decl of declaration.declarations) {
				if (isIdentifier(decl.id) && decl.init) {
					decls.set(decl.id.name, decl.init)
				}
			}
		}

		return decls
	}

	private getDeclarationFromNode(node: any): any | null {
		if (isVariableDeclaration(node)) return node
		if (node.type === 'ExportNamedDeclaration' && node.declaration && isVariableDeclaration(node.declaration)) {
			return node.declaration
		}
		return null
	}

	private extractFromNode(node: Node): Schema | null {
		if (isObjectExpression(node) || isArrayExpression(node) || isIdentifier(node)) {
			return this.parseObject(node)
		}
		return null
	}

	private extractFromVariable(node: any): Schema | null {
		if (!isVariableDeclaration(node)) return null

		for (const decl of node.declarations) {
			const isSchema = isVariableDeclarator(decl) && isIdentifier(decl.id) && decl.id.name.toLowerCase() === 'schema'
			if (isSchema && decl.init) {
				return this.parseObject(decl.init)
			}
		}

		return null
	}

	private extractFromAssignment(rightNode: Node): Schema | null {
		return this.parseObject(rightNode)
	}

	private parseObject(node: any): any {
		if (node === null || node === undefined) return null
		if (typeof node !== 'object' || !('type' in node)) return node

		if (isStringLiteral(node) || isNumericLiteral(node) || isBooleanLiteral(node)) {
			return node.value
		}

		if (isIdentifier(node)) return this.handleIdentifier(node)
		if (isArrayExpression(node)) return this.handleArrayExpression(node)
		if (isObjectExpression(node)) return this.handleObjectExpression(node)

		return null
	}

	private handleIdentifier(node: any): any {
		if (this.visitedIdentifiers.has(node.name)) {
			console.warn(`Circular reference detected for identifier: ${node.name}`)
			return null
		}

		this.visitedIdentifiers.add(node.name)
		const resolved = this.resolveIdentifier(node.name)
		const result = this.parseObject(resolved)
		this.visitedIdentifiers.delete(node.name)
		return result
	}

	private handleArrayExpression(node: any): any[] {
		const result: any[] = []
		for (const el of node.elements) {
			if (!el) continue
			if (isSpreadElement(el)) {
				const spreadValue = this.parseObject(el.argument)
				if (Array.isArray(spreadValue)) result.push(...spreadValue)
			} else {
				result.push(this.parseObject(el))
			}
		}
		return result
	}

	private handleObjectExpression(node: any): Record<string, unknown> {
		const result: Record<string, unknown> = {}

		for (const prop of node.properties) {
			if (isSpreadElement(prop)) {
				const spreadValue = this.parseObject(prop.argument)
				if (typeof spreadValue === 'object' && spreadValue !== null) {
					Object.assign(result, spreadValue)
				}
				continue
			}

			if (!isObjectProperty(prop)) continue

			const key = this.getPropertyKey(prop)
			if (key) {
				result[key] = this.parseObject(prop.value)
			}
		}

		return result
	}

	private getPropertyKey(prop: any): string {
		if (isIdentifier(prop.key)) return prop.key.name
		if (isStringLiteral(prop.key) || isNumericLiteral(prop.key)) return String(prop.key.value)
		return ''
	}

	private resolveIdentifier(name: string): any | null {
		const local = this.localDecls.get(name)
		if (local) return local

		const imported = this.currentImports.get(name)
		if (imported && this.currentFilePath) {
			return this.resolveExternalSchema(imported.source, imported.specifierName, this.currentFilePath)
		}

		return null
	}

	private resolveExternalSchema(importPath: string, specifierName: string, currentFilePath: string): any | null {
		const resolvedPath = this.resolveFilePath(importPath, currentFilePath)
		if (!resolvedPath) return null

		try {
			const content = this.fs.readFileSync(resolvedPath)
			const ast = this.parseFile(content)

			const externalExtractor = new SchemaExtractor(this.fs)
			return externalExtractor.extractExportedNode(ast, specifierName, resolvedPath)
		} catch (error) {
			console.warn(`Could not resolve external schema: ${importPath}`, error)
			return null
		}
	}

	private extractExportedNode(ast: File, specifierName: string, currentFilePath?: string): any | null {
		this.currentFilePath = currentFilePath
		this.currentImports = this.collectImports(ast)
		this.localDecls = this.collectLocalDecls(ast)
		this.visitedIdentifiers.clear()

		for (const node of ast.program.body) {
			if (node.type === 'ExportNamedDeclaration' && node.declaration && isVariableDeclaration(node.declaration)) {
				for (const decl of node.declaration.declarations) {
					if (isIdentifier(decl.id) && decl.id.name === specifierName && decl.init) {
						return this.parseObject(decl.init)
					}
				}
			}

			if (node.type === 'ExportDefaultDeclaration' && specifierName === 'default') {
				return this.parseObject(node.declaration)
			}
		}

		return null
	}

	private resolveFilePath(importPath: string, currentFilePath: string): string | null {
		const basePath = path.resolve(path.dirname(currentFilePath), importPath)

		if (this.fs.existsSync(basePath)) return basePath

		const foundExt = this.allowedExtensions.find(ext => this.fs.existsSync(basePath + ext))
		return foundExt ? basePath + foundExt : null
	}

	private parseFile(content: string) {
		return parse(content, {
			sourceType: 'module',
			plugins: ['typescript', 'jsx'],
		})
	}
}