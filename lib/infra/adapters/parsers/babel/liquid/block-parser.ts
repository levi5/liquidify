import {
  type JSXOpeningElement,
  type JSXElement,
  type JSXAttribute,
  type Node,
  isJSXAttribute,
  isJSXIdentifier,
  isJSXExpressionContainer,
  isJSXElement,
  isArrayExpression,
  type Identifier,
  isIdentifier,
} from '@babel/types'
import { _match } from 'funcio'
import { pascalToKebab } from '../../../../../shared/string'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

export class LiquidBlockParser {
  constructor(
    private readonly dynamicBlockTag: string,
    private readonly renderSnippetTag: string,
    private readonly getTagName: (element: JSXOpeningElement) => string,
  ) {}

  public processDynamicBlocks(node: JSXElement, context?: ParsingContext): { type: string }[] {
    const blocksSchema = this.collectBlocks(node, [])
    _match(context === undefined)
      .with(true, () => undefined)
      .with(false, () => {
        blocksSchema.forEach((block) => {
          ;(context as ParsingContext).addBlockSchema(block)
        })
      })
      .exec()
    return blocksSchema
  }

  private collectBlocks(node: JSXElement, blocksSchema: { type: string }[]): { type: string }[] {
    _match(this.getTagName(node.openingElement) === this.dynamicBlockTag || this.getTagName(node.openingElement) === this.renderSnippetTag)
      .with(true, () => {
        this.extractDynamicBlockSlots(node).forEach((name) => {
          blocksSchema.push({ type: pascalToKebab(name) })
        })
      })
      .with(false, () => undefined)
      .exec()
    node.children.forEach((child) => {
      this.collectChildBlocks(child, blocksSchema)
    })
    return blocksSchema
  }

  private collectChildBlocks(child: JSXElement['children'][number], blocksSchema: { type: string }[]): void {
    _match(isJSXElement(child))
      .with(true, () => this.collectBlocks(child as JSXElement, blocksSchema))
      .with(false, () => undefined)
      .exec()
  }

  private extractDynamicBlockSlots(node: JSXElement): string[] {
    const slotAttr = node.openingElement.attributes.find(
      (attr): attr is JSXAttribute => isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name === 'slot',
    )
    return _match(slotAttr === undefined || !isJSXAttribute(slotAttr) || !slotAttr.value || !isJSXExpressionContainer(slotAttr.value))
      .with(true, () => [] as string[])
      .with(false, () => this.slotNames((slotAttr as JSXAttribute).value))
      .exec() as string[]
  }

  private slotNames(value: JSXAttribute['value']): string[] {
    const expression = (value as { expression: Node }).expression
    return _match(!isArrayExpression(expression))
      .with(true, () => [] as string[])
      .with(false, () => this.identifierNames(expression as { elements: (Node | null)[] }))
      .exec() as string[]
  }

  private identifierNames(expression: { elements: (Node | null)[] }): string[] {
    return expression.elements.filter((element): element is Identifier => isIdentifier(element)).map((element) => element.name)
  }
}
