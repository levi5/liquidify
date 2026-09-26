import {
  type Directive,
  isReturnStatement,
  isJSXElement,
  isJSXFragment,
  isLogicalExpression,
  isConditionalExpression,
  isVariableDeclaration,
  isIdentifier,
  type Statement,
  type VariableDeclaration,
  type VariableDeclarator,
  type ReturnStatement,
  type TemplateLiteral,
  type IfStatement,
  type Node,
  isDirective,
  isExpressionStatement,
  isStringLiteral,
  isIfStatement,
  isArrowFunctionExpression,
  isFunctionExpression,
} from '@babel/types'
import generate from '@babel/generator'
import { _match, _pipe } from 'funcio'
import type { ComponentMetadataType, InlineComponentNode } from '../../../../../types/component'
import { LiquidVariableParser } from '../liquid/variable-parser'

export class StatementCollector {
  private generateLiquidCodeFromNode(node: unknown): string {
    return _match(node === null || node === undefined)
      .with(true, () => '')
      .with(false, () => this.dispatchNodeCode(node as Node))
      .exec() as string
  }

  private dispatchNodeCode(node: Node): string {
    return _match(true)
      .with(node.type === 'UnaryExpression' && (node as { operator: string }).operator === '!', () =>
        this.negationCode(node as { argument: unknown }),
      )
      .with(
        node.type === 'MemberExpression' &&
          (node as { object: { type?: string; name?: string } }).object?.type === 'Identifier' &&
          (node as { object: { name?: string } }).object?.name === 'styles',
        () => this.styleReference(node as { property: { name?: string; value?: string } }),
      )
      .with(
        node.type === 'MemberExpression' &&
          (node as { property: { name?: string } }).property?.name === 'length' &&
          !(node as { computed: boolean }).computed,
        () => this.lengthCode(node),
      )
      .with(node.type === 'TemplateLiteral', () => this.templateCode(node as TemplateLiteral))
      .with(true, () => generate(node).code.replace(/\.length\b/g, '.size'))
      .exec() as string
  }

  private negationCode(node: { argument: unknown }): string {
    const argCode = this.generateLiquidCodeFromNode(node.argument)
    return `${argCode} == nil or ${argCode} == false or ${argCode} == 0 or ${argCode} == ""`
  }

  private styleReference(node: { property: { name?: string; value?: string } }): string {
    return `"${node.property.name || node.property.value}"`
  }

  private lengthCode(node: Node): string {
    const sized = {
      ...(node as unknown as Record<string, unknown>),
      property: { ...(node as unknown as { property: Record<string, unknown> }).property, name: 'size' },
    }
    return generate(sized as unknown as Node).code
  }

  private templateCode(node: TemplateLiteral): string {
    const head = _match(node.quasis[0].value.raw !== '')
      .with(true, () => `"${node.quasis[0].value.raw}"`)
      .with(false, () => '')
      .exec() as string
    const body = node.expressions.reduce(
      (acc, expression, index) => this.appendTemplatePart(acc, expression, node.quasis[index + 1].value.raw),
      head,
    )
    return _match(body === '')
      .with(true, () => '""')
      .with(false, () => body)
      .exec() as string
  }

  private appendTemplatePart(acc: string, expression: unknown, quasi: string): string {
    const base = this.generateLiquidCodeFromNode(expression)
    const appended = _match(acc === '')
      .with(true, () => base)
      .with(false, () => `${acc} | append: ${base}`)
      .exec() as string
    return _match(quasi !== '')
      .with(true, () => `${appended} | append: "${quasi}"`)
      .with(false, () => appended)
      .exec() as string
  }

  private liquidVariableParser = new LiquidVariableParser((node: unknown) =>
    _pipe(
      this.generateLiquidCodeFromNode(node),
      (code) => code.replace(/\s*===\s*/g, ' == '),
      (code) => code.replace(/\s*!==\s*/g, ' != '),
      (code) => code.replace(/\.toLowerCase\s*\(\)\s*/g, ' | downcase '),
      (code) => code.replace(/\.toUpperCase\s*\(\)\s*/g, ' | upcase '),
      (code) => code.replace(/^!([a-zA-Z0-9_.]+)$/g, '$1 == nil or $1 == false or $1 == 0 or $1 == ""'),
      (code) => code.trim(),
    ),
  )

  public collect(statements: (Directive | Statement)[], metadata: ComponentMetadataType): void {
    this.collectDirectives(statements, metadata)
    _match(metadata.mode)
      .with('liquid', () => this.collectLiquidBody(statements, metadata))
      .with(metadata.mode, () => this.collectDefault(statements, metadata))
      .exec()
  }

  private collectLiquidBody(statements: (Directive | Statement)[], metadata: ComponentMetadataType): void {
    metadata.liquidBody = statements as Statement[]
    statements.forEach((statement) => {
      _match(isVariableDeclaration(statement))
        .with(true, () => {
          ;(statement as VariableDeclaration).declarations.forEach((declaration) => {
            this.registerInline(declaration, metadata)
          })
        })
        .with(false, () => undefined)
        .exec()
    })
  }

  private registerInline(declaration: VariableDeclarator, metadata: ComponentMetadataType): void {
    const jsx = this.isJsxReturningFunction(declaration.init)
    _match(isIdentifier(declaration.id) && jsx != null)
      .with(true, () => metadata.inlineComponents?.set((declaration.id as { name: string }).name, jsx as InlineComponentNode))
      .with(false, () => undefined)
      .exec()
  }

  private collectDefault(statements: (Directive | Statement)[], metadata: ComponentMetadataType): void {
    statements.forEach((statement) => {
      this.collectDefaultStatement(statement, metadata)
    })
  }

  private collectDefaultStatement(statement: Directive | Statement, metadata: ComponentMetadataType): void {
    _match(this.handleReturnStatement(statement, metadata))
      .with(true, () => undefined)
      .with(false, () => this.collectScriptOrAssignment(statement, metadata))
      .exec()
  }

  private collectScriptOrAssignment(statement: Directive | Statement, metadata: ComponentMetadataType): void {
    _match(this.handleLiquidAssignments(statement, metadata))
      .with(true, () => undefined)
      .with(false, () => metadata.scriptStatements.push(statement as Statement))
      .exec()
  }

  private collectDirectives(statements: (Directive | Statement)[], metadata: ComponentMetadataType): void {
    statements.forEach((statement) => {
      this.applyDirectiveValue(this.getDirectiveValue(statement), metadata)
    })
  }

  private applyDirectiveValue(value: string | null, metadata: ComponentMetadataType): void {
    _match(value === null)
      .with(true, () => undefined)
      .with(false, () => this.applyDirective(value as string, metadata))
      .exec()
  }

  private applyDirective(value: string, metadata: ComponentMetadataType): void {
    _match(true)
      .with(value.match(/^use\s+(dom(:global)?|script)$/) !== null, () => this.applyDomDirective(value, metadata))
      .with(value.match(/^use react/) !== null, () => this.applyReactDirective(metadata))
      .with(true, () => undefined)
      .exec()
  }

  private applyDomDirective(value: string, metadata: ComponentMetadataType): void {
    metadata.hasUseScript = true
    const isGlobal = value === 'use dom:global' || value.includes('script')
    _match(metadata.mode === 'react')
      .with(true, () => undefined)
      .with(false, () => this.writeDomMode(metadata, isGlobal))
      .exec()
  }

  private writeDomMode(metadata: ComponentMetadataType, isGlobal: boolean): void {
    metadata.mode = _match(isGlobal)
      .with(true, () => 'dom:global')
      .with(false, () => 'dom')
      .exec() as ComponentMetadataType['mode']
  }

  private applyReactDirective(metadata: ComponentMetadataType): void {
    metadata.hasUseScript = true
    metadata.mode = 'react'
  }

  private getDirectiveValue(statement: Directive | Statement): string | null {
    return _match(true)
      .with(isDirective(statement), () => (statement as unknown as { value: { value: string } }).value.value)
      .with(isExpressionStatement(statement as Node), () => this.expressionDirective(statement as unknown as { expression: unknown }))
      .with(true, () => null)
      .exec() as string | null
  }

  private expressionDirective(statement: { expression: unknown }): string | null {
    return _match(isStringLiteral(statement.expression as Node))
      .with(true, () => (statement.expression as { value: string }).value)
      .with(false, () => null)
      .exec() as string | null
  }

  private handleReturnStatement(statement: Directive | Statement, metadata: ComponentMetadataType): boolean {
    return _match(!isReturnStatement(statement))
      .with(true, () => false)
      .with(false, () => this.captureJsxReturn(statement as ReturnStatement, metadata))
      .exec() as boolean
  }

  private captureJsxReturn(statement: ReturnStatement, metadata: ComponentMetadataType): boolean {
    const arg = statement.argument
    _match(arg != null && (isJSXElement(arg) || isJSXFragment(arg) || isLogicalExpression(arg) || isConditionalExpression(arg)))
      .with(true, () => {
        metadata.jsxElement = arg as ComponentMetadataType['jsxElement']
      })
      .with(false, () => undefined)
      .exec()
    return true
  }

  private isJsxReturningFunction(node: unknown): unknown {
    return _match(isArrowFunctionExpression(node as Node) || isFunctionExpression(node as Node))
      .with(true, () => this.jsxBodyOf(node))
      .with(false, () => null)
      .exec()
  }

  private jsxBodyOf(node: unknown): unknown {
    const body = (node as { body: unknown }).body
    return _match(true)
      .with(
        isJSXElement(body as Node) ||
          isJSXFragment(body as Node) ||
          isLogicalExpression(body as Node) ||
          isConditionalExpression(body as Node),
        () => body,
      )
      .with((body as { type?: string })?.type === 'BlockStatement', () => this.blockJsxBody(body as { body?: unknown[] }))
      .with(true, () => null)
      .exec()
  }

  private blockJsxBody(body: { body?: unknown[] }): unknown {
    const returnStmt = (body.body ?? []).find((stmt) => isReturnStatement(stmt as Node))
    return _match(returnStmt === undefined)
      .with(true, () => null)
      .with(false, () => this.jsxArgOf(returnStmt as { argument?: unknown }))
      .exec()
  }

  private jsxArgOf(statement: { argument?: unknown }): unknown {
    const arg = statement.argument
    return _match(
      arg != null &&
        (isJSXElement(arg as Node) ||
          isJSXFragment(arg as Node) ||
          isLogicalExpression(arg as Node) ||
          isConditionalExpression(arg as Node)),
    )
      .with(true, () => arg)
      .with(false, () => null)
      .exec()
  }

  private handleLiquidAssignments(statement: Directive | Statement, metadata: ComponentMetadataType): boolean {
    return _match(true)
      .with(metadata.mode === 'react' || metadata.mode === 'dom' || metadata.mode === 'dom:global', () => false)
      .with(isVariableDeclaration(statement), () => this.collectInlineDeclarations(statement as VariableDeclaration, metadata))
      .with(isIfStatement(statement), () => this.collectIfAssignment(statement as IfStatement, metadata))
      .with(true, () => false)
      .exec() as boolean
  }

  private collectInlineDeclarations(statement: VariableDeclaration, metadata: ComponentMetadataType): boolean {
    statement.declarations.forEach((decl) => {
      this.collectInlineDeclaration(decl, metadata)
    })
    return true
  }

  private collectInlineDeclaration(decl: VariableDeclarator, metadata: ComponentMetadataType): void {
    const jsx = this.isJsxReturningFunction(decl.init)
    _match(isIdentifier(decl.id) && jsx != null)
      .with(true, () => metadata.inlineComponents?.set((decl.id as { name: string }).name, jsx as InlineComponentNode))
      .with(false, () => undefined)
      .exec()
  }

  private collectIfAssignment(statement: IfStatement, metadata: ComponentMetadataType): boolean {
    metadata.liquidAssignments.push(...this.liquidVariableParser.parseIfStatement(statement))
    return true
  }
}
