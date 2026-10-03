import { _match } from 'funcio'
import {
  type File,
  type Identifier,
  type StringLiteral,
  type ImportDeclaration,
  type ImportSpecifier,
  type ImportDefaultSpecifier,
  type ImportNamespaceSpecifier,
  isIdentifier,
  isImportDeclaration,
  isImportDefaultSpecifier,
  isImportNamespaceSpecifier,
  isImportSpecifier,
  traverseFast,
} from '@babel/types'
import type { SchemaExtractor } from '../schema/schema-extractor'

export interface ImportInfo {
  source: string
  specifierName: string
  isDefault: boolean
}

type AnySpecifier = ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier

export class ImportResolver {
  private imports: Map<string, ImportInfo> = new Map()
  private cssModules: Set<string> = new Set()

  constructor(private readonly schemaExtractor: SchemaExtractor) {}

  public getCssModules(): Set<string> {
    return this.cssModules
  }

  public getImports(): Map<string, ImportInfo> {
    return this.imports
  }

  public resolveImports(ast: File): void {
    this.clear()
    this.collectImports(ast)
  }

  public clear(): void {
    this.imports.clear()
    this.cssModules.clear()
  }

  private collectImports(ast: File): void {
    traverseFast(ast, (node) => {
      _match(isImportDeclaration(node))
        .with(true, () => this.registerDeclaration(node as ImportDeclaration))
        .with(false, () => undefined)
        .exec()
    })
  }

  private registerDeclaration(node: ImportDeclaration): void {
    const source = node.source.value
    const lower = source.toLowerCase()
    const isCss = lower.endsWith('.css') || lower.endsWith('.scss') || lower.endsWith('.sass') || lower.endsWith('.less')
    node.specifiers.forEach((spec) => {
      this.registerSpecifier(spec, source, isCss)
    })
  }

  private registerSpecifier(spec: AnySpecifier, source: string, isCss: boolean): void {
    _match(true)
      .with(isImportSpecifier(spec), () => this.registerNamed(spec as ImportSpecifier, source, isCss))
      .with(isImportDefaultSpecifier(spec), () => this.registerDefault(spec as ImportDefaultSpecifier, source, isCss))
      .with(isImportNamespaceSpecifier(spec), () => this.registerNamespace(spec as ImportNamespaceSpecifier, source, isCss))
      .with(true, () => undefined)
      .exec()
  }

  private registerNamed(spec: ImportSpecifier, source: string, isCss: boolean): void {
    const imported = spec.imported
    const importedName = _match(isIdentifier(imported))
      .with(true, () => (imported as Identifier).name)
      .with(false, () => (imported as StringLiteral).value)
      .exec() as string
    this.imports.set(spec.local.name, {
      source,
      specifierName: importedName,
      isDefault: false,
    })
    _match(isCss)
      .with(true, () => this.cssModules.add(spec.local.name))
      .with(false, () => undefined)
      .exec()
  }

  private registerDefault(spec: ImportDefaultSpecifier, source: string, isCss: boolean): void {
    this.imports.set(spec.local.name, {
      source,
      specifierName: 'default',
      isDefault: true,
    })
    _match(isCss)
      .with(true, () => this.cssModules.add(spec.local.name))
      .with(false, () => undefined)
      .exec()
  }

  private registerNamespace(spec: ImportNamespaceSpecifier, source: string, isCss: boolean): void {
    this.imports.set(spec.local.name, {
      source,
      specifierName: '*',
      isDefault: false,
    })
    _match(isCss)
      .with(true, () => this.cssModules.add(spec.local.name))
      .with(false, () => undefined)
      .exec()
  }

  public resolveExternalVariable(importPath: string, specifierName: string, currentFilePath: string): unknown {
    return this.schemaExtractor.resolveExternalSchema(importPath, specifierName, currentFilePath)
  }
}
