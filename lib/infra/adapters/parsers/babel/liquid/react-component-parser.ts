import generate from '@babel/generator'
import { _match } from 'funcio'
import { escapeHtml, jsonForHtml, liquidJsonOutput } from '../../../../../shared/html'
import type { ReactComponentConfig } from '../../../../../types/liquid'
import type { ImportResolver, ImportInfo } from './import-resolver'
import type { Expression, JSXAttribute, JSXElement, JSXEmptyExpression, JSXExpressionContainer, Node } from '@babel/types'
import { isJSXAttribute, isJSXExpressionContainer, isJSXIdentifier, isStringLiteral } from '@babel/types'
import { evaluateStatic, NOT_STATIC, type StaticValue } from '../css/import-extractor'

import type { ParsingContext } from '../../../../../core/entities/parsing-context'

interface CollectedProps {
  props: string[]
  elementId: string
  eager: boolean
}

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
    const config = this.getReactRegistry().get(tagName)
    return _match(config === undefined)
      .with(true, () => '')
      .with(false, () => this.renderIsland(node, tagName, config as ReactComponentConfig, context))
      .exec() as string
  }

  private renderIsland(node: JSXElement, tagName: string, config: ReactComponentConfig, context?: ParsingContext): string {
    this.addScriptAsset(tagName, context)
    return _match(!config.rootId)
      .with(true, () => this.renderHydrated(node, tagName, context))
      .with(false, () => `<div id="${escapeHtml(config.rootId as string)}"></div>`)
      .exec() as string
  }

  private renderHydrated(node: JSXElement, tagName: string, context?: ParsingContext): string {
    const collected = node.openingElement.attributes.reduce((acc, attr) => this.collectProp(acc, attr, context), {
      props: [] as string[],
      elementId: '',
      eager: false,
    })
    const children = this.renderChildren(node.children, undefined, context)
    const body = _match(collected.props.length > 0)
      .with(true, () => `<script type="application/json" data-react-props>{${collected.props.join(', ')}}</script>${children}`)
      .with(false, () => children)
      .exec() as string
    const eagerAttr = _match(collected.eager)
      .with(true, () => ' data-hydrate="eager"')
      .with(false, () => '')
      .exec() as string
    return `<react-island${collected.elementId}${eagerAttr} style="display: flex;" component="${tagName}">${body}</react-island>`
  }

  private collectProp(
    acc: CollectedProps,
    attr: JSXElement['openingElement']['attributes'][number],
    context?: ParsingContext,
  ): CollectedProps {
    return _match(isJSXAttribute(attr) && isJSXIdentifier(attr.name))
      .with(true, () => this.applyProp(acc, attr as JSXAttribute, context))
      .with(false, () => acc)
      .exec() as CollectedProps
  }

  private applyProp(acc: CollectedProps, attr: JSXAttribute, context?: ParsingContext): CollectedProps {
    const propName = (attr.name as { name: string }).name
    return _match(propName)
      .with('elementId', () => this.collectElementId(acc, attr, context))
      .with('eager', () => ({ ...acc, eager: true }))
      .with(propName, () => ({ ...acc, props: [...acc.props, `"${propName}": ${this.propValueOf(attr, context)}`] }))
      .exec() as CollectedProps
  }

  private collectElementId(acc: CollectedProps, attr: JSXAttribute, context?: ParsingContext): CollectedProps {
    const elementId = this.elementIdOf(attr)

    return {
      ...acc,
      elementId,
      props: elementId ? [...acc.props, `"elementId": ${this.propValueOf(attr, context)}`] : acc.props,
    }
  }

  private propValueOf(attr: JSXAttribute, context?: ParsingContext): string {
    return _match(true)
      .with(isStringLiteral(attr.value), () => jsonForHtml((attr.value as { value: string }).value))
      .with(isJSXExpressionContainer(attr.value), () =>
        this.parseExpressionContainer(
          (attr.value as JSXExpressionContainer).expression as Expression | JSXEmptyExpression,
          'true',
          context,
        ),
      )
      .with(true, () => 'true')
      .exec() as string
  }

  private elementIdOf(attr: JSXAttribute): string {
    const expression = this.expressionIdOf(attr.value)
    return _match(true)
      .with(isStringLiteral(attr.value), () => ` id="${escapeHtml((attr.value as { value: string }).value)}"`)
      .with(expression !== undefined, () => ` id="{{ ${generate(expression as Expression).code} | escape }}"`)
      .with(true, () => '')
      .exec() as string
  }

  private expressionIdOf(value: JSXAttribute['value']): Expression | undefined {
    return _match(isJSXExpressionContainer(value) && (value as JSXExpressionContainer).expression.type !== 'JSXEmptyExpression')
      .with(true, () => (value as JSXExpressionContainer).expression as Expression)
      .with(false, () => undefined)
      .exec() as Expression | undefined
  }

  private parseExpressionContainer(expression: Expression | JSXEmptyExpression, fallbackValue: string, context?: ParsingContext): string {
    return _match(true)
      .with(expression.type === 'StringLiteral' || expression.type === 'NumericLiteral' || expression.type === 'BooleanLiteral', () =>
        jsonForHtml((expression as { value: string | number | boolean }).value),
      )
      .with(expression.type === 'ObjectExpression' || expression.type === 'ArrayExpression', () => this.staticPropValue(expression as Node))
      .with(expression.type === 'Identifier', () => this.identifierPropValue(expression as Expression, context))
      .with(expression.type === 'MemberExpression', () => liquidJsonOutput(generate(expression as Expression).code))
      .with(true, () => fallbackValue)
      .exec() as string
  }

  private staticPropValue(expression: Node): string {
    const evaluated = evaluateStatic(expression)
    return _match(evaluated === NOT_STATIC)
      .with(true, () => liquidJsonOutput(generate(expression as Expression).code))
      .with(false, () => jsonForHtml((evaluated as StaticValue) === undefined ? null : evaluated))
      .exec() as string
  }

  private identifierPropValue(expression: Expression, context?: ParsingContext): string {
    const name = (expression as { name: string }).name
    const currentFilePath = context?.currentFilePath || this.getCurrentFilePath()
    return _match(!currentFilePath)
      .with(true, () => liquidJsonOutput(name))
      .with(false, () => this.importedPropValue(name, currentFilePath as string))
      .exec() as string
  }

  private importedPropValue(name: string, currentFilePath: string): string {
    const imported = this.importResolver.getImports().get(name)
    return _match(imported === undefined)
      .with(true, () => liquidJsonOutput(name))
      .with(false, () => this.resolvedPropValue(imported as ImportInfo, name, currentFilePath))
      .exec() as string
  }

  private resolvedPropValue(imported: ImportInfo, name: string, currentFilePath: string): string {
    const resolvedValue = this.importResolver.resolveExternalVariable(imported.source, imported.specifierName, currentFilePath)
    return _match(resolvedValue === null)
      .with(true, () => liquidJsonOutput(name))
      .with(false, () => jsonForHtml(resolvedValue))
      .exec() as string
  }
}
