import { _Maybe } from 'funcio'
import { type FunctionDeclaration, isBlockStatement } from '@babel/types'
import type { ComponentMetadataType } from '../../../../../types/component'
import type { StatementCollector } from './statement-collector'

export class FunctionBodyParser {
  constructor(private statementCollector: StatementCollector) {}

  public parse(node: FunctionDeclaration, metadata: ComponentMetadataType): void {
    metadata.name = _Maybe
      .of(node.id)
      .map((id) => id?.name ?? '')
      .getOrElse('')

    if (node.body && isBlockStatement(node.body)) {
      const statements = [...(node.body.directives || []), ...node.body.body]
      this.statementCollector.collect(statements as any[], metadata)
    }
  }
}
