import { _match, _try } from 'funcio'
import traverse, { type NodePath } from '@babel/traverse'
import {
  isArrayExpression,
  isBooleanLiteral,
  isIdentifier,
  isNumericLiteral,
  isObjectExpression,
  isObjectProperty,
  isStringLiteral,
  isVariableDeclaration,
  isSpreadElement,
  isMemberExpression,
  isExportSpecifier,
  isImportSpecifier,
  isImportDefaultSpecifier,
  type Node,
  type File,
  type Statement,
  type ExportNamedDeclaration,
  type ExportSpecifier,
  type ImportDeclaration,
  type ImportSpecifier,
  type ImportDefaultSpecifier,
  type ImportNamespaceSpecifier,
  type ArrayExpression,
  type ObjectExpression,
  type ObjectProperty,
  type SpreadElement,
  type VariableDeclaration,
  type VariableDeclarator,
  type AssignmentExpression,
} from '@babel/types'

import { parse } from '@babel/parser'
import type { ModuleResolver } from '../../../fs/module-resolver'
import type { IFileSystem } from '../../../../../core/protocols/file-system'
import type { Logger } from '../../../../../shared/logger'

import { ValidationError } from '../../../../../core/errors/validation-error'

type Schema = Record<string, unknown>

interface ImportMapValue {
  source: string
  specifierName: string
  isDefault: boolean
}

interface ExtractionState {
  localDecls: Map<string, Node>
  currentImports: Map<string, ImportMapValue>
  currentFilePath?: string
  visitedIdentifiers: Set<string>
}

export class SchemaExtractor {
  private readonly resolving = new Set<string>()

  constructor(
    private readonly fs: IFileSystem,
    private readonly resolver: ModuleResolver,
    private readonly logger: Logger,
  ) {}

  public extract(ast: File, currentFilePath?: string): Schema {
    const state: ExtractionState = {
      localDecls: this.collectLocalDecls(ast),
      currentImports: this.collectImports(ast),
      currentFilePath,
      visitedIdentifiers: new Set<string>(),
    }
    const matches: Schema[] = []
    traverse(ast, {
      ExportNamedDeclaration: (nodePath) => this.collectNamedExport(nodePath.node, state, currentFilePath, matches),
      ExportDefaultDeclaration: (nodePath) => this.collectDefaultExport(nodePath.node, state, currentFilePath, matches),
      VariableDeclarator: (nodePath) => this.collectSchemaDeclarator(nodePath, state, currentFilePath, matches),
      AssignmentExpression: (nodePath) => this.collectSchemaAssignment(nodePath, state, currentFilePath, matches),
    })
    return _match(matches.length === 0)
      .with(true, () => ({}))
      .with(false, () => matches[matches.length - 1])
      .exec() as Schema
  }

  private acceptSchema(value: unknown, currentFilePath?: string): Schema {
    return _match(!value || typeof value !== 'object' || Array.isArray(value))
      .with(true, () => {
        throw new ValidationError('Schema must resolve to a static object.', currentFilePath)
      })
      .with(false, () => value as Schema)
      .exec() as Schema
  }

  private collectNamedExport(
    node: ExportNamedDeclaration,
    state: ExtractionState,
    currentFilePath: string | undefined,
    matches: Schema[],
  ): void {
    node.specifiers
      .filter(isExportSpecifier)
      .filter((specifier) => this.exportedName(specifier.exported) === 'schema')
      .forEach((specifier) => {
        matches.push(this.resolveNamedExport(node, specifier, state, currentFilePath))
      })
  }

  private resolveNamedExport(
    node: ExportNamedDeclaration,
    specifier: ExportSpecifier,
    state: ExtractionState,
    currentFilePath: string | undefined,
  ): Schema {
    const value = _match(node.source != null && currentFilePath !== undefined)
      .with(true, () => this.resolveExternalSchema(node.source?.value as string, specifier.local.name, currentFilePath as string))
      .with(false, () => this.parseObject(specifier.local, state))
      .exec()
    return this.acceptSchema(value, currentFilePath)
  }

  private exportedName(exported: ExportSpecifier['exported']): string {
    return _match(isIdentifier(exported))
      .with(true, () => (exported as { name: string }).name)
      .with(false, () => (exported as { value: string }).value)
      .exec() as string
  }

  private collectDefaultExport(
    node: { declaration: unknown },
    state: ExtractionState,
    currentFilePath: string | undefined,
    matches: Schema[],
  ): void {
    const declaration = node.declaration as Node
    _match(isObjectExpression(declaration) || (isIdentifier(declaration) && declaration.name.toLowerCase() === 'schema'))
      .with(true, () => matches.push(this.acceptSchema(this.parseObject(declaration, state), currentFilePath)))
      .with(false, () => undefined)
      .exec()
  }

  private collectSchemaDeclarator(
    nodePath: NodePath<VariableDeclarator>,
    state: ExtractionState,
    currentFilePath: string | undefined,
    matches: Schema[],
  ): void {
    _match(nodePath.getFunctionParent() !== null)
      .with(true, () => undefined)
      .with(false, () => this.matchSchemaDeclarator(nodePath.node, state, currentFilePath, matches))
      .exec()
  }

  private matchSchemaDeclarator(
    node: VariableDeclarator,
    state: ExtractionState,
    currentFilePath: string | undefined,
    matches: Schema[],
  ): void {
    _match(isIdentifier(node.id) && node.id.name.toLowerCase() === 'schema' && node.init != null)
      .with(true, () => matches.push(this.acceptSchema(this.parseObject(node.init, state), currentFilePath)))
      .with(false, () => undefined)
      .exec()
  }

  private collectSchemaAssignment(
    nodePath: NodePath<AssignmentExpression>,
    state: ExtractionState,
    currentFilePath: string | undefined,
    matches: Schema[],
  ): void {
    _match(nodePath.getFunctionParent() !== null)
      .with(true, () => undefined)
      .with(false, () => this.matchSchemaAssignment(nodePath.node, state, currentFilePath, matches))
      .exec()
  }

  private matchSchemaAssignment(
    node: AssignmentExpression,
    state: ExtractionState,
    currentFilePath: string | undefined,
    matches: Schema[],
  ): void {
    _match(
      (isIdentifier(node.left) && node.left.name.toLowerCase() === 'schema') ||
        (isMemberExpression(node.left) && !node.left.computed && isIdentifier(node.left.property, { name: 'schema' })),
    )
      .with(true, () => matches.push(this.acceptSchema(this.parseObject(node.right, state), currentFilePath)))
      .with(false, () => undefined)
      .exec()
  }

  private collectImports(ast: File): Map<string, ImportMapValue> {
    const imports = new Map<string, ImportMapValue>()
    traverse(ast, {
      ImportDeclaration: (pathNode) => this.registerImport(pathNode.node, imports),
    })
    return imports
  }

  private registerImport(node: ImportDeclaration, imports: Map<string, ImportMapValue>): void {
    node.specifiers.forEach((spec) => {
      this.registerSpecifier(node.source.value, spec, imports)
    })
  }

  private registerSpecifier(
    source: string,
    spec: ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier,
    imports: Map<string, ImportMapValue>,
  ): void {
    _match(true)
      .with(isImportSpecifier(spec), () => this.registerNamedSpecifier(source, spec as ImportSpecifier, imports))
      .with(isImportDefaultSpecifier(spec), () =>
        imports.set((spec as ImportDefaultSpecifier).local.name, { source, specifierName: 'default', isDefault: true }),
      )
      .with(true, () => undefined)
      .exec()
  }

  private registerNamedSpecifier(source: string, spec: ImportSpecifier, imports: Map<string, ImportMapValue>): void {
    imports.set(spec.local.name, { source, specifierName: this.exportedName(spec.imported), isDefault: false })
  }

  private collectLocalDecls(ast: File): Map<string, Node> {
    const decls = new Map<string, Node>()
    ast.program.body.forEach((node) => {
      this.collectNodeDecls(node, decls)
    })
    return decls
  }

  private collectNodeDecls(node: Statement, decls: Map<string, Node>): void {
    const declaration = this.getDeclarationFromNode(node)
    _match(declaration === null)
      .with(true, () => undefined)
      .with(false, () => {
        ;(declaration as VariableDeclaration).declarations.forEach((decl) => {
          this.collectDeclarator(decl, decls)
        })
      })
      .exec()
  }

  private collectDeclarator(decl: VariableDeclarator, decls: Map<string, Node>): void {
    _match(isIdentifier(decl.id) && decl.init != null)
      .with(true, () => decls.set((decl.id as { name: string }).name, decl.init as Node))
      .with(false, () => undefined)
      .exec()
  }

  private getDeclarationFromNode(node: Statement): VariableDeclaration | null {
    return _match(true)
      .with(isVariableDeclaration(node), () => node as VariableDeclaration)
      .with(
        node.type === 'ExportNamedDeclaration' &&
          (node as ExportNamedDeclaration).declaration != null &&
          isVariableDeclaration((node as ExportNamedDeclaration).declaration),
        () => (node as ExportNamedDeclaration).declaration as VariableDeclaration,
      )
      .with(true, () => null)
      .exec() as VariableDeclaration | null
  }

  private parseObject(node: unknown, state: ExtractionState): unknown {
    return _match(node === null || node === undefined || typeof node !== 'object' || !('type' in (node as Record<string, unknown>)))
      .with(true, () => node)
      .with(false, () => this.parseTypedNode(node as Node, state))
      .exec()
  }

  private parseTypedNode(node: Node, state: ExtractionState): unknown {
    return _match(true)
      .with(isStringLiteral(node) || isNumericLiteral(node) || isBooleanLiteral(node), () => (node as { value: unknown }).value)
      .with(node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression' || node.type === 'TSNonNullExpression', () =>
        this.parseObject((node as { expression: unknown }).expression, state),
      )
      .with(isIdentifier(node), () => this.handleIdentifier(node, state))
      .with(isArrayExpression(node), () => this.handleArrayExpression(node as ArrayExpression, state))
      .with(isObjectExpression(node), () => this.handleObjectExpression(node as ObjectExpression, state))
      .with(true, () => null)
      .exec()
  }

  private handleIdentifier(node: Node, state: ExtractionState): unknown {
    const name = (node as { name: string }).name
    return _match(state.visitedIdentifiers.has(name))
      .with(true, () => this.reportCircular(name))
      .with(false, () => this.resolveLocalIdentifier(name, state))
      .exec()
  }

  private reportCircular(name: string): null {
    this.logger.warn(`Circular reference detected for identifier: ${name}`)
    return null
  }

  private resolveLocalIdentifier(name: string, state: ExtractionState): unknown {
    state.visitedIdentifiers.add(name)
    const local = state.localDecls.get(name)
    const result = _match(local !== undefined)
      .with(true, () => this.parseObject(local as Node, state))
      .with(false, () => this.resolveIdentifier(name, state))
      .exec()
    state.visitedIdentifiers.delete(name)
    return result
  }

  private handleArrayExpression(node: ArrayExpression, state: ExtractionState): unknown[] {
    return node.elements.reduce<unknown[]>(
      (acc, element) =>
        _match(element === null)
          .with(true, () => acc)
          .with(false, () => this.appendElement(acc, element as Exclude<typeof element, null>, state))
          .exec() as unknown[],
      [],
    )
  }

  private appendElement(acc: unknown[], element: ArrayExpression['elements'][number], state: ExtractionState): unknown[] {
    return _match(isSpreadElement(element))
      .with(true, () => this.spreadElement(acc, element as SpreadElement, state))
      .with(false, () => [...acc, this.parseObject(element, state)])
      .exec() as unknown[]
  }

  private spreadElement(acc: unknown[], element: SpreadElement, state: ExtractionState): unknown[] {
    const spreadValue = this.parseObject(element.argument, state)
    return _match(Array.isArray(spreadValue))
      .with(true, () => [...acc, ...(spreadValue as unknown[])])
      .with(false, () => acc)
      .exec() as unknown[]
  }

  private handleObjectExpression(node: ObjectExpression, state: ExtractionState): Record<string, unknown> {
    return node.properties.reduce((acc, property) => this.applyProperty(acc, property, state), {} as Record<string, unknown>)
  }

  private applyProperty(
    acc: Record<string, unknown>,
    property: ObjectExpression['properties'][number],
    state: ExtractionState,
  ): Record<string, unknown> {
    return _match(isSpreadElement(property))
      .with(true, () => this.spreadProperty(acc, property as SpreadElement, state))
      .with(false, () => this.assignProperty(acc, property, state))
      .exec() as Record<string, unknown>
  }

  private spreadProperty(acc: Record<string, unknown>, property: SpreadElement, state: ExtractionState): Record<string, unknown> {
    const spreadValue = this.parseObject(property.argument, state)
    return _match(typeof spreadValue === 'object' && spreadValue !== null)
      .with(true, () => ({ ...acc, ...(spreadValue as Record<string, unknown>) }))
      .with(false, () => acc)
      .exec() as Record<string, unknown>
  }

  private assignProperty(
    acc: Record<string, unknown>,
    property: ObjectExpression['properties'][number],
    state: ExtractionState,
  ): Record<string, unknown> {
    return _match(!isObjectProperty(property))
      .with(true, () => acc)
      .with(false, () => this.writeProperty(acc, property as ObjectProperty, state))
      .exec() as Record<string, unknown>
  }

  private writeProperty(acc: Record<string, unknown>, property: ObjectProperty, state: ExtractionState): Record<string, unknown> {
    const key = this.getPropertyKey(property.key)
    return _match(key === '')
      .with(true, () => acc)
      .with(false, () => ({ ...acc, [key]: this.parseObject(property.value, state) }))
      .exec() as Record<string, unknown>
  }

  private getPropertyKey(key: ObjectProperty['key']): string {
    return _match(true)
      .with(isIdentifier(key), () => (key as { name: string }).name)
      .with(isStringLiteral(key) || isNumericLiteral(key), () => String((key as { value: unknown }).value))
      .with(true, () => '')
      .exec() as string
  }

  private resolveIdentifier(name: string, state: ExtractionState): unknown {
    const local = state.localDecls.get(name)
    return _match(local !== undefined)
      .with(true, () => local as Node)
      .with(false, () => this.resolveImportedIdentifier(name, state))
      .exec()
  }

  private resolveImportedIdentifier(name: string, state: ExtractionState): unknown {
    const imported = state.currentImports.get(name)
    return _match(imported !== undefined && state.currentFilePath !== undefined)
      .with(true, () =>
        this.resolveExternalSchema(
          (imported as ImportMapValue).source,
          (imported as ImportMapValue).specifierName,
          state.currentFilePath as string,
        ),
      )
      .with(false, () => null)
      .exec()
  }

  public resolveExternalSchema(importPath: string, specifierName: string, currentFilePath: string): unknown {
    const resolvedPath = this.resolver.resolve(importPath, currentFilePath)
    return _match(resolvedPath === null)
      .with(true, () => null)
      .with(false, () => this.loadExternalSchema(resolvedPath as string, specifierName))
      .exec()
  }

  private loadExternalSchema(resolvedPath: string, specifierName: string): unknown {
    const key = `${resolvedPath}#${specifierName}`
    _match(this.resolving.has(key))
      .with(true, () => {
        throw new ValidationError(`Circular import while resolving ${specifierName}.`, resolvedPath)
      })
      .with(false, () => undefined)
      .exec()
    this.resolving.add(key)
    const result = _try.sync(() => {
      const content = this.fs.readFileSync(resolvedPath)
      return this.extractExportedNode(this.parseFile(content), specifierName, resolvedPath)
    })
    this.resolving.delete(key)
    return result.match({
      left: (error) => {
        throw error
      },
      right: (schema) => schema,
    })
  }

  private extractExportedNode(ast: File, specifierName: string, currentFilePath?: string): unknown {
    const state: ExtractionState = {
      localDecls: this.collectLocalDecls(ast),
      currentImports: this.collectImports(ast),
      currentFilePath,
      visitedIdentifiers: new Set<string>(),
    }
    return this.scanExports(ast.program.body, 0, state, specifierName, currentFilePath)
  }

  private scanExports(nodes: Statement[], index: number, state: ExtractionState, specifierName: string, currentFilePath?: string): unknown {
    return _match(index >= nodes.length)
      .with(true, () => null)
      .with(false, () => this.scanExportAt(nodes[index], nodes, index, state, specifierName, currentFilePath))
      .exec()
  }

  private scanExportAt(
    node: Statement,
    nodes: Statement[],
    index: number,
    state: ExtractionState,
    specifierName: string,
    currentFilePath?: string,
  ): unknown {
    const next = () => this.scanExports(nodes, index + 1, state, specifierName, currentFilePath)
    const specifiers = () => this.readNamedSpecifierExport(node as ExportNamedDeclaration, state, specifierName, currentFilePath, next)
    return _match(true)
      .with(this.isNamedValueExport(node), () => this.readNamedValueExport(node, specifierName, state, specifiers))
      .with(node.type === 'ExportNamedDeclaration', () => specifiers())
      .with(node.type === 'ExportAllDeclaration' && specifierName !== 'default' && currentFilePath !== undefined, () =>
        this.readStarExport(node as ExportNamedDeclaration & { source: { value: string } }, specifierName, currentFilePath as string, next),
      )
      .with(node.type === 'ExportDefaultDeclaration' && specifierName === 'default', () =>
        this.parseObject((node as { declaration: unknown }).declaration, state),
      )
      .with(true, () => next())
      .exec()
  }

  private isNamedValueExport(node: Statement): boolean {
    const declaration = (node as ExportNamedDeclaration).declaration as Node | null | undefined
    return node.type === 'ExportNamedDeclaration' && declaration != null && isVariableDeclaration(declaration)
  }

  private readNamedValueExport(node: Statement, specifierName: string, state: ExtractionState, fallback: () => unknown): unknown {
    const declarations = (node as { declaration: { declarations: VariableDeclarator[] } }).declaration.declarations
    const found = declarations.find((decl) => isIdentifier(decl.id) && (decl.id as { name: string }).name === specifierName && decl.init)
    return _match(found === undefined)
      .with(true, () => fallback())
      .with(false, () => this.parseObject((found as { init: unknown }).init, state))
      .exec()
  }

  private readNamedSpecifierExport(
    node: ExportNamedDeclaration,
    state: ExtractionState,
    specifierName: string,
    currentFilePath: string | undefined,
    next: () => unknown,
  ): unknown {
    const specifier = node.specifiers.filter(isExportSpecifier).find((spec) => this.exportedName(spec.exported) === specifierName)
    return _match(specifier === undefined)
      .with(true, () => next())
      .with(false, () => this.readMatchedSpecifier(node, specifier as ExportSpecifier, state, currentFilePath))
      .exec()
  }

  private readMatchedSpecifier(
    node: ExportNamedDeclaration,
    specifier: ExportSpecifier,
    state: ExtractionState,
    currentFilePath: string | undefined,
  ): unknown {
    const source = (node as { source?: { value: string } | null }).source
    return _match(source != null && currentFilePath !== undefined)
      .with(true, () => this.resolveExternalSchema((source as { value: string }).value, specifier.local.name, currentFilePath as string))
      .with(false, () => this.handleIdentifier(specifier.local as unknown as Node, state))
      .exec()
  }

  private readStarExport(
    node: ExportNamedDeclaration & { source: { value: string } },
    specifierName: string,
    currentFilePath: string,
    next: () => unknown,
  ): unknown {
    const value = this.resolveExternalSchema(node.source.value, specifierName, currentFilePath)
    return _match(value !== null)
      .with(true, () => value)
      .with(false, () => next())
      .exec()
  }

  private parseFile(content: string) {
    return parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    })
  }
}
