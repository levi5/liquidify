import { NodePath } from '@babel/traverse'
import { isFunctionDeclaration, isVariableDeclaration, ExportDefaultDeclaration, ExportNamedDeclaration } from '@babel/types'
import { ComponentMetadataType } from '../../../../../types/component'
import { VariableParser } from './variable-parser'
import { FunctionBodyParser } from './function-body-parser'

export class ExportParser {
	constructor(
		private functionBodyParser: FunctionBodyParser,
		private VariableParser: VariableParser,
	) {}

	public parse(path: NodePath<ExportNamedDeclaration | ExportDefaultDeclaration>, metadata: ComponentMetadataType): void {
		const declaration = path.node.declaration
		if (!declaration) return

		if (isFunctionDeclaration(declaration)) {
			this.functionBodyParser.parse(declaration, metadata)
		}

		if (isVariableDeclaration(declaration)) {
			this.VariableParser.parse(declaration, metadata)
		}
	}
}
