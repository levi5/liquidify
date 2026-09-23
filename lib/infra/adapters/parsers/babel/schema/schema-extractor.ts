import { _try } from 'funcio'
import traverse from '@babel/traverse'
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
  type Node,
  type File,
} from '@babel/types'

import { parse } from '@babel/parser'
import { ModuleResolver } from '../../../fs/module-resolver'
import type { IFileSystem } from '../../../../../core/protocols/file-system'
import { NodeFileSystem } from '../../../fs/node-file-system'

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

  constructor(private readonly fs: IFileSystem = new NodeFileSystem()) {}

  public extract(ast: File, currentFilePath?: string): Schema {
    const state: ExtractionState = {
      localDecls: this.collectLocalDecls(ast),
      currentImports: this.collectImports(ast),
      currentFilePath,
      visitedIdentifiers: new Set<string>(),
    }

    let schema: Schema | null = null

    const accept = (node: Node): void => {
      const value = this.parseObject(node, state)
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new ValidationError('Schema must resolve to a static object.', currentFilePath)
      }
      schema = value
    }
    traverse(ast, {
      ExportNamedDeclaration: (nodePath) => {
        for (const specifier of nodePath.node.specifiers) {
          if (specifier.type !== 'ExportSpecifier') continue
          const exported = isIdentifier(specifier.exported) ? specifier.exported.name : specifier.exported.value
          if (exported !== 'schema') continue
          const value =
            nodePath.node.source && currentFilePath
              ? this.resolveExternalSchema(nodePath.node.source.value, specifier.local.name, currentFilePath)
              : this.parseObject(specifier.local, state)
          if (!value || typeof value !== 'object' || Array.isArray(value))
            throw new ValidationError('Schema must resolve to a static object.', currentFilePath)
          schema = value
        }
      },
      ExportDefaultDeclaration: (nodePath) => {
        const node = nodePath.node.declaration
        if (isObjectExpression(node)) accept(node)
        else if (isIdentifier(node) && node.name.toLowerCase() === 'schema') accept(node)
      },
      VariableDeclarator: (nodePath) => {
        if (nodePath.getFunctionParent()) return
        const { id, init } = nodePath.node
        if (isIdentifier(id) && id.name.toLowerCase() === 'schema' && init) accept(init)
      },
      AssignmentExpression: (nodePath) => {
        if (nodePath.getFunctionParent()) return
        const { left, right } = nodePath.node
        if (
          (isIdentifier(left) && left.name.toLowerCase() === 'schema') ||
          (isMemberExpression(left) && !left.computed && isIdentifier(left.property, { name: 'schema' }))
        )
          accept(right)
      },
    })
    return schema ?? {}
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

  private parseObject(node: any, state: ExtractionState): any {
    if (node === null || node === undefined) return null
    if (typeof node !== 'object' || !('type' in node)) return node

    if (isStringLiteral(node) || isNumericLiteral(node) || isBooleanLiteral(node)) {
      return node.value
    }

    if (node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression' || node.type === 'TSNonNullExpression')
      return this.parseObject(node.expression, state)
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
    const local = state.localDecls.get(node.name)
    const result = local ? this.parseObject(local, state) : this.resolveIdentifier(node.name, state)
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

  public resolveExternalSchema(importPath: string, specifierName: string, currentFilePath: string): any | null {
    const resolvedPath = new ModuleResolver(this.fs).resolve(importPath, currentFilePath)
    if (!resolvedPath) return null
    const key = `${resolvedPath}#${specifierName}`
    if (this.resolving.has(key)) throw new ValidationError(`Circular import while resolving ${specifierName}.`, resolvedPath)
    this.resolving.add(key)

    const result = _try.sync(() => {
      const content = this.fs.readFileSync(resolvedPath)
      const ast = this.parseFile(content)

      return this.extractExportedNode(ast, specifierName, resolvedPath)
    })

    this.resolving.delete(key)
    return result.match({
      left: (error) => {
        throw error
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

      if (node.type === 'ExportNamedDeclaration') {
        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ExportSpecifier') continue
          const exported = isIdentifier(specifier.exported) ? specifier.exported.name : specifier.exported.value
          if (exported !== specifierName) continue
          if (node.source && currentFilePath) return this.resolveExternalSchema(node.source.value, specifier.local.name, currentFilePath)
          return this.handleIdentifier(specifier.local, state)
        }
      }
      if (node.type === 'ExportAllDeclaration' && specifierName !== 'default' && currentFilePath) {
        const value = this.resolveExternalSchema(node.source.value, specifierName, currentFilePath)
        if (value !== null) return value
      }

      if (node.type === 'ExportDefaultDeclaration' && specifierName === 'default') {
        return this.parseObject(node.declaration, state)
      }
    }

    return null
  }

  private parseFile(content: string) {
    return parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    })
  }
}
