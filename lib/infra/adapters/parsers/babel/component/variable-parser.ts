import {
  type VariableDeclaration,
  type VariableDeclarator,
  type ArrowFunctionExpression,
  type BlockStatement,
  type Expression,
  type ObjectPattern,
  type ParenthesizedExpression,
  isIdentifier,
  isArrowFunctionExpression,
  isBlockStatement,
  isReturnStatement,
  isJSXElement,
  isJSXFragment,
  isParenthesizedExpression,
  isObjectPattern,
  returnStatement,
} from '@babel/types'
import generate from '@babel/generator'
import { _match } from 'funcio'
import type { ComponentMetadataType } from '../../../../../types/component'
import type { StatementCollector } from './statement-collector'

export class VariableParser {
  constructor(private readonly statementCollector: StatementCollector) {}

  public parse(node: VariableDeclaration, metadata: ComponentMetadataType): void {
    const declarator = node.declarations[0] as VariableDeclarator | undefined
    _match(declarator === undefined)
      .with(true, () => undefined)
      .with(false, () => this.parseDeclarator(declarator as VariableDeclarator, metadata))
      .exec()
  }

  private parseDeclarator(declarator: VariableDeclarator, metadata: ComponentMetadataType): void {
    const name = _match(isIdentifier(declarator.id))
      .with(true, () => (declarator.id as { name: string }).name)
      .with(false, () => '')
      .exec() as string
    _match(declarator.init != null && isArrowFunctionExpression(declarator.init))
      .with(true, () => this.parseArrowComponent(declarator as VariableDeclarator & { init: ArrowFunctionExpression }, name, metadata))
      .with(false, () => this.adoptName(name, metadata))
      .exec()
  }

  private adoptName(name: string, metadata: ComponentMetadataType): void {
    _match(metadata.name === '')
      .with(true, () => {
        metadata.name = name
      })
      .with(false, () => undefined)
      .exec()
  }

  private parseArrowComponent(
    declarator: VariableDeclarator & { init: ArrowFunctionExpression },
    name: string,
    metadata: ComponentMetadataType,
  ): void {
    _match(this.arrowFunctionHasJSX(declarator.init) || metadata.name === '')
      .with(true, () => {
        metadata.name = name
      })
      .with(false, () => undefined)
      .exec()
    this.collectDefaultParams(declarator.init, metadata)
    this.collectArrowBody(declarator.init, metadata)
  }

  private collectDefaultParams(fn: ArrowFunctionExpression, metadata: ComponentMetadataType): void {
    _match(fn.params.length > 0)
      .with(true, () => this.collectObjectDefaults(fn.params[0], metadata))
      .with(false, () => undefined)
      .exec()
  }

  private collectObjectDefaults(param: ArrowFunctionExpression['params'][number], metadata: ComponentMetadataType): void {
    _match(isObjectPattern(param))
      .with(true, () => {
        ;(param as ObjectPattern).properties.forEach((prop) => {
          this.collectObjectDefault(prop, metadata)
        })
      })
      .with(false, () => undefined)
      .exec()
  }

  private collectObjectDefault(prop: ObjectPattern['properties'][number], metadata: ComponentMetadataType): void {
    _match(
      prop.type === 'ObjectProperty' &&
        (prop as { value: { type?: string; left?: unknown } }).value?.type === 'AssignmentPattern' &&
        ((prop as { value: { left: unknown } }).value.left as { type?: string }).type === 'Identifier',
    )
      .with(true, () => this.registerDefault(prop as { value: { left: { name: string }; right: Expression } }, metadata))
      .with(false, () => undefined)
      .exec()
  }

  private registerDefault(prop: { value: { left: { name: string }; right: Expression } }, metadata: ComponentMetadataType): void {
    const propName = prop.value.left.name
    const defaultValue = generate(prop.value.right).code
    metadata.liquidAssignments = metadata.liquidAssignments || []
    metadata.liquidAssignments.push(`{% if ${propName} == nil %}\n  {% assign ${propName} = ${defaultValue} %}\n{% endif %}`)
  }

  private collectArrowBody(fn: ArrowFunctionExpression, metadata: ComponentMetadataType): void {
    _match(isBlockStatement(fn.body))
      .with(true, () => this.collectBlockBody(fn.body as BlockStatement, metadata))
      .with(false, () => this.statementCollector.collect([returnStatement(fn.body as Expression)], metadata))
      .exec()
  }

  private collectBlockBody(body: BlockStatement, metadata: ComponentMetadataType): void {
    this.statementCollector.collect([...(body.directives || []), ...body.body], metadata)
  }

  private arrowFunctionHasJSX(fn: ArrowFunctionExpression): boolean {
    return _match(true)
      .with(isJSXElement(fn.body) || isJSXFragment(fn.body), () => true)
      .with(isParenthesizedExpression(fn.body), () => this.parenthesizedHasJSX(fn.body as ParenthesizedExpression))
      .with(isBlockStatement(fn.body), () => this.blockReturnsJSX(fn.body as BlockStatement))
      .with(true, () => false)
      .exec() as boolean
  }

  private parenthesizedHasJSX(body: ParenthesizedExpression): boolean {
    return isJSXElement(body.expression) || isJSXFragment(body.expression)
  }

  private blockReturnsJSX(body: ArrowFunctionExpression['body']): boolean {
    return ((body as BlockStatement).body || []).some(
      (stmt) => isReturnStatement(stmt) && stmt.argument != null && (isJSXElement(stmt.argument) || isJSXFragment(stmt.argument)),
    )
  }
}
