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
import { ValidationError } from '../../../../../core/errors/validation-error'

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
    const slot = this.slotName(node.openingElement, context)
    return _match(slot.name === '')
      .with(true, () => {
        throw new ValidationError(
          '<RenderSnippet> requires a static "slot" (e.g. slot="card" or slot={Badge}). Dynamic expressions are not supported.',
          context?.currentFilePath,
        )
      })
      .with(false, () => this.renderSnippet(node, slot, context))
      .exec() as string
  }

  private slotAttribute(openingElement: JSXOpeningElement): JSXAttribute | undefined {
    return openingElement.attributes.find(
      (attr): attr is JSXAttribute => isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name === 'slot',
    )
  }

  private slotName(openingElement: JSXOpeningElement, context?: ParsingContext): SlotReference {
    const slotAttr = this.slotAttribute(openingElement)
    return _match(slotAttr === undefined)
      .with(true, () => ({ name: '', component: '' }))
      .with(false, () => this.slotValue(slotAttr as JSXAttribute, context))
      .exec() as SlotReference
  }

  private slotValue(slotAttr: JSXAttribute, context?: ParsingContext): SlotReference {
    return _match(isJSXExpressionContainer(slotAttr.value) && isIdentifier((slotAttr.value as JSXExpressionContainer).expression))
      .with(true, () => this.componentSlot((slotAttr.value as JSXExpressionContainer).expression as Identifier))
      .with(false, () => this.literalSlot(slotAttr.value, context))
      .exec() as SlotReference
  }

  private componentSlot(expression: Identifier): SlotReference {
    return { name: pascalToKebab(expression.name), component: expression.name }
  }

  private literalSlot(value: JSXAttribute['value'], context?: ParsingContext): SlotReference {
    return _match(true)
      .with(isStringLiteral(value), () => ({ name: (value as StringLiteral).value, component: '' }))
      .with(isJSXExpressionContainer(value) && isStringLiteral((value as JSXExpressionContainer).expression), () => ({
        name: ((value as JSXExpressionContainer).expression as StringLiteral).value,
        component: '',
      }))
      .with(isJSXExpressionContainer(value), () => {
        throw new ValidationError(
          '<RenderSnippet> "slot" must be a static string or component reference (e.g. slot="card" or slot={Badge}).',
          context?.currentFilePath,
        )
      })
      .with(true, () => ({ name: '', component: '' }))
      .exec() as SlotReference
  }

  private renderSnippet(node: JSXElement, slot: SlotReference, context?: ParsingContext): string {
    _match(slot.component !== '' && this.getReactRegistry().has(slot.component))
      .with(true, () => this.addScriptAsset(slot.component, context))
      .with(false, () => undefined)
      .exec()
    const props = this.extractSnippetProps(node.openingElement.attributes, context)
    const withFor = this.extractWithFor(node.openingElement.attributes, context)
    const childrenCapture = this.captureChildren(node, context)
    const pending = context?.getPendingAssigns() ?? ''
    const withChildren = _match(childrenCapture === '')
      .with(true, () => props)
      .with(false, () => [...props, 'children: snippet_content'])
      .exec() as string[]
    const propsString = _match(withChildren.length > 0)
      .with(true, () => `, ${withChildren.join(', ')}`)
      .with(false, () => '')
      .exec() as string
    return `${pending}${childrenCapture}{% render '${slot.name}'${propsString}${withFor} %}`
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
    attributes.forEach((attr) => {
      _match(isJSXSpreadAttribute(attr))
        .with(true, () => {
          throw new ValidationError(
            'JSX spread attributes ({...props}) are not supported in RenderSnippet. List props explicitly (e.g. <RenderSnippet slot="card" title={title}>).',
            context?.currentFilePath,
          )
        })
        .with(false, () => undefined)
        .exec()
    })
    return attributes
      .filter((attr) => !isJSXSpreadAttribute(attr) && !this.isSlotAttribute(attr))
      .map((attr) => this.snippetProp(attr as JSXAttribute, context))
      .filter((prop) => prop !== '')
  }

  private isSlotAttribute(attr: JSXOpeningElement['attributes'][number]): boolean {
    return isJSXAttribute(attr) && isJSXIdentifier(attr.name) && ['slot', 'with', 'for', 'as'].includes(attr.name.name)
  }

  private extractWithFor(attributes: JSXOpeningElement['attributes'], context?: ParsingContext): string {
    const attributeValue = (name: string): string => {
      const attr = attributes.find(
        (entry): entry is JSXAttribute => isJSXAttribute(entry) && isJSXIdentifier(entry.name) && entry.name.name === name,
      )
      return _match(attr === undefined)
        .with(true, () => '')
        .with(false, () => this.snippetValue((attr as JSXAttribute).value, context))
        .exec() as string
    }
    const withValue = attributeValue('with')
    const forValue = attributeValue('for')
    const asValue = this.asNameOf(attributes, context)
    const withPart = withValue !== '' ? ` with ${withValue}` : ''
    const forPart = _match(forValue === '')
      .with(true, () => '')
      .with(false, () => (asValue !== '' ? ` for ${forValue} as ${asValue}` : ` for ${forValue}`))
      .exec() as string
    return `${withPart}${forPart}`
  }

  private asNameOf(attributes: JSXOpeningElement['attributes'], context?: ParsingContext): string {
    const attr = attributes.find(
      (entry): entry is JSXAttribute => isJSXAttribute(entry) && isJSXIdentifier(entry.name) && entry.name.name === 'as',
    )
    return _match(attr === undefined)
      .with(true, () => '')
      .with(false, () => this.asName((attr as JSXAttribute).value, context))
      .exec() as string
  }

  private asName(value: JSXAttribute['value'], context?: ParsingContext): string {
    return _match(true)
      .with(isStringLiteral(value), () => (value as StringLiteral).value.replace(/[^a-zA-Z0-9_]/g, ''))
      .with(isJSXExpressionContainer(value) && isIdentifier((value as JSXExpressionContainer).expression), () =>
        ((value as JSXExpressionContainer).expression as { name: string }).name.replace(/[^a-zA-Z0-9_]/g, ''),
      )
      .with(isJSXExpressionContainer(value) && isExpression((value as JSXExpressionContainer).expression), () =>
        this.generateLiquidCode((value as JSXExpressionContainer).expression as Node, context).replace(/^['"]|['"]$/g, ''),
      )
      .with(true, () => '')
      .exec() as string
  }

  private snippetValue(value: JSXAttribute['value'], context?: ParsingContext): string {
    return _match(true)
      .with(isStringLiteral(value), () => `'${(value as StringLiteral).value}'`)
      .with(isJSXExpressionContainer(value) && isExpression((value as JSXExpressionContainer).expression), () =>
        this.generateLiquidCode((value as JSXExpressionContainer).expression as Node, context),
      )
      .with(true, () => '')
      .exec() as string
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
