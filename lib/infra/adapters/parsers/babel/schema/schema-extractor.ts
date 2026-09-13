import traverse from '@babel/traverse'
import { _try } from 'funcio/lib/Monads/Either'
import {
  isArrayExpression,
  isBooleanLiteral,
  isIdentifier,
  isNumericLiteral,
  isObjectExpression,
  isObjectProperty,
  isStringLiteral,
  isVariableDeclaration,
  isVariableDeclarator,
  isSpreadElement,
  type Node,
  type File,
} from '@babel/types'

import { parse } from '@babel/parser'
import * as path from 'path'
import type { IFileSystem } from '../../../../../core/protocols/file-system'
import { NodeFileSystem } from '../../../fs/node-file-system'

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
  private readonly allowedExtensions = ['.ts', '.tsx', '.js', '.jsx']

  constructor(private readonly fs: IFileSystem = new NodeFileSystem()) {}

  public extract(ast: File, currentFilePath?: string): Schema {
    const state: ExtractionState = {
      localDecls: this.collectLocalDecls(ast),
      currentImports: this.collectImports(ast),
      currentFilePath,
      visitedIdentifiers: new Set<string>(),
    }

    let schema: Schema | null = null

    traverse(ast, {
      ExportDefaultDeclaration: (path) => {
        schema = this.extractFromNode(path.node.declaration, state) || schema
      },

      VariableDeclaration: (path) => {
        schema = this.extractFromVariable(path.node, state) || schema
      },

      AssignmentExpression: (path) => {
        schema = this.extractFromAssignment(path.node.right, state) || schema
      },
    })

    return (schema as any) ?? {}
  }

  private collectImports(ast: File): Map<string, ImportMapValue> {
    const imports = new Map<string, ImportMapValue>()

    traverse(ast, {
      ImportDeclaration: (path) => {
        const source = path.node.source.value

        for (const spec of path.node.specifiers) {
          if (spec.type === 'ImportSpecifier') {
            const importedName = isIdentifier(spec.imported) ? spec.imported.name : spec.imported.value
            imports.set(spec.local.name, { source, specifierName: importedName, isDefault: false })
          }

          if (spec.type === 'ImportDefaultSpecifier') {
            imports.set(spec.local.name, { source, specifierName: 'default', isDefault: true })
          }
        }
      },
    })

    return imports
  }

  private collectLocalDecls(ast: File): Map<string, Node> {
    const decls = new Map<string, Node>()

    for (const node of ast.program.body) {
      const declaration = this.getDeclarationFromNode(node)
      if (!declaration) continue

      for (const decl of declaration.declarations) {
        if (isIdentifier(decl.id) && decl.init) {
          decls.set(decl.id.name, decl.init)
        }
      }
    }

    return decls
  }

  private getDeclarationFromNode(node: any): any | null {
    if (isVariableDeclaration(node)) return node
    if (node.type === 'ExportNamedDeclaration' && node.declaration && isVariableDeclaration(node.declaration)) {
      return node.declaration
    }
    return null
  }

  private extractFromNode(node: Node, state: ExtractionState): Schema | null {
    if (isObjectExpression(node) || isArrayExpression(node) || isIdentifier(node)) {
      return this.parseObject(node, state)
    }
    return null
  }

  private extractFromVariable(node: any, state: ExtractionState): Schema | null {
    if (!isVariableDeclaration(node)) return null

    for (const decl of node.declarations) {
      const isSchema = isVariableDeclarator(decl) && isIdentifier(decl.id) && decl.id.name.toLowerCase() === 'schema'
      if (isSchema && decl.init) {
        return this.parseObject(decl.init, state)
      }
    }

    return null
  }

  private extractFromAssignment(rightNode: Node, state: ExtractionState): Schema | null {
    return this.parseObject(rightNode, state)
  }

  private parseObject(node: any, state: ExtractionState): any {
    if (node === null || node === undefined) return null
    if (typeof node !== 'object' || !('type' in node)) return node

    if (isStringLiteral(node) || isNumericLiteral(node) || isBooleanLiteral(node)) {
      return node.value
    }

    if (isIdentifier(node)) return this.handleIdentifier(node, state)
    if (isArrayExpression(node)) return this.handleArrayExpression(node, state)
    if (isObjectExpression(node)) return this.handleObjectExpression(node, state)

    return null
  }

  private handleIdentifier(node: any, state: ExtractionState): any {
    if (state.visitedIdentifiers.has(node.name)) {
      console.warn(`Circular reference detected for identifier: ${node.name}`)
      return null
    }

    state.visitedIdentifiers.add(node.name)
    const resolved = this.resolveIdentifier(node.name, state)
    const result = this.parseObject(resolved, state)
    state.visitedIdentifiers.delete(node.name)
    return result
  }

  private handleArrayExpression(node: any, state: ExtractionState): any[] {
    const result: any[] = []
    for (const el of node.elements) {
      if (!el) continue
      if (isSpreadElement(el)) {
        const spreadValue = this.parseObject(el.argument, state)
        if (Array.isArray(spreadValue)) result.push(...spreadValue)
      } else {
        result.push(this.parseObject(el, state))
      }
    }
    return result
  }

  private handleObjectExpression(node: any, state: ExtractionState): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (const prop of node.properties) {
      if (isSpreadElement(prop)) {
        const spreadValue = this.parseObject(prop.argument, state)
        if (typeof spreadValue === 'object' && spreadValue !== null) {
          Object.assign(result, spreadValue)
        }
        continue
      }

      if (!isObjectProperty(prop)) continue

      const key = this.getPropertyKey(prop)
      if (key) {
        result[key] = this.parseObject(prop.value, state)
      }
    }

    return result
  }

  private getPropertyKey(prop: any): string {
    if (isIdentifier(prop.key)) return prop.key.name
    if (isStringLiteral(prop.key) || isNumericLiteral(prop.key)) return String(prop.key.value)
    return ''
  }

  private resolveIdentifier(name: string, state: ExtractionState): any | null {
    const local = state.localDecls.get(name)
    if (local) return local

    const imported = state.currentImports.get(name)
    if (imported && state.currentFilePath) {
      return this.resolveExternalSchema(imported.source, imported.specifierName, state.currentFilePath)
    }

    return null
  }

  private resolveExternalSchema(importPath: string, specifierName: string, currentFilePath: string): any | null {
    const resolvedPath = this.resolveFilePath(importPath, currentFilePath)
    if (!resolvedPath) return null

    const result = _try.sync(() => {
      const content = this.fs.readFileSync(resolvedPath)
      const ast = this.parseFile(content)

      const externalExtractor = new SchemaExtractor(this.fs)
      return externalExtractor.extractExportedNode(ast, specifierName, resolvedPath)
    })

    return result.match({
      left: (error) => {
        console.warn(`Could not resolve external schema: ${importPath}`, error)
        return null
      },
      right: (schema) => schema,
    })
  }

  private extractExportedNode(ast: File, specifierName: string, currentFilePath?: string): any | null {
    const state: ExtractionState = {
      localDecls: this.collectLocalDecls(ast),
      currentImports: this.collectImports(ast),
      currentFilePath,
      visitedIdentifiers: new Set<string>(),
    }

    for (const node of ast.program.body) {
      if (node.type === 'ExportNamedDeclaration' && node.declaration && isVariableDeclaration(node.declaration)) {
        for (const decl of node.declaration.declarations) {
          if (isIdentifier(decl.id) && decl.id.name === specifierName && decl.init) {
            return this.parseObject(decl.init, state)
          }
        }
      }

      if (node.type === 'ExportDefaultDeclaration' && specifierName === 'default') {
        return this.parseObject(node.declaration, state)
      }
    }

    return null
  }

  private resolveFilePath(importPath: string, currentFilePath: string): string | null {
    const basePath = path.resolve(path.dirname(currentFilePath), importPath)

    if (this.fs.existsSync(basePath)) return basePath

    const foundExt = this.allowedExtensions.find((ext) => this.fs.existsSync(basePath + ext))
    return foundExt ? basePath + foundExt : null
  }

  private parseFile(content: string) {
    return parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    })
  }
}
