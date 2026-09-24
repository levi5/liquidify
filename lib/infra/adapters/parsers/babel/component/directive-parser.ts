import { _match } from 'funcio'
import { isDirective, isExpressionStatement, isStringLiteral, type Directive, type Statement } from '@babel/types'
import type { ComponentMetadataType } from '../../../../../types/component'

const DIRECTIVE_USE_DOM = /^use dom(:global)?$/
const DIRECTIVE_USE_SCRIPT = /^use script$/
const DIRECTIVE_REACT_PREFIX = /^use react(?:\s*\((#?[^)]+)\))?$/
const DIRECTIVE_TYPE_PREFIX = /^use (blocks|sections|snippets)$/

export class DirectiveParser {
  public parse(nodes: (Directive | Statement)[], metadata: ComponentMetadataType): void {
    nodes.forEach((node) => {
      this.applyDirective(this.getDirectiveValue(node), metadata)
    })
  }

  private applyDirective(value: string | null, metadata: ComponentMetadataType): void {
    _match(value === null)
      .with(true, () => undefined)
      .with(false, () => this.applyValue(value as string, metadata))
      .exec()
  }

  private applyValue(value: string, metadata: ComponentMetadataType): void {
    this.handleDomDirective(value, metadata)
    this.handleTypeDirective(value, metadata)
    this.handleReactDirective(value, metadata)
  }

  private getDirectiveValue(node: Directive | Statement): string | null {
    return _match(true)
      .with(isDirective(node), () => (node as unknown as { value: { value: string } }).value.value)
      .with(
        isExpressionStatement(node) && isStringLiteral(node.expression),
        () => (node as { expression: { value: string } }).expression.value,
      )
      .with(true, () => null)
      .exec() as string | null
  }

  private handleDomDirective(value: string, metadata: ComponentMetadataType): void {
    const isDom = value.match(DIRECTIVE_USE_DOM)
    const isScript = value.match(DIRECTIVE_USE_SCRIPT)
    _match(isDom === null && isScript === null)
      .with(true, () => undefined)
      .with(false, () => this.applyDomMode(value, isScript !== null, metadata))
      .exec()
  }

  private applyDomMode(value: string, isScript: boolean, metadata: ComponentMetadataType): void {
    metadata.hasUseScript = true
    _match(metadata.mode === 'react')
      .with(true, () => undefined)
      .with(false, () => this.writeDomMode(value, isScript, metadata))
      .exec()
  }

  private writeDomMode(value: string, isScript: boolean, metadata: ComponentMetadataType): void {
    metadata.mode = _match(value === 'use dom:global' || isScript)
      .with(true, () => 'dom:global')
      .with(false, () => 'dom')
      .exec() as 'dom:global' | 'dom'
  }

  private handleTypeDirective(value: string, metadata: ComponentMetadataType): void {
    const typeMatch = value.match(DIRECTIVE_TYPE_PREFIX)
    _match(typeMatch === null)
      .with(true, () => undefined)
      .with(false, () => {
        metadata.type = (typeMatch as string[])[1] as 'blocks' | 'sections' | 'snippets'
      })
      .exec()
  }

  private handleReactDirective(value: string, metadata: ComponentMetadataType): void {
    const reactMatch = value.match(DIRECTIVE_REACT_PREFIX)
    _match(reactMatch === null)
      .with(true, () => undefined)
      .with(false, () => this.applyReactMode(reactMatch as string[], metadata))
      .exec()
  }

  private applyReactMode(reactMatch: string[], metadata: ComponentMetadataType): void {
    metadata.mode = 'react'
    metadata.hasUseScript = true
    const rawId = reactMatch[1] as string | undefined
    metadata.reactRootId = _match(rawId === undefined)
      .with(true, () => '')
      .with(false, () => (rawId as string).replace(/^#/, ''))
      .exec() as string
  }
}
