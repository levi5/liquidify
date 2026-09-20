import {
  isJSXAttribute,
  isJSXIdentifier,
  isJSXExpressionContainer,
  isObjectExpression,
  isObjectProperty,
  isIdentifier,
  isStringLiteral,
  isExpression,
  type JSXElement,
  type ObjectProperty,
} from '@babel/types'
import { _Maybe, _match } from 'funcio'
import type { LiquidAttributeConverter } from './attribute-parser'
import type { ExpressionParser } from './expression-parser'
import { liquidJsonOutput } from '../../../../../shared/html'
import { ParsingContext } from '../../../../../core/entities/parsing-context'

const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])

export class LiquidHtmlParser {
  constructor(
    private readonly attributeConverter: LiquidAttributeConverter,
    private readonly expressionParser: ExpressionParser,
    private readonly renderChildren: (children: any, renames?: Record<string, string>, context?: ParsingContext) => string,
  ) {}

  public renderHTMLElement(node: JSXElement, tagName: string, renames?: Record<string, string>, context?: ParsingContext): string {
    const state = { hasRawHtml: false, rawHtml: '', bridge: [] as any[] }
    const filteredAttributes = node.openingElement.attributes.filter((attr) => this.keepAttribute(attr, tagName, state, renames, context))
    const attributes = this.attributeConverter.getAttributes(filteredAttributes, renames, context)
    const children = _match(state.hasRawHtml)
      .with(true, () => state.rawHtml)
      .with(state.hasRawHtml, () => this.renderChildren(node.children, renames, context))
      .exec() as string
    const withBridge = _match(tagName === 'liquid-data' && state.bridge.length > 0)
      .with(true, () => `${this.bridgeScripts(state.bridge, renames, context)}${children}`)
      .with(tagName === 'liquid-data' && state.bridge.length > 0, () => children)
      .exec() as string
    return _match(Boolean(node.closingElement || state.hasRawHtml || tagName === 'liquid-data'))
      .with(true, () => `<${tagName}${attributes}>${withBridge}</${tagName}>`)
      .with(
        Boolean(node.closingElement || state.hasRawHtml || tagName === 'liquid-data'),
        () =>
          _match(voidTags.has(tagName))
            .with(true, () => `<${tagName}${attributes} />`)
            .with(voidTags.has(tagName), () => `<${tagName}${attributes}></${tagName}>`)
            .exec() as string,
      )
      .exec() as string
  }

  private keepAttribute(
    attr: any,
    tagName: string,
    state: { hasRawHtml: boolean; rawHtml: string; bridge: any[] },
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): boolean {
    return _match(isJSXAttribute(attr) && isJSXIdentifier(attr.name))
      .with(false, () => true)
      .with(isJSXAttribute(attr) && isJSXIdentifier(attr.name), () => {
        const name = attr.name.name
        return _match(name)
          .with('dangerouslySetInnerHTML', () => {
            state.hasRawHtml = true
            state.rawHtml = this.extractDangerouslyContent(attr, renames, context)
            return false
          })
          .with(
            name,
            () =>
              _match(tagName === 'liquid-data' && (name.startsWith('data-liquid') || name === 'store'))
                .with(true, () => {
                  state.bridge.push(attr)
                  return false
                })
                .with(tagName === 'liquid-data' && (name.startsWith('data-liquid') || name === 'store'), () => true)
                .exec() as boolean,
          )
          .exec() as boolean
      })
      .exec() as boolean
  }

  private bridgeScripts(attrs: any[], renames?: Record<string, string>, context?: ParsingContext): string {
    return attrs
      .map((attr) => {
        const name = isJSXIdentifier(attr.name) ? attr.name.name : ''
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

  private bridgeValue(attr: any, renames?: Record<string, string>, context?: ParsingContext): string {
    return _Maybe
      .of(attr.value)
      .map(
        (value) =>
          _match(true)
            .with(isStringLiteral(value), () => (value as any).value)
            .with(isJSXExpressionContainer(value), () =>
              liquidJsonOutput(this.expressionParser.generateLiquidCode((value as any).expression as any, false, renames, context)),
            )
            .with(true, () => '')
            .exec() as string,
      )
      .getOrElse('')
  }

  private extractDangerouslyContent(attr: any, renames?: Record<string, string>, context?: ParsingContext): string {
    return _Maybe
      .of(attr.value && isJSXExpressionContainer(attr.value) && isObjectExpression(attr.value.expression))
      .map((valid) => {
        if (!valid) return ''
        const htmlProp = (attr.value.expression.properties || []).find(
          (prop: any) =>
            isObjectProperty(prop) &&
            ((isIdentifier(prop.key) && prop.key.name === '__html') || (isStringLiteral(prop.key) && prop.key.value === '__html')),
        ) as ObjectProperty | undefined
        return _Maybe
          .of(htmlProp && isExpression((htmlProp as any)?.value))
          .map(() =>
            this.expressionParser.parseExpression(
              (htmlProp as any).value,
              renames,
              new ParsingContext({ ...context, outputContext: 'raw' }),
            ),
          )
          .getOrElse('')
      })
      .getOrElse('')
  }
}
