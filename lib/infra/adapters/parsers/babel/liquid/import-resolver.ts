import type { IFileSystem } from '../../../../../core/protocols/file-system'
import { type File, isIdentifier, isImportDeclaration, isImportDefaultSpecifier, isImportSpecifier, traverseFast } from '@babel/types'
import { SchemaExtractor } from '../schema/schema-extractor'

export interface ImportInfo {
  source: string
  specifierName: string
  isDefault: boolean
}

export class ImportResolver {
  private imports: Map<string, ImportInfo> = new Map()
  private cssModules: Set<string> = new Set()

  constructor(private readonly fs: IFileSystem) {}

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
      if (isImportDeclaration(node)) {
        const source = node.source.value
        const isCss = source.endsWith('.css') || source.endsWith('.scss')

        node.specifiers.forEach((spec) => {
          if (isImportSpecifier(spec)) {
            const importedName = isIdentifier(spec.imported) ? spec.imported.name : spec.imported.value

            this.imports.set(spec.local.name, {
              source,
              specifierName: importedName,
              isDefault: false,
            })
            if (isCss) this.cssModules.add(spec.local.name)
          }

          if (isImportDefaultSpecifier(spec)) {
            this.imports.set(spec.local.name, {
              source,
              specifierName: 'default',
              isDefault: true,
            })
            if (isCss) this.cssModules.add(spec.local.name)
          }
        })
      }
    })
  }

  public resolveExternalVariable(importPath: string, specifierName: string, currentFilePath: string): any {
    return new SchemaExtractor(this.fs).resolveExternalSchema(importPath, specifierName, currentFilePath)
  }
}
