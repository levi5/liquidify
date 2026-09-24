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
  type FunctionDeclaration,
  type VariableDeclaration,
  type ArrowFunctionExpression,
} from '@babel/types'
import { _match } from 'funcio'
import type { ComponentMetadataType } from '../../../../../types/component'
import type { VariableParser } from './variable-parser'
import type { FunctionBodyParser } from './function-body-parser'

export class ExportParser {
  constructor(
    private readonly functionBodyParser: FunctionBodyParser,
    private readonly variableParser: VariableParser,
  ) {}

  public parse(path: NodePath<ExportNamedDeclaration | ExportDefaultDeclaration>, metadata: ComponentMetadataType): void {
    const declaration = path.node.declaration
    _match(declaration === null || declaration === undefined)
      .with(true, () => undefined)
      .with(false, () => this.dispatch(declaration as FunctionDeclaration | VariableDeclaration | ArrowFunctionExpression, metadata))
      .exec()
  }

  private dispatch(
    declaration: FunctionDeclaration | VariableDeclaration | ArrowFunctionExpression,
    metadata: ComponentMetadataType,
  ): void {
    _match(true)
      .with(isFunctionDeclaration(declaration), () => this.functionBodyParser.parse(declaration as FunctionDeclaration, metadata))
      .with(isVariableDeclaration(declaration), () => this.variableParser.parse(declaration as VariableDeclaration, metadata))
      .with(isArrowFunctionExpression(declaration), () => this.parseAnonymousArrow(declaration as ArrowFunctionExpression, metadata))
      .with(true, () => undefined)
      .exec()
  }

  private parseAnonymousArrow(declaration: ArrowFunctionExpression, metadata: ComponentMetadataType): void {
    this.variableParser.parse(variableDeclaration('const', [variableDeclarator(identifier('Component'), declaration)]), metadata)
    metadata.name = ''
  }
}
