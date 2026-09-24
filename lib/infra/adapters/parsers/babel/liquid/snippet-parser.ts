import { _match } from 'funcio'
import { pascalToKebab } from '../../../../../shared/string'
import type { ReactComponentConfig } from '../../../../../types/liquid'
import {
  isStringLiteral,
  type JSXElement,
  type JSXAttribute,
  type StringLiteral,
  type Identifier,
  isJSXAttribute,
  isJSXIdentifier,
  isJSXExpressionContainer,
  isExpression,
  isIdentifier,
  isJSXSpreadAttribute,
  type Node,
  type JSXOpeningElement,
  type JSXExpressionContainer,
} from '@babel/types'

import type { ParsingContext } from '../../../../../core/entities/parsing-context'

interface SlotReference {
  name: string
  component: string
}

export class LiquidSnippetParser {
  constructor(
    private readonly getReactRegistry: () => Map<string, ReactComponentConfig>,
    private readonly addScriptAsset: (componentName: string, context?: ParsingContext) => void,
    private readonly generateLiquidCode: (node: Node, context?: ParsingContext) => string,
    private readonly renderChildren?: (
      children: JSXElement['children'],
      renames?: Record<string, string>,
      context?: ParsingContext,
    ) => string,
  ) {}

  public transformRenderSnippet(node: JSXElement, context?: ParsingContext): string {
    const slot = this.slotName(node.openingElement)
    return _match(slot.name === '')
      .with(true, () => '')
      .with(false, () => this.renderSnippet(node, slot, context))
      .exec() as string
  }

  private slotAttribute(openingElement: JSXOpeningElement): JSXAttribute | undefined {
    return openingElement.attributes.find(
      (attr): attr is JSXAttribute => isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name === 'slot',
    )
  }

  private slotName(openingElement: JSXOpeningElement): SlotReference {
    const slotAttr = this.slotAttribute(openingElement)
    return _match(slotAttr === undefined)
      .with(true, () => ({ name: '', component: '' }))
      .with(false, () => this.slotValue(slotAttr as JSXAttribute))
      .exec() as SlotReference
  }

  private slotValue(slotAttr: JSXAttribute): SlotReference {
    return _match(isJSXExpressionContainer(slotAttr.value) && isIdentifier((slotAttr.value as JSXExpressionContainer).expression))
      .with(true, () => this.componentSlot((slotAttr.value as JSXExpressionContainer).expression as Identifier))
      .with(false, () => this.literalSlot(slotAttr.value))
      .exec() as SlotReference
  }

  private componentSlot(expression: Identifier): SlotReference {
    return { name: pascalToKebab(expression.name), component: expression.name }
  }

  private literalSlot(value: JSXAttribute['value']): SlotReference {
    return _match(isStringLiteral(value))
      .with(true, () => ({ name: (value as StringLiteral).value, component: '' }))
      .with(false, () => ({ name: '', component: '' }))
      .exec() as SlotReference
  }

  private renderSnippet(node: JSXElement, slot: SlotReference, context?: ParsingContext): string {
    _match(slot.component !== '' && this.getReactRegistry().has(slot.component))
      .with(true, () => this.addScriptAsset(slot.component, context))
      .with(false, () => undefined)
      .exec()
    const props = this.extractSnippetProps(node.openingElement.attributes, context)
    const childrenCapture = this.captureChildren(node, context)
    const withChildren = _match(childrenCapture === '')
      .with(true, () => props)
      .with(false, () => [...props, 'children: snippet_content'])
      .exec() as string[]
    const propsString = _match(withChildren.length > 0)
      .with(true, () => `, ${withChildren.join(', ')}`)
      .with(false, () => '')
      .exec() as string
    return `${childrenCapture}{% render '${slot.name}'${propsString} %}`
  }

  private captureChildren(node: JSXElement, context?: ParsingContext): string {
    const content = _match(this.renderChildren !== undefined && (node.children ?? []).length > 0)
      .with(true, () => (this.renderChildren as NonNullable<LiquidSnippetParser['renderChildren']>)(node.children, undefined, context))
      .with(false, () => '')
      .exec() as string
    return _match(content.trim() !== '')
      .with(true, () => `{% capture snippet_content %}\n${content}\n{% endcapture %}\n`)
      .with(false, () => '')
      .exec() as string
  }

  private extractSnippetProps(attributes: JSXOpeningElement['attributes'], context?: ParsingContext): string[] {
    return attributes
      .filter((attr) => !isJSXSpreadAttribute(attr) && !this.isSlotAttribute(attr))
      .map((attr) => this.snippetProp(attr as JSXAttribute, context))
      .filter((prop) => prop !== '')
  }

  private isSlotAttribute(attr: JSXOpeningElement['attributes'][number]): boolean {
    return isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name === 'slot'
  }

  private snippetProp(attr: JSXAttribute, context?: ParsingContext): string {
    const name = (attr.name as { name: string }).name
    const value = _match(true)
      .with(isStringLiteral(attr.value), () => `'${(attr.value as StringLiteral).value}'`)
      .with(isJSXExpressionContainer(attr.value) && isExpression((attr.value as JSXExpressionContainer).expression), () =>
        this.generateLiquidCode((attr.value as JSXExpressionContainer).expression as Node, context),
      )
      .with(true, () => '')
      .exec() as string
    return _match(value === '')
      .with(true, () => '')
      .with(false, () => `${name}: ${value}`)
      .exec() as string
  }
}
