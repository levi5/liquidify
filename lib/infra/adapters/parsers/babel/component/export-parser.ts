import type { NodePath } from '@babel/traverse'
import {
  isFunctionDeclaration,
  isVariableDeclaration,
  isArrowFunctionExpression,
  variableDeclaration,
  variableDeclarator,
  identifier,
  type ExportDefaultDeclaration,
  type ExportNamedDeclaration,
} from '@babel/types'
import { _Maybe, _match } from 'funcio'
import type { ComponentMetadataType } from '../../../../../types/component'
import type { VariableParser } from './variable-parser'
import type { FunctionBodyParser } from './function-body-parser'

export class ExportParser {
  constructor(
    private functionBodyParser: FunctionBodyParser,
    private VariableParser: VariableParser,
  ) {}

  public parse(path: NodePath<ExportNamedDeclaration | ExportDefaultDeclaration>, metadata: ComponentMetadataType): void {
    const declaration = path.node.declaration
    _Maybe
      .of(Boolean(declaration))
      .map((present) => (present ? this.dispatch(declaration as any, metadata) : null))
      .getOrElse(null)
  }

  private dispatch(declaration: any, metadata: ComponentMetadataType): void {
    _match(true)
      .with(isFunctionDeclaration(declaration), () => this.functionBodyParser.parse(declaration, metadata))
      .with(isVariableDeclaration(declaration), () => this.VariableParser.parse(declaration, metadata))
      .with(isArrowFunctionExpression(declaration), () => {
        this.VariableParser.parse(variableDeclaration('const', [variableDeclarator(identifier('Component'), declaration)]), metadata)
        metadata.name = ''
      })
      .with(true, () => null)
      .exec()
  }
}
