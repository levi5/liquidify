import {
  type File,
  type Node,
  isUnaryExpression,
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
import { _match, _try } from 'funcio'

import type { IFileSystem } from '../../../../../core/protocols/file-system'
import { MAX_CSS_BYTES } from '../../../../../shared/liquid-constants'
import type { Logger } from '../../../../../shared/logger'

export interface CSSImportResult {
  componentCss: string
  globalCss: string
}

export type StaticValue = string | number | boolean | null | undefined | StaticValue[] | { [key: string]: StaticValue }

export const NOT_STATIC = Symbol('NOT_STATIC')

const STATIC_CLASSNAMES = new Set(['classnames', 'classNames', 'clsx'])

export function evaluateStatic(node: Node): StaticValue | typeof NOT_STATIC {
  return _match(true)
    .with(isStringLiteral(node), () => (node as { value: string }).value)
    .with(isNumericLiteral(node), () => (node as { value: number }).value)
    .with(isBooleanLiteral(node), () => (node as { value: boolean }).value)
    .with(isNullLiteral(node), () => null)
    .with(isIdentifier(node, { name: 'undefined' }), () => undefined)
    .with(isUnaryExpression(node), () => evaluateStaticUnary(node))
    .with(isArrayExpression(node), () => evaluateStaticArray(node))
    .with(isObjectExpression(node), () => evaluateStaticObject(node))
    .with(true, () => NOT_STATIC)
    .exec() as StaticValue | typeof NOT_STATIC
}

function evaluateStaticUnary(node: Node): StaticValue | typeof NOT_STATIC {
  const unary = node as { operator: string; argument: Node }
  return _match(true)
    .with(
      (unary.operator === '-' || unary.operator === '+') && isNumericLiteral(unary.argument),
      () => (unary.operator === '-' ? -1 : 1) * (unary.argument as { value: number }).value,
    )
    .with(unary.operator === '!' && isBooleanLiteral(unary.argument), () => !(unary.argument as { value: boolean }).value)
    .with(true, () => NOT_STATIC)
    .exec() as StaticValue | typeof NOT_STATIC
}

function evaluateStaticArray(node: Node): StaticValue[] | typeof NOT_STATIC {
  const values = (node as { elements: (Node | null)[] }).elements.map((element) =>
    _match(element === null)
      .with(true, () => NOT_STATIC)
      .with(false, () => evaluateStatic(element as Node))
      .exec(),
  )
  return _match(values.some((value) => value === NOT_STATIC))
    .with(true, () => NOT_STATIC)
    .with(false, () => values as StaticValue[])
    .exec() as StaticValue[] | typeof NOT_STATIC
}

function evaluateStaticObject(node: Node): Record<string, StaticValue> | typeof NOT_STATIC {
  const entries = (node as { properties: Node[] }).properties.map((property) => evaluateStaticEntry(property))
  return _match(entries.some((entry) => entry === NOT_STATIC))
    .with(true, () => NOT_STATIC)
    .with(false, () => Object.fromEntries(entries as [string, StaticValue][]))
    .exec() as Record<string, StaticValue> | typeof NOT_STATIC
}

function evaluateStaticEntry(property: Node): [string, StaticValue] | typeof NOT_STATIC {
  return _match(isObjectProperty(property))
    .with(true, () => evaluateStaticProperty(property))
    .with(false, () => NOT_STATIC)
    .exec() as [string, StaticValue] | typeof NOT_STATIC
}

function evaluateStaticProperty(property: Node): [string, StaticValue] | typeof NOT_STATIC {
  const prop = property as { key: Node; value: Node }
  const key = _match(true)
    .with(isIdentifier(prop.key), () => (prop.key as { name: string }).name)
    .with(isStringLiteral(prop.key), () => (prop.key as { value: string }).value)
    .with(true, () => null)
    .exec() as string | null
  const value = evaluateStatic(prop.value)
  return _match(key === null || value === NOT_STATIC)
    .with(true, () => NOT_STATIC)
    .with(false, () => [key as string, value as StaticValue])
    .exec() as [string, StaticValue] | typeof NOT_STATIC
}

export class CSSImportExtractor {
  constructor(
    private readonly fileSystem: IFileSystem,
    private readonly logger: Logger,
  ) {}

  public extract(ast: File, filePath: string): CSSImportResult {
    return _match(!filePath)
      .with(true, () => ({ componentCss: '', globalCss: '' }))
      .with(false, () => this.extractFrom(ast, filePath))
      .exec() as CSSImportResult
  }

  private extractFrom(ast: File, filePath: string): CSSImportResult {
    const importedStyleNames = new Set<string>()
    const classNamesIdentifiers = new Set<string>(STATIC_CLASSNAMES)
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
    const collected: CSSImportResult = { componentCss: '', globalCss: '' }
    const dir = path.dirname(filePath)
    traverse(ast, {
      ImportDeclaration: (pathNode) => this.processImport(pathNode, dir, collected, importedStyleNames, classNamesIdentifiers),
    })
    return collected
  }

  private processImport(
    pathNode: { node: { source: { value: string }; specifiers: { local?: Node }[] }; remove: () => void },
    dir: string,
    collected: CSSImportResult,
    importedStyleNames: Set<string>,
    classNamesIdentifiers: Set<string>,
  ): void {
    const source = pathNode.node.source.value
    _match(STATIC_CLASSNAMES.has(source))
      .with(true, () => this.consumeClassNamesImport(pathNode, classNamesIdentifiers))
      .with(false, () => this.processStyleImport(pathNode, dir, source, collected, importedStyleNames))
      .exec()
  }

  private consumeClassNamesImport(
    pathNode: { node: { specifiers: { local?: Node }[] }; remove: () => void },
    classNamesIdentifiers: Set<string>,
  ): void {
    pathNode.node.specifiers.forEach((spec) => {
      _match(isIdentifier(spec.local))
        .with(true, () => classNamesIdentifiers.add((spec.local as { name: string }).name))
        .with(false, () => undefined)
        .exec()
    })
    pathNode.remove()
  }

  private processStyleImport(
    pathNode: { node: { specifiers: { local?: Node }[] }; remove: () => void },
    dir: string,
    source: string,
    collected: CSSImportResult,
    importedStyleNames: Set<string>,
  ): void {
    _match(['.css', '.scss'].includes(path.extname(source).toLowerCase()))
      .with(true, () => this.loadStyle(pathNode, dir, source, collected, importedStyleNames))
      .with(false, () => undefined)
      .exec()
  }

  private loadStyle(
    pathNode: { node: { specifiers: { local?: Node }[] }; remove: () => void },
    dir: string,
    source: string,
    collected: CSSImportResult,
    importedStyleNames: Set<string>,
  ): void {
    const absolutePath = path.resolve(dir, source)
    _match(source.includes('\0'))
      .with(true, () => this.logger.warn(`CSS import with null byte ignored: ${source}`))
      .with(false, () => this.readStyle(pathNode, absolutePath, collected, importedStyleNames))
      .exec()
  }

  private readStyle(
    pathNode: { node: { specifiers: { local?: Node }[] }; remove: () => void },
    absolutePath: string,
    collected: CSSImportResult,
    importedStyleNames: Set<string>,
  ): void {
    _match(!this.fileSystem.existsSync(absolutePath))
      .with(true, () => this.logger.warn(`CSS file not found: ${absolutePath}`))
      .with(false, () => this.parseStyleContent(pathNode, absolutePath, collected, importedStyleNames))
      .exec()
  }

  private parseStyleContent(
    pathNode: { node: { specifiers: { local?: Node }[] }; remove: () => void },
    absolutePath: string,
    collected: CSSImportResult,
    importedStyleNames: Set<string>,
  ): void {
    _try
      .sync(() => this.fileSystem.readFileSync(absolutePath))
      .match({
        right: (content) => this.checkStyleSize(pathNode, absolutePath, content, collected, importedStyleNames),
        left: (error) => this.logger.warn(`CSS file unreadable: ${absolutePath} (${error.message})`),
      })
  }

  private checkStyleSize(
    pathNode: { node: { specifiers: { local?: Node }[] }; remove: () => void },
    absolutePath: string,
    cssContent: string,
    collected: CSSImportResult,
    importedStyleNames: Set<string>,
  ): void {
    _match(cssContent.length > MAX_CSS_BYTES)
      .with(true, () => this.logger.warn(`CSS file too large, skipping: ${absolutePath} (${cssContent.length} bytes)`))
      .with(false, () => this.appendStyle(pathNode, cssContent, collected, importedStyleNames))
      .exec()
  }

  private appendStyle(
    pathNode: { node: { specifiers: { local?: Node }[] }; remove: () => void },
    cssContent: string,
    collected: CSSImportResult,
    importedStyleNames: Set<string>,
  ): void {
    const specifiers = pathNode.node.specifiers
    _match(specifiers.length > 0)
      .with(true, () => this.appendComponentCss(collected, cssContent, specifiers, importedStyleNames))
      .with(false, () => {
        collected.globalCss += `${cssContent}\n`
      })
      .exec()
    pathNode.remove()
  }

  private appendComponentCss(
    collected: CSSImportResult,
    cssContent: string,
    specifiers: { local?: Node }[],
    importedStyleNames: Set<string>,
  ): void {
    collected.componentCss += `${cssContent}\n`
    specifiers.forEach((spec) => {
      _match(isIdentifier(spec.local))
        .with(true, () => importedStyleNames.add((spec.local as { name: string }).name))
        .with(false, () => undefined)
        .exec()
    })
  }

  private replaceStyleReferences(ast: File, importedStyleNames: Set<string>, classNamesIdentifiers: Set<string>): void {
    _match(importedStyleNames.size > 0)
      .with(true, () => this.replaceModuleReferences(ast, importedStyleNames))
      .with(false, () => undefined)
      .exec()
    traverse(ast, {
      CallExpression: (pathNode) => this.replaceClassNamesCall(pathNode, classNamesIdentifiers),
    })
  }

  private replaceModuleReferences(ast: File, importedStyleNames: Set<string>): void {
    traverse(ast, {
      MemberExpression: (pathNode) => {
        const { object, property } = pathNode.node
        _match(isIdentifier(object) && importedStyleNames.has(object.name))
          .with(true, () => this.replaceModuleProperty(pathNode, property))
          .with(false, () => undefined)
          .exec()
      },
    })
  }

  private replaceModuleProperty(pathNode: { replaceWith: (node: Node) => void }, property: Node): void {
    _match(true)
      .with(isIdentifier(property), () => pathNode.replaceWith(stringLiteral((property as { name: string }).name)))
      .with(isStringLiteral(property), () => pathNode.replaceWith(stringLiteral((property as { value: string }).value)))
      .with(true, () => undefined)
      .exec()
  }

  private replaceClassNamesCall(
    pathNode: { node: { callee: Node; arguments: Node[] }; replaceWith: (node: Node) => void },
    classNamesIdentifiers: Set<string>,
  ): void {
    const callee = pathNode.node.callee
    _match(isIdentifier(callee) && classNamesIdentifiers.has(callee.name))
      .with(true, () => this.foldClassNamesCall(pathNode))
      .with(false, () => undefined)
      .exec()
  }

  private foldClassNamesCall(pathNode: { node: { arguments: Node[] }; replaceWith: (node: Node) => void }): void {
    const evaluated = pathNode.node.arguments.map((arg) => evaluateStatic(arg))
    _match(evaluated.some((value) => value === NOT_STATIC))
      .with(true, () => undefined)
      .with(false, () => pathNode.replaceWith(stringLiteral(classNames(...(evaluated as StaticValue[])))))
      .exec()
  }
}
