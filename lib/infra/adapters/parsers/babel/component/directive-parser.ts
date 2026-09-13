import { isDirective, isExpressionStatement, isStringLiteral, type Directive, type Statement } from '@babel/types'
import type { ComponentMetadataType } from '../../../../../types/component'

const DIRECTIVE_USE_DOM = /^use dom(:global)?$/
const DIRECTIVE_USE_SCRIPT = /^use script$/
const DIRECTIVE_REACT_PREFIX = /^use react(?:\s*\((#?[^)]+)\))?$/
const DIRECTIVE_TYPE_PREFIX = /^use (blocks|sections|snippets)$/

export class DirectiveParser {
  public parse(nodes: (Directive | Statement)[], metadata: ComponentMetadataType): void {
    for (const node of nodes) {
      const value = this.getDirectiveValue(node)
      if (!value) continue

      this.handleDomDirective(value, metadata)
      this.handleTypeDirective(value, metadata)
      this.handleReactDirective(value, metadata)
    }
  }

  private getDirectiveValue(node: Directive | Statement): string | null {
    if (isDirective(node)) return node.value.value
    if (isExpressionStatement(node) && isStringLiteral(node.expression)) return node.expression.value
    return null
  }

  private handleDomDirective(value: string, metadata: ComponentMetadataType): void {
    const isDom = value.match(DIRECTIVE_USE_DOM)
    const isScript = value.match(DIRECTIVE_USE_SCRIPT)

    if (!isDom && !isScript) return

    metadata.hasUseScript = true

    if (metadata.mode !== 'react') {
      const isGlobal = value === 'use dom:global' || isScript
      metadata.mode = isGlobal ? 'dom:global' : 'dom'
    }
  }

  private handleTypeDirective(value: string, metadata: ComponentMetadataType): void {
    const typeMatch = value.match(DIRECTIVE_TYPE_PREFIX)
    if (typeMatch) {
      metadata.type = typeMatch[1] as 'blocks' | 'sections' | 'snippets'
    }
  }

  private handleReactDirective(value: string, metadata: ComponentMetadataType): void {
    const reactMatch = value.match(DIRECTIVE_REACT_PREFIX)
    if (reactMatch) {
      metadata.mode = 'react'
      metadata.hasUseScript = true
      metadata.reactRootId = reactMatch[1]?.replace(/^#/, '') || ''
    }
  }
}
