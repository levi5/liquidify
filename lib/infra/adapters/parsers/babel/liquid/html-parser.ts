import {
  isJSXAttribute,
  isJSXIdentifier,
  isJSXExpressionContainer,
  isObjectExpression,
  isObjectProperty,
  isIdentifier,
  isStringLiteral,
  isExpression,
  type JSXAttribute,
  type JSXElement,
  type JSXExpressionContainer,
  type JSXIdentifier,
  type JSXSpreadAttribute,
  type StringLiteral,
} from '@babel/types'
import { _Maybe, _match } from 'funcio'
import type { LiquidAttributeConverter } from './attribute-parser'
import type { ExpressionParser } from './expression-parser'
import { liquidJsonOutput } from '../../../../../shared/html'
import { ParsingContext } from '../../../../../core/entities/parsing-context'
import { VOID_TAGS as voidTags } from '../../../../../shared/liquid-constants'

export class LiquidHtmlParser {
  constructor(
    private readonly attributeConverter: LiquidAttributeConverter,
    private readonly expressionParser: ExpressionParser,
    private readonly renderChildren: (
      children: JSXElement['children'],
      renames?: Record<string, string>,
      context?: ParsingContext,
    ) => string,
  ) {}

  public renderHTMLElement(node: JSXElement, tagName: string, renames?: Record<string, string>, context?: ParsingContext): string {
    const state = { hasRawHtml: false, rawHtml: '', bridge: [] as JSXAttribute[] }
    const filteredAttributes = node.openingElement.attributes.filter((attr) => this.keepAttribute(attr, tagName, state, renames, context))
    if (state.hasRawHtml && voidTags.has(tagName)) {
      throw new Error(`dangerouslySetInnerHTML cannot be used on void element <${tagName} />.`)
    }
    const attributes = this.attributeConverter.getAttributes(filteredAttributes, renames, context)
    const childContext = _match(tagName === 'style' || tagName === 'script')
      .with(true, () => ParsingContext.derive(context, { outputContext: 'raw' }))
      .with(false, () => context)
      .exec() as ParsingContext | undefined
    const children = _match(state.hasRawHtml)
      .with(true, () => state.rawHtml)
      .with(state.hasRawHtml, () => this.renderChildren(node.children, renames, childContext))
      .exec() as string
    const withBridge = _match(tagName === 'liquid-data' && state.bridge.length > 0)
      .with(true, () => `${this.bridgeScripts(state.bridge, renames, context)}${children}`)
      .with(tagName === 'liquid-data' && state.bridge.length > 0, () => children)
      .exec() as string
    return _match(Boolean(node.closingElement || state.hasRawHtml || tagName === 'liquid-data'))
      .with(true, () => `<${tagName}${attributes}>${withBridge}</${tagName}>`)
      .with(
        false,
        () =>
          _match(voidTags.has(tagName))
            .with(true, () => `<${tagName}${attributes} />`)
            .with(false, () => `<${tagName}${attributes}></${tagName}>`)
            .exec() as string,
      )
      .exec() as string
  }

  private keepAttribute(
    attr: JSXAttribute | JSXSpreadAttribute,
    tagName: string,
    state: { hasRawHtml: boolean; rawHtml: string; bridge: JSXAttribute[] },
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): boolean {
    return _match(isJSXAttribute(attr) && isJSXIdentifier(attr.name))
      .with(false, () => true)
      .with(isJSXAttribute(attr) && isJSXIdentifier(attr.name), () => {
        const name = ((attr as JSXAttribute).name as JSXIdentifier).name
        const jsxAttr = attr as JSXAttribute
        return _match(name)
          .with('dangerouslySetInnerHTML', () => {
            state.hasRawHtml = true
            state.rawHtml = this.extractDangerouslyContent(jsxAttr, renames, context)
            return false
          })
          .with(
            name,
            () =>
              _match(tagName === 'liquid-data' && (name.startsWith('data-liquid') || name === 'store'))
                .with(true, () => {
                  state.bridge.push(jsxAttr)
                  return false
                })
                .with(tagName === 'liquid-data' && (name.startsWith('data-liquid') || name === 'store'), () => true)
                .exec() as boolean,
          )
          .exec() as boolean
      })
      .exec() as boolean
  }

  private bridgeScripts(attrs: JSXAttribute[], renames?: Record<string, string>, context?: ParsingContext): string {
    return attrs
      .map((attr) => {
        const name = _match(isJSXIdentifier(attr.name))
          .with(true, () => (attr.name as JSXIdentifier).name)
          .with(false, () => '')
          .exec() as string
        const propName = _match(name)
          .with('data-liquid', () => 'store')
          .with('data-liquid-store', () => 'store')
          .with('store', () => 'store')
          .with(name, () => name.replace('data-liquid-', ''))
          .exec() as string
        const val = this.bridgeValue(attr, renames, context)
        const finalVal = _match(val.includes('{{') && !val.includes('| json'))
          .with(true, () => val.replace(/{{(.*?)}}/g, (_, code) => liquidJsonOutput(code.trim())))
          .with(val.includes('{{') && !val.includes('| json'), () => val)
          .exec() as string
        return `<script type="application/json" data-liquid-${propName}>${finalVal}</script>`
      })
      .join('\n')
  }

  private bridgeValue(attr: JSXAttribute, renames?: Record<string, string>, context?: ParsingContext): string {
    return _Maybe
      .of(attr.value)
      .map(
        (value) =>
          _match(true)
            .with(isStringLiteral(value), () => (value as StringLiteral).value)
            .with(isJSXExpressionContainer(value), () =>
              liquidJsonOutput(
                this.expressionParser.generateLiquidCode((value as JSXExpressionContainer).expression, false, renames, context),
              ),
            )
            .with(true, () => '')
            .exec() as string,
      )
      .getOrElse('')
  }

  private extractDangerouslyContent(attr: JSXAttribute, renames?: Record<string, string>, context?: ParsingContext): string {
    const container = attr.value
    if (!isJSXExpressionContainer(container) || !isObjectExpression(container.expression)) {
      throw new Error('dangerouslySetInnerHTML requires an object literal like {{ __html: code }}.')
    }
    return this.dangerouslyHtml(attr, renames, context)
  }

  private dangerouslyHtml(attr: JSXAttribute, renames?: Record<string, string>, context?: ParsingContext): string {
    const container = attr.value
    if (!isJSXExpressionContainer(container) || !isObjectExpression(container.expression)) return ''
    const htmlProp = container.expression.properties.find(
      (prop) =>
        isObjectProperty(prop) &&
        ((isIdentifier(prop.key) && prop.key.name === '__html') || (isStringLiteral(prop.key) && prop.key.value === '__html')),
    )
    if (htmlProp === undefined || !isObjectProperty(htmlProp) || !isExpression(htmlProp.value)) {
      throw new Error('dangerouslySetInnerHTML requires an __html property with an expression value.')
    }

    return this.expressionParser.parseExpression(htmlProp.value, renames, ParsingContext.derive(context, { outputContext: 'raw' }))
  }
}
