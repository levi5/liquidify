import { VariableDeclaration, isIdentifier, isArrowFunctionExpression, isBlockStatement } from '@babel/types'
import { ComponentMetadataType } from '../../../../../types/component'
import { StatementCollector } from './statement-collector'

export class VariableParser {
  constructor(private statementCollector: StatementCollector) { }

  public parse(node: VariableDeclaration, metadata: ComponentMetadataType): void {
    const declarator = node.declarations[0]
    if (!declarator) return

    if (isIdentifier(declarator.id)) {
      metadata.name = declarator.id.name
    }

    if (declarator.init && isArrowFunctionExpression(declarator.init) && isBlockStatement(declarator.init.body)) {
      const statements = [...(declarator.init.body.directives || []), ...declarator.init.body.body]
      this.statementCollector.collect(statements as any[], metadata)
    }
  }
}
