import { _match } from 'funcio'
import { type FunctionDeclaration, isBlockStatement } from '@babel/types'
import type { ComponentMetadataType } from '../../../../../types/component'
import type { StatementCollector } from './statement-collector'

export class FunctionBodyParser {
  constructor(private readonly statementCollector: StatementCollector) {}

  public parse(node: FunctionDeclaration, metadata: ComponentMetadataType): void {
    metadata.name = _match(node.id === null || node.id === undefined)
      .with(true, () => '')
      .with(false, () => (node.id as { name: string }).name ?? '')
      .exec() as string
    _match(node.body != null && isBlockStatement(node.body))
      .with(true, () => this.collectBody(node, metadata))
      .with(false, () => undefined)
      .exec()
  }

  private collectBody(node: FunctionDeclaration, metadata: ComponentMetadataType): void {
    const body = node.body
    this.statementCollector.collect([...(body.directives || []), ...body.body], metadata)
  }
}
