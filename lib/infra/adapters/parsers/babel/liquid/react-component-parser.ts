import generate from '@babel/generator'
import { escapeHtml, jsonForHtml, liquidJsonOutput } from '../../../../../shared/html'
import type { ReactComponentConfig } from '../../../../../types/liquid'
import type { ImportResolver } from './import-resolver'
import type { Expression, JSXElement, JSXEmptyExpression } from '@babel/types'

import type { ParsingContext } from '../../../../../core/entities/parsing-context'

export class ReactComponentParser {
  constructor(
    private readonly getReactRegistry: () => Map<string, ReactComponentConfig>,
    private readonly addScriptAsset: (componentName: string, context?: ParsingContext) => void,
    private readonly importResolver: ImportResolver,
    private readonly getCurrentFilePath: () => string | undefined,
    private readonly renderChildren: (
      children: JSXElement['children'],
      renames?: Record<string, string>,
      context?: ParsingContext,
    ) => string,
  ) {}

  public transformReactComponent(node: JSXElement, tagName: string, context?: ParsingContext): string {
    const registry = this.getReactRegistry()
    if (!registry.has(tagName)) {
      return ''
    }

    this.addScriptAsset(tagName, context)
    const config = registry.get(tagName)!

    if (config.rootId) {
      return `<div id="${escapeHtml(config.rootId)}"></div>`
    }

    const propsObj: string[] = []
    let elementId = ''
    let eagerHydration = false

    if (node.openingElement.attributes.length > 0) {
      for (const attr of node.openingElement.attributes) {
        if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier') {
          const propName = attr.name.name
          let propValue: string = 'true'

          if (attr.value) {
            if (attr.value.type === 'StringLiteral') {
              propValue = jsonForHtml(attr.value.value)
            } else if (attr.value.type === 'JSXExpressionContainer') {
              propValue = this.parseExpressionContainer(attr.value.expression, propValue, context)
            }
          }

          if (propName === 'elementId') {
            elementId =
              attr.value?.type === 'StringLiteral'
                ? ` id="${escapeHtml(attr.value.value)}"`
                : ` id="{{ ${generate((attr.value as any).expression).code} | escape }}"`
          } else if (propName === 'eager') {
            eagerHydration = true
          } else {
            propsObj.push(`"${propName}": ${propValue}`)
          }
        }
      }
    }

    let childrenHTML = this.renderChildren(node.children, undefined, context)

    if (propsObj.length > 0) {
      childrenHTML = `<script type="application/json" data-react-props>{${propsObj.join(', ')}}</script>${childrenHTML}`
    }

    const eagerAttr = eagerHydration ? ' data-hydrate="eager"' : ''
    return `<react-island${elementId}${eagerAttr} style="display: flex;" component="${tagName}">${childrenHTML}</react-island>`
  }

  private parseExpressionContainer(expression: Expression | JSXEmptyExpression, fallbackValue: string, context?: ParsingContext): string {
    if (expression.type === 'StringLiteral' || expression.type === 'NumericLiteral' || expression.type === 'BooleanLiteral') {
      return jsonForHtml(expression.value)
    }

    if (expression.type === 'ObjectExpression' || expression.type === 'ArrayExpression') {
      const code = generate(expression).code
      try {
        const evaluated = new Function(`return ${code}`)()
        return jsonForHtml(evaluated)
      } catch (error) {
        console.info(error)
        return liquidJsonOutput(code)
      }
    }

    if (expression.type === 'Identifier') {
      const name = expression.name
      const imports = this.importResolver.getImports()
      const currentFilePath = context?.currentFilePath || this.getCurrentFilePath()

      if (currentFilePath && imports.has(name)) {
        const imported = imports.get(name)!
        const resolvedValue = this.importResolver.resolveExternalVariable(imported.source, imported.specifierName, currentFilePath)
        if (resolvedValue !== null) {
          return jsonForHtml(resolvedValue)
        }
      }
      return liquidJsonOutput(name)
    }

    if (expression.type === 'MemberExpression') {
      const code = generate(expression).code
      return liquidJsonOutput(code)
    }

    return fallbackValue
  }
}
