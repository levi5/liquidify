import {
  type JSXOpeningElement,
  type JSXElement,
  isJSXAttribute,
  isJSXIdentifier,
  isJSXExpressionContainer,
  isJSXElement,
  isArrayExpression,
  type Identifier,
  isIdentifier,
} from '@babel/types'
import { pascalToKebab } from '../../../../../shared/string'
import { ParsingContext } from '../../../../../core/entities/parsing-context'

export class LiquidBlockParser {
  constructor(
    private readonly dynamicBlockTag: string,
    private readonly renderSnippetTag: string,
    private readonly getTagName: (element: JSXOpeningElement) => string,
  ) {}

  public processDynamicBlocks(node: JSXElement, context?: ParsingContext): { type: string }[] {
    const blocksSchema: { type: string }[] = []
    this.traverse(node, blocksSchema)
    if (context) {
      blocksSchema.forEach((b) => context.addBlockSchema(b))
    }
    return blocksSchema
  }

  private traverse(node: JSXElement, blocksSchema: { type: string }[]): void {
    const tagName = this.getTagName(node.openingElement)

    if (tagName === this.dynamicBlockTag || tagName === this.renderSnippetTag) {
      const slots = this.extractDynamicBlockSlots(node)
      slots.forEach((name) => {
        blocksSchema.push({
          type: pascalToKebab(name),
        })
      })
    }

    node.children.forEach((child) => {
      if (isJSXElement(child)) {
        this.traverse(child, blocksSchema)
      }
    })
  }

  private extractDynamicBlockSlots(node: JSXElement): string[] {
    const slotAttr = node.openingElement.attributes.find(
      (attr) => isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name === 'slot',
    )

    if (!slotAttr || !isJSXAttribute(slotAttr) || !slotAttr.value || !isJSXExpressionContainer(slotAttr.value)) {
      return []
    }

    const expr = slotAttr.value.expression

    if (!isArrayExpression(expr)) {
      return []
    }

    return expr.elements.filter((el): el is Identifier => isIdentifier(el)).map((el) => el.name)
  }
}
