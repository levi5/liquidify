import type { IFileSystem } from '../../../../../core/protocols/file-system'
import {
  isBooleanLiteral,
  type File,
  type Node,
  isExportDefaultDeclaration,
  isExportNamedDeclaration,
  isIdentifier,
  isImportDeclaration,
  isImportDefaultSpecifier,
  isImportSpecifier,
  isNumericLiteral,
  isObjectProperty,
  isStringLiteral,
  isVariableDeclaration,
  isVariableDeclarator,
  traverseFast,
  isArrayExpression,
  isObjectExpression,
} from '@babel/types'

export interface ImportInfo {
  source: string
  specifierName: string
  isDefault: boolean
}

export class ImportResolver {
  private imports: Map<string, ImportInfo> = new Map()
  private cssModules: Set<string> = new Set()
  private readonly allowedExtensions = ['.ts', '.tsx', '.js', '.jsx']

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
    const resolvedPath = this.resolveFilePath(importPath, currentFilePath)
    if (!resolvedPath) return null

    try {
      const { parse } = require('@babel/parser')
      const content = this.fs.readFileSync(resolvedPath)
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
      })

      let result: any = null

      traverseFast(ast, (pathNode) => {
        if (isExportNamedDeclaration(pathNode) && pathNode.declaration && isVariableDeclaration(pathNode.declaration)) {
          for (const decl of pathNode.declaration.declarations) {
            if (isVariableDeclarator(decl) && isIdentifier(decl.id) && decl.id.name === specifierName && decl.init) {
              result = this.parseObject(decl.init)
            }
          }
        } else if (isExportDefaultDeclaration(pathNode) && specifierName === 'default') {
          result = this.parseObject(pathNode.declaration as Node)
        }
      })

      return result
    } catch (error) {
      console.warn(`Could not resolve external variable: ${importPath}`, error)
      return null
    }
  }

  private resolveFilePath(importPath: string, currentFilePath: string): string | null {
    const path = require('path')
    let basePath = path.resolve(path.dirname(currentFilePath), importPath)

    if (this.fs.existsSync(basePath)) return basePath

    for (const ext of this.allowedExtensions) {
      const fullPath = basePath + ext
      if (this.fs.existsSync(fullPath)) return fullPath
    }

    return null
  }

  private parseObject(node: Node): any {
    if (isStringLiteral(node)) return node.value
    if (isNumericLiteral(node)) return node.value
    if (isBooleanLiteral(node)) return node.value

    if (isArrayExpression(node)) {
      return node.elements.map((el) => (el ? this.parseObject(el) : null))
    }

    if (isObjectExpression(node)) {
      const result: Record<string, unknown> = {}

      for (const prop of node.properties) {
        if (!isObjectProperty(prop)) continue

        const key = isIdentifier(prop.key)
          ? prop.key.name
          : isStringLiteral(prop.key) || isNumericLiteral(prop.key)
            ? String(prop.key.value)
            : ''

        if (key) {
          result[key] = this.parseObject(prop.value)
        }
      }

      return result
    }

    return null
  }
}
