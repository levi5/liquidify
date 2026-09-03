import { File, isIdentifier, stringLiteral } from '@babel/types'
import path from 'path'
import traverse from '@babel/traverse'

import { IFileSystem } from '../../../../../core/protocols/file-system'
import { NodeFileSystem } from '../../../fs/node-file-system'

export interface CSSImportResult {
  componentCss: string
  globalCss: string
}

export class CSSImportExtractor {
  constructor(private readonly fileSystem: IFileSystem = new NodeFileSystem()) {}

  public extract(ast: File, filePath: string): CSSImportResult {
    if (!filePath) return { componentCss: '', globalCss: '' }

    const importedStyleNames = new Set<string>()
    const result = this.processImports(ast, filePath, importedStyleNames)

    if (importedStyleNames.size > 0) {
      this.replaceStyleReferences(ast, importedStyleNames)
    }

    return result
  }

  private processImports(ast: File, filePath: string, importedStyleNames: Set<string>): CSSImportResult {
    let componentCss = ''
    let globalCss = ''
    const dir = path.dirname(filePath)

    traverse(ast, {
      ImportDeclaration: (pathNode) => {
        const source = pathNode.node.source.value
        if (!source.endsWith('.css')) return

        const absolutePath = path.resolve(dir, source)

        if (!this.fileSystem.existsSync(absolutePath)) {
          console.warn(`CSS file not found: ${absolutePath}`)
          return
        }

        const cssContent = this.fileSystem.readFileSync(absolutePath)
        const specifiers = pathNode.node.specifiers

        if (specifiers.length > 0) {
          componentCss += cssContent + '\n'
          specifiers.forEach((spec) => {
            if (isIdentifier(spec.local)) {
              importedStyleNames.add(spec.local.name)
            }
          })
        } else {
          globalCss += cssContent + '\n'
        }

        pathNode.remove()
      },
    })

    return { componentCss, globalCss }
  }

  private replaceStyleReferences(ast: File, importedStyleNames: Set<string>): void {
    traverse(ast, {
      MemberExpression(pathNode) {
        const { object, property } = pathNode.node

        const isStyleObject = isIdentifier(object) && importedStyleNames.has(object.name)
        const isStyleProperty = isIdentifier(property)

        if (isStyleObject && isStyleProperty) {
          pathNode.replaceWith(stringLiteral(property.name))
        }
      },
    })
  }
}
