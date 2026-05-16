import traverse from '@babel/traverse'
import {
	File,
	isExportDeclaration,
	isImportDeclaration,
	isTSTypeAliasDeclaration,
	isTSInterfaceDeclaration,
	isTSModuleDeclaration,
	isTSDeclareFunction,
	isEmptyStatement,
} from '@babel/types'
import { ComponentMetadataType } from '../../../../../types/component'

import { ExportParser } from './export-parser'
import { DirectiveParser } from './directive-parser'
import { StatementCollector } from './statement-collector'
import { VariableParser } from './variable-parser'
import { FunctionBodyParser } from './function-body-parser'

export class ComponentExtractor {
	private statementCollector: StatementCollector
	private functionBodyParser: FunctionBodyParser
	private VariableParser: VariableParser
	private exportParser: ExportParser
	private directiveParser: DirectiveParser

	constructor() {
		this.statementCollector = new StatementCollector()
		this.functionBodyParser = new FunctionBodyParser(this.statementCollector)
		this.VariableParser = new VariableParser(this.statementCollector)
		this.exportParser = new ExportParser(this.functionBodyParser, this.VariableParser)
		this.directiveParser = new DirectiveParser()
	}

	public extract(ast: File, source: string): ComponentMetadataType {
		const metadata: ComponentMetadataType = {
			name: '',
			jsxElement: null,
			scriptStatements: [],
			liquidAssignments: [],
			hasUseScript: false,
			mode: 'liquid',
			reactRootId: '',
			inlineComponents: new Map(),
		}

		const directives = ast.program.directives || []
		const body = ast.program.body
		const nodesToCheck = [...directives, ...body]

		this.directiveParser.parse(nodesToCheck, metadata)

		traverse(ast, {
			ExportNamedDeclaration: (path) => this.exportParser.parse(path, metadata),
			ExportDefaultDeclaration: (path) => this.exportParser.parse(path, metadata),
		})

		const isDom = metadata.mode === 'dom' || metadata.mode === 'dom:global'
		const topLevelStatements = body.filter(
			(node) =>
				!isExportDeclaration(node) &&
				!isImportDeclaration(node) &&
				!isTSTypeAliasDeclaration(node) &&
				!isTSInterfaceDeclaration(node) &&
				!isTSModuleDeclaration(node) &&
				!isTSDeclareFunction(node) &&
				!isEmptyStatement(node),
		)

		if (isDom && metadata.scriptStatements.length === 0) {
			if (topLevelStatements.length > 0) {
				metadata.hasUseScript = true
				metadata.scriptStatements.push(...(topLevelStatements as any[]))
			}
		}

		if (metadata.mode === 'liquid' && topLevelStatements.length > 0) {
			metadata.hasUncoveredJs = true
		}

		return metadata
	}
}
