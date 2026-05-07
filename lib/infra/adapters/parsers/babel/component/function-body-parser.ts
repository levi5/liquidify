import { _Maybe } from 'funcio'
import { FunctionDeclaration, isBlockStatement } from '@babel/types'
import { ComponentMetadataType } from '../../../../../types/component'
import { StatementCollector } from './statement-collector'

export class FunctionBodyParser {
	constructor(private statementCollector: StatementCollector) {}

	public parse(node: FunctionDeclaration, metadata: ComponentMetadataType): void {
		metadata.name = _Maybe
			.of(node)
			.map((node) => node.id)
			.map((id) => id.name)
			.map((name) => name)
			.getOrElse('')

		if (node.body && isBlockStatement(node.body)) {
			const statements = [...(node.body.directives || []), ...node.body.body]
			this.statementCollector.collect(statements as any[], metadata)
		}
	}
}
