import {
  isReturnStatement,
  isJSXElement,
  isJSXFragment,
  isLogicalExpression,
  isConditionalExpression,
  isVariableDeclaration,
  type Statement,
  isDirective,
  isExpressionStatement,
  isStringLiteral,
  isIfStatement,
  isArrowFunctionExpression,
  isFunctionExpression,
} from '@babel/types'
import generate from '@babel/generator'
import { _Maybe, _match } from 'funcio'
import type { ComponentMetadataType } from '../../../../../types/component'
import { LiquidVariableParser } from '../liquid/variable-parser'

export class StatementCollector {
  private generateLiquidCodeFromNode(node: any): string {
    return _Maybe
      .of(!node)
      .map((empty) => (empty ? '' : this.dispatchNodeCode(node)))
      .getOrElse('')
  }

  private dispatchNodeCode(node: any): string {
    return _match(true)
      .with(node.type === 'UnaryExpression' && node.operator === '!', () => {
        const argCode = this.generateLiquidCodeFromNode(node.argument)
        return `${argCode} == blank or ${argCode} == false`
      })
      .with(
        node.type === 'MemberExpression' && node.object?.type === 'Identifier' && node.object?.name === 'styles',
        () => `"${node.property.name || node.property.value}"`,
      )
      .with(
        node.type === 'MemberExpression' && node.property?.name === 'length' && !node.computed,
        () => generate({ ...node, property: { ...node.property, name: 'size' } }).code,
      )
      .with(node.type === 'TemplateLiteral', () => this.templateCode(node))
      .with(true, () => generate(node).code.replace(/\.length\b/g, '.size'))
      .exec() as string
  }

  private templateCode(node: any): string {
    let result = node.quasis[0].value.raw ? `"${node.quasis[0].value.raw}"` : ''
    for (let i = 0; i < node.expressions.length; i++) {
      const base = this.generateLiquidCodeFromNode(node.expressions[i])
      const quasi = node.quasis[i + 1].value.raw
      result = !result ? base : `${result} | append: ${base}`
      if (quasi) result += ` | append: "${quasi}"`
    }
    return result || '""'
  }

  private liquidVariableParser = new LiquidVariableParser((node: any) => {
    const code = this.generateLiquidCodeFromNode(node)
    return code
      .replace(/\s*===\s*/g, ' == ')
      .replace(/\s*!==\s*/g, ' != ')
      .replace(/\.toLowerCase\s*\(\)\s*/g, ' | downcase ')
      .replace(/\.toUpperCase\s*\(\)\s*/g, ' | upcase ')
      .replace(/^!([a-zA-Z0-9_.]+)$/g, '$1 == blank or $1 == false')
      .trim()
  })

  public collect(statements: Statement[], metadata: ComponentMetadataType): void {
    this.collectDirectives(statements, metadata)
    _match(metadata.mode)
      .with('liquid', () => this.collectLiquidBody(statements, metadata))
      .with(metadata.mode, () => this.collectDefault(statements, metadata))
      .exec()
  }

  private collectLiquidBody(statements: Statement[], metadata: ComponentMetadataType): void {
    metadata.liquidBody = statements
    statements.forEach((statement) => {
      _Maybe.of(isVariableDeclaration(statement)).map((isVar) => {
        if (isVar) {
          ;(statement as any).declarations.forEach((declaration: any) => {
            this.registerInline(declaration, metadata)
          })
        }
        return isVar
      })
    })
  }

  private registerInline(declaration: any, metadata: ComponentMetadataType): void {
    const jsx = this.isJsxReturningFunction(declaration.init)
    _Maybe
      .of(Boolean(jsx && declaration.id.type === 'Identifier'))
      .map((valid) => (valid ? metadata.inlineComponents?.set(declaration.id.name, jsx) : null))
      .getOrElse(null)
  }

  private collectDefault(statements: Statement[], metadata: ComponentMetadataType): void {
    statements.forEach((statement) => {
      _Maybe
        .of(this.handleReturnStatement(statement, metadata) || this.handleLiquidAssignments(statement, metadata))
        .map((handled) => (handled ? null : metadata.scriptStatements.push(statement)))
        .getOrElse(null)
    })
  }

  private collectDirectives(statements: Statement[], metadata: ComponentMetadataType): void {
    statements.forEach((statement) => {
      _Maybe
        .of(this.getDirectiveValue(statement))
        .map((value) => (value ? this.applyDirective(value!, metadata) : null))
        .getOrElse(null)
    })
  }

  private applyDirective(value: string, metadata: ComponentMetadataType): void {
    _match(true)
      .with(Boolean(value.match(/^use\s+(dom(:global)?|script)$/)), () => {
        metadata.hasUseScript = true
        const isGlobal = value === 'use dom:global' || value.includes('script')
        _Maybe.of(metadata.mode !== 'react').map((applicable) => {
          if (applicable) metadata.mode = isGlobal ? 'dom:global' : 'dom'
          return applicable
        })
      })
      .with(Boolean(value.match(/^use react/)), () => {
        metadata.hasUseScript = true
        metadata.mode = 'react'
      })
      .with(true, () => null)
      .exec()
  }

  private getDirectiveValue(statement: Statement): string | null {
    return _match(true)
      .with(isDirective(statement as any), () => (statement as any).value.value)
      .with(
        isExpressionStatement(statement) && isStringLiteral((statement as any).expression),
        () => ((statement as any).expression as any).value,
      )
      .with(true, () => null)
      .exec() as string | null
  }

  private handleReturnStatement(statement: Statement, metadata: ComponentMetadataType): boolean {
    return _Maybe
      .of(isReturnStatement(statement))
      .map((isReturn) => {
        if (!isReturn) return false
        const arg = (statement as any).argument
        _Maybe
          .of(Boolean(arg && (isJSXElement(arg) || isJSXFragment(arg) || isLogicalExpression(arg) || isConditionalExpression(arg))))
          .map((isJsx) => {
            if (isJsx) metadata.jsxElement = arg as any
            return isJsx
          })
          .getOrElse(null)
        return true
      })
      .getOrElse(false)
  }

  private isJsxReturningFunction(node: any): any {
    return _Maybe
      .of(isArrowFunctionExpression(node) || isFunctionExpression(node))
      .map((isFn) => (isFn ? this.jsxBodyOf(node) : null))
      .getOrElse(null)
  }

  private jsxBodyOf(node: any): any {
    return _match(true)
      .with(
        isJSXElement(node.body) || isJSXFragment(node.body) || isLogicalExpression(node.body) || isConditionalExpression(node.body),
        () => node.body,
      )
      .with(node.body?.type === 'BlockStatement', () => this.blockJsxBody(node.body))
      .with(true, () => null)
      .exec()
  }

  private blockJsxBody(body: any): any {
    const returnStmt = (body.body || []).find((stmt: any) => isReturnStatement(stmt))
    return _Maybe
      .of(returnStmt)
      .map(() => {
        const arg = (returnStmt as any).argument
        return _match(true)
          .with(isJSXElement(arg) || isJSXFragment(arg) || isLogicalExpression(arg) || isConditionalExpression(arg), () => arg)
          .with(true, () => null)
          .exec()
      })
      .getOrElse(null)
  }

  private handleLiquidAssignments(statement: Statement, metadata: ComponentMetadataType): boolean {
    return _match(true)
      .with(metadata.mode === 'react' || metadata.mode === 'dom' || metadata.mode === 'dom:global', () => false)
      .with(isVariableDeclaration(statement), () => {
        ;(statement as any).declarations.forEach((decl: any) => {
          _match(decl.id.type === 'Identifier' && Boolean(this.isJsxReturningFunction(decl.init)))
            .with(true, () => metadata.inlineComponents?.set(decl.id.name, this.isJsxReturningFunction(decl.init)))
            .with(decl.id.type === 'Identifier' && Boolean(this.isJsxReturningFunction(decl.init)), () =>
              metadata.liquidAssignments.push(...this.liquidVariableParser.parseVariableDeclaration(decl)),
            )
            .exec()
        })
        return true
      })
      .with(isIfStatement(statement), () => {
        metadata.liquidAssignments.push(...this.liquidVariableParser.parseIfStatement(statement as any))
        return true
      })
      .with(true, () => false)
      .exec() as boolean
  }
}
