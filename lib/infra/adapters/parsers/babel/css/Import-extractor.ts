import {
  type File,
  type Node,
  isArrayExpression,
  isBooleanLiteral,
  isIdentifier,
  isNullLiteral,
  isNumericLiteral,
  isObjectExpression,
  isObjectProperty,
  isStringLiteral,
  stringLiteral,
} from '@babel/types'
import path from 'node:path'
import traverse from '@babel/traverse'
import classNames from 'classnames'

import type { IFileSystem } from '../../../../../core/protocols/file-system'
import { NodeFileSystem } from '../../../fs/node-file-system'

export interface CSSImportResult {
  componentCss: string
  globalCss: string
}

const NOT_STATIC = Symbol('NOT_STATIC')

function evaluateStatic(node: Node): any {
  if (isStringLiteral(node)) return node.value
  if (isNumericLiteral(node)) return node.value
  if (isBooleanLiteral(node)) return node.value
  if (isNullLiteral(node)) return null
  if (isIdentifier(node, { name: 'undefined' })) return undefined
  if (isArrayExpression(node)) {
    const arr: any[] = []
    for (const el of node.elements) {
      if (!el) continue
      const res = evaluateStatic(el)
      if (res === NOT_STATIC) return NOT_STATIC
      arr.push(res)
    }
    return arr
  }
  if (isObjectExpression(node)) {
    const obj: Record<string, any> = {}
    for (const prop of node.properties) {
      if (isObjectProperty(prop)) {
        const key = isIdentifier(prop.key) ? prop.key.name : isStringLiteral(prop.key) ? prop.key.value : null
        if (!key) return NOT_STATIC
        const val = evaluateStatic(prop.value)
        if (val === NOT_STATIC) return NOT_STATIC
        obj[key] = val
      } else {
        return NOT_STATIC
      }
    }
    return obj
  }
  return NOT_STATIC
}

export class CSSImportExtractor {
  constructor(private readonly fileSystem: IFileSystem = new NodeFileSystem()) {}

  public extract(ast: File, filePath: string): CSSImportResult {
    if (!filePath) return { componentCss: '', globalCss: '' }

    const importedStyleNames = new Set<string>()
    const classNamesIdentifiers = new Set<string>(['classnames', 'classNames', 'clsx'])
    const result = this.processImports(ast, filePath, importedStyleNames, classNamesIdentifiers)

    this.replaceStyleReferences(ast, importedStyleNames, classNamesIdentifiers)

    return result
  }

  private processImports(
    ast: File,
    filePath: string,
    importedStyleNames: Set<string>,
    classNamesIdentifiers: Set<string>,
  ): CSSImportResult {
    let componentCss = ''
    let globalCss = ''
    const dir = path.dirname(filePath)

    traverse(ast, {
      ImportDeclaration: (pathNode) => {
        const source = pathNode.node.source.value
        if (source === 'classnames' || source === 'clsx') {
          pathNode.node.specifiers.forEach((spec) => {
            if (isIdentifier(spec.local)) {
              classNamesIdentifiers.add(spec.local.name)
            }
          })
          pathNode.remove()
          return
        }

        if (!source.endsWith('.css')) return

        const absolutePath = path.resolve(dir, source)

        if (!this.fileSystem.existsSync(absolutePath)) {
          console.warn(`CSS file not found: ${absolutePath}`)
          return
        }

        const cssContent = this.fileSystem.readFileSync(absolutePath)
        const specifiers = pathNode.node.specifiers

        if (specifiers.length > 0) {
          componentCss += `${cssContent}\n`
          specifiers.forEach((spec) => {
            if (isIdentifier(spec.local)) {
              importedStyleNames.add(spec.local.name)
            }
          })
        } else {
          globalCss += `${cssContent}\n`
        }

        pathNode.remove()
      },
    })

    return { componentCss, globalCss }
  }

  private replaceStyleReferences(ast: File, importedStyleNames: Set<string>, classNamesIdentifiers: Set<string>): void {
    if (importedStyleNames.size > 0) {
      traverse(ast, {
        MemberExpression(pathNode) {
          const { object, property } = pathNode.node

          const isStyleObject = isIdentifier(object) && importedStyleNames.has(object.name)

          if (isStyleObject) {
            if (isIdentifier(property)) {
              pathNode.replaceWith(stringLiteral(property.name))
            } else if (isStringLiteral(property)) {
              pathNode.replaceWith(stringLiteral(property.value))
            }
          }
        },
      })
    }

    traverse(ast, {
      CallExpression(pathNode) {
        const callee = pathNode.node.callee
        const isClassNames = isIdentifier(callee) && classNamesIdentifiers.has(callee.name)

        if (isClassNames) {
          const args = pathNode.node.arguments
          const evaluated: any[] = []
          let allStatic = true

          for (const arg of args) {
            const val = evaluateStatic(arg as Node)
            if (val === NOT_STATIC) {
              allStatic = false
              break
            }
            evaluated.push(val)
          }

          if (allStatic) {
            const classString = classNames(...evaluated)
            pathNode.replaceWith(stringLiteral(classString))
          }
        }
      },
    })
  }
}
