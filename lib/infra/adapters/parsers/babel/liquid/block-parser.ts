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
  isStringLiteral,
  type Identifier,
  type StringLiteral,
  isIdentifier,
  isExpression,
} from '@babel/types'
import { _match } from 'funcio'
import { pascalToKebab } from '../../../../../shared/string'
import { ValidationError } from '../../../../../core/errors/validation-error'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

export class LiquidBlockParser {
  constructor(
    private readonly dynamicBlockTag: string,
    private readonly renderSnippetTag: string,
    private readonly getTagName: (element: JSXOpeningElement) => string,
  ) {}

  public processDynamicBlocks(node: JSXElement, context?: ParsingContext): { type: string }[] {
    const blocksSchema = this.collectBlocks(node, [], context)
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

  public validateDynamicBlock(node: JSXElement, context?: ParsingContext): void {
    this.extractDynamicBlockSlots(node, context)
  }

  private collectBlocks(node: JSXElement, blocksSchema: { type: string }[], context?: ParsingContext): { type: string }[] {
    _match(this.getTagName(node.openingElement) === this.dynamicBlockTag || this.getTagName(node.openingElement) === this.renderSnippetTag)
      .with(true, () => {
        this.extractDynamicBlockSlots(node, context).forEach((name) => {
          blocksSchema.push({ type: pascalToKebab(name) })
        })
      })
      .with(false, () => undefined)
      .exec()
    node.children.forEach((child) => {
      this.collectChildBlocks(child, blocksSchema, context)
    })
    return blocksSchema
  }

  private collectChildBlocks(child: JSXElement['children'][number], blocksSchema: { type: string }[], context?: ParsingContext): void {
    _match(isJSXElement(child))
      .with(true, () => this.collectBlocks(child as JSXElement, blocksSchema, context))
      .with(false, () => undefined)
      .exec()
  }

  private extractDynamicBlockSlots(node: JSXElement, context?: ParsingContext): string[] {
    const slotAttr = node.openingElement.attributes.find(
      (attr): attr is JSXAttribute => isJSXAttribute(attr) && isJSXIdentifier(attr.name) && attr.name.name === 'slot',
    )
    return _match(slotAttr === undefined)
      .with(true, () => [] as string[])
      .with(false, () => this.slotNames((slotAttr as JSXAttribute).value, context))
      .exec() as string[]
  }

  private slotNames(value: JSXAttribute['value'], context?: ParsingContext): string[] {
    return _match(true)
      .with(isStringLiteral(value), () => this.splitSlotLiteral((value as StringLiteral).value))
      .with(isJSXExpressionContainer(value), () => this.slotExpressionNames((value as { expression: Node }).expression, context))
      .with(true, () => [] as string[])
      .exec() as string[]
  }

  private splitSlotLiteral(raw: string): string[] {
    return raw
      .split(/[\s,]+/)
      .map((part) => part.trim())
      .filter(Boolean)
  }

  private slotExpressionNames(expression: Node, context?: ParsingContext): string[] {
    return _match(true)
      .with(isIdentifier(expression), () => [(expression as Identifier).name])
      .with(isStringLiteral(expression), () => this.splitSlotLiteral((expression as StringLiteral).value))
      .with(isArrayExpression(expression), () => this.identifierNames(expression as { elements: (Node | null)[] }, context))
      .with(isExpression(expression), () => {
        throw new ValidationError(
          'DynamicBlock/RenderSnippet "slot" must be a static string, identifier, or array of identifiers/strings (e.g. slot={[Header, Media]} or slot="header"). Dynamic expressions are not supported.',
          context?.currentFilePath,
        )
      })
      .with(true, () => [] as string[])
      .exec() as string[]
  }

  private identifierNames(expression: { elements: (Node | null)[] }, context?: ParsingContext): string[] {
    return expression.elements.flatMap((element) => {
      return _match(true)
        .with(element !== null && isIdentifier(element), () => [(element as Identifier).name])
        .with(element !== null && isStringLiteral(element), () => this.splitSlotLiteral((element as StringLiteral).value))
        .with(true, () => {
          throw new ValidationError(
            'DynamicBlock "slot" array must contain only identifiers or string literals (e.g. slot={[Header, "media"]}).',
            context?.currentFilePath,
          )
        })
        .exec() as string[]
    })
  }
}
