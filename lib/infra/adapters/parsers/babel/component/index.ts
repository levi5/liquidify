import { _match } from 'funcio'
import traverse from '@babel/traverse'
import {
  type File,
  isExportDeclaration,
  isImportDeclaration,
  isTSTypeAliasDeclaration,
  isTSInterfaceDeclaration,
  isTSModuleDeclaration,
  isTSDeclareFunction,
  isEmptyStatement,
  type Statement,
} from '@babel/types'
import type { ComponentMetadataType } from '../../../../../types/component'

import { ExportParser } from './export-parser'
import { DirectiveParser } from './directive-parser'
import { StatementCollector } from './statement-collector'
import { VariableParser } from './variable-parser'
import { FunctionBodyParser } from './function-body-parser'

export class ComponentExtractor {
  private readonly statementCollector: StatementCollector
  private readonly functionBodyParser: FunctionBodyParser
  private readonly variableParser: VariableParser
  private readonly exportParser: ExportParser
  private readonly directiveParser: DirectiveParser

  constructor() {
    this.statementCollector = new StatementCollector()
    this.functionBodyParser = new FunctionBodyParser(this.statementCollector)
    this.variableParser = new VariableParser(this.statementCollector)
    this.exportParser = new ExportParser(this.functionBodyParser, this.variableParser)
    this.directiveParser = new DirectiveParser()
  }

  public extract(ast: File, _source: string): ComponentMetadataType {
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
    this.directiveParser.parse([...(ast.program.directives || []), ...ast.program.body], metadata)
    traverse(ast, {
      ExportNamedDeclaration: (path) => this.exportParser.parse(path, metadata),
      ExportDefaultDeclaration: (path) => this.exportParser.parse(path, metadata),
    })
    this.absorbTopLevel(ast.program.body, metadata)
    this.flagUncoveredJs(ast.program.body, metadata)
    return metadata
  }

  private absorbTopLevel(body: Statement[], metadata: ComponentMetadataType): void {
    _match(this.isDom(metadata) && metadata.scriptStatements.length === 0)
      .with(true, () => this.absorbStatements(this.topLevelStatements(body), metadata))
      .with(false, () => undefined)
      .exec()
  }

  private absorbStatements(statements: Statement[], metadata: ComponentMetadataType): void {
    _match(statements.length > 0)
      .with(true, () => {
        metadata.hasUseScript = true
        statements.forEach((statement) => {
          metadata.scriptStatements.push(statement)
        })
      })
      .with(false, () => undefined)
      .exec()
  }

  private flagUncoveredJs(body: Statement[], metadata: ComponentMetadataType): void {
    _match(metadata.mode === 'liquid' && this.topLevelStatements(body).length > 0)
      .with(true, () => {
        metadata.hasUncoveredJs = true
      })
      .with(false, () => undefined)
      .exec()
  }

  private isDom(metadata: ComponentMetadataType): boolean {
    return metadata.mode === 'dom' || metadata.mode === 'dom:global'
  }

  private topLevelStatements(body: Statement[]): Statement[] {
    return body.filter(
      (node) =>
        !isExportDeclaration(node) &&
        !isImportDeclaration(node) &&
        !isTSTypeAliasDeclaration(node) &&
        !isTSInterfaceDeclaration(node) &&
        !isTSModuleDeclaration(node) &&
        !isTSDeclareFunction(node) &&
        !isEmptyStatement(node),
    )
  }
}
