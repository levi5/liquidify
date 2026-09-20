import {
  isIdentifier,
  isObjectPattern,
  isObjectProperty,
  type VariableDeclarator,
  isConditionalExpression,
  isLogicalExpression,
  isIfStatement,
  isBlockStatement,
  isExpressionStatement,
  isAssignmentExpression,
  isObjectExpression,
  isTemplateLiteral,
  type IfStatement,
  isCallExpression,
  isMemberExpression,
  isArrowFunctionExpression,
  isReturnStatement,
  type ObjectPattern,
} from '@babel/types'
import { _Maybe, _Object, _match } from 'funcio'
import { ValidationError } from '../../../../../core/errors/validation-error'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

export class LiquidVariableParser {
  public parseExpression?: (node: any, renames?: Record<string, string>, context?: ParsingContext) => string

  constructor(
    public generateLiquidCode: (node: any, inCondition?: boolean, renames?: Record<string, string>, context?: ParsingContext) => string,
  ) {}

  public parseVariableDeclaration(declaration: VariableDeclarator, renames?: Record<string, string>, context?: ParsingContext): string[] {
    const id = _Maybe
      .of(_Object.getPathValue(['id'], declaration))
      .map((value) => value)
      .getOrElse(null)
    const init = _Maybe
      .of(_Object.getPathValue(['init'], declaration))
      .map((value) => value)
      .getOrElse(null)
    return _Maybe
      .of(!id || !init)
      .map((missing) => (missing ? [] : this.dispatchDeclaration(id, init, renames, context)))
      .getOrElse([])
  }

  private dispatchDeclaration(id: any, init: any, renames?: Record<string, string>, context?: ParsingContext): string[] {
    return _match(true)
      .with(isIdentifier(id) && isTemplateLiteral(init) && init.expressions.length === 0, () => [
        this.assignConstant(id.name, init.quasis[0].value.raw),
      ])
      .with(isIdentifier(id) && isConditionalExpression(init), () =>
        this.parseConditionalExpressionRecursive(id.name, init, renames, context),
      )
      .with(isIdentifier(id) && isLogicalExpression(init) && init.operator === '||', () =>
        this.parseOrFallback(id.name, init, renames, context),
      )
      .with(isIdentifier(id) && isLogicalExpression(init) && init.operator === '??', () =>
        this.parseNilFallback(id.name, init, renames, context),
      )
      .with(isIdentifier(id) && this.isFilterCall(init), () => this.parseFilterAssign(id.name, init, renames, context))
      .with(isIdentifier(id), () => [`{% assign ${id.name} = ${this.generateLiquidCode(init, false, renames, context)} %}`])
      .with(isObjectPattern(id), () => this.flattenObjectPattern(id, this.generateLiquidCode(init, false, renames, context)))
      .with(true, () => [])
      .exec() as string[]
  }

  private assignConstant(name: string, raw: string): string {
    return `{% assign ${name} = ${JSON.stringify(raw)} %}`
  }

  private isFilterCall(init: any): boolean {
    return (
      isCallExpression(init) &&
      isMemberExpression(init.callee) &&
      isIdentifier(init.callee.property) &&
      (init.callee.property.name === 'filter' || init.callee.property.name === 'find')
    )
  }

  private collectOrParts(expr: any): any[] {
    return _match(true)
      .with(isLogicalExpression(expr) && (expr.operator === '||' || expr.operator === '??'), () => [
        ...this.collectOrParts(expr.left),
        expr.right,
      ])
      .with(true, () => [expr])
      .exec() as any[]
  }

  private parseOrFallback(idName: string, init: any, renames?: Record<string, string>, context?: ParsingContext): string[] {
    const nodes = this.collectOrParts(init)
    const baseNode = nodes.shift()
    const baseCode = this.generateLiquidCode(baseNode, false, renames, context)
    const hasObjectLiteral = nodes.some((n) => isObjectExpression(n))
    return _match(hasObjectLiteral)
      .with(true, () => {
        const lines = [`{% assign ${idName} = ${baseCode} %}`]
        nodes.forEach((node) => {
          const code = this.generateLiquidCode(node, false, renames, context)
          lines.push(`{% if ${idName} == nil or ${idName} == "" or ${idName} == false %}`)
          _Maybe
            .of(!isObjectExpression(node))
            .map((assignable) => (assignable ? lines.push(`  {% assign ${idName} = ${code} %}`) : null))
            .getOrElse(null)
          lines.push(`{% endif %}`)
        })
        return lines
      })
      .with(hasObjectLiteral, () => {
        const defaults = nodes.map((n) => ` | default: ${this.generateLiquidCode(n, false, renames, context)}`).join('')
        return [`{% assign ${idName} = ${baseCode}${defaults} %}`]
      })
      .exec() as string[]
  }

  private parseNilFallback(idName: string, init: any, renames?: Record<string, string>, context?: ParsingContext): string[] {
    const nodes = this.collectOrParts(init)
    const baseNode = nodes.shift()
    const baseCode = this.generateLiquidCode(baseNode, false, renames, context)
    const lines = [`{% assign ${idName} = ${baseCode} %}`]
    nodes.forEach((node) => {
      const code = this.generateLiquidCode(node, false, renames, context)
      lines.push(`{% if ${idName} == nil %}`)
      lines.push(`  {% assign ${idName} = ${code} %}`)
      lines.push(`{% endif %}`)
    })
    return lines
  }

  private parseFilterAssign(idName: string, init: any, renames?: Record<string, string>, context?: ParsingContext): string[] {
    const methodName = (init.callee.property as any).name
    const callback = init.arguments[0]
    return _Maybe
      .of(isArrowFunctionExpression(callback) && callback.params.length > 0)
      .map(
        (valid) =>
          _match(valid)
            .with(false, () => [`{% assign ${idName} = ${this.generateLiquidCode(init, false, renames, context)} %}`])
            .with(valid, () => {
              const arrayName = this.generateLiquidCode(init.callee.object, false, renames, context)
              const itemName = isIdentifier(callback.params[0]) ? (callback.params[0] as any).name : 'item'
              const where = this.whereFilter(arrayName, itemName, callback.body)
              return (
                _Maybe
                  .of(where)
                  .map(
                    (filtered) =>
                      _match(methodName)
                        .with('find', () => [`{% assign ${idName} = ${filtered} | first %}`])
                        .with(methodName, () => [`{% assign ${idName} = ${filtered} %}`])
                        .exec() as string[],
                  )
                  .getOrElse(null) ?? this.unsupportedFilter(idName, context)
              )
            })
            .exec() as string[],
      )
      .getOrElse([`{% assign ${idName} = ${this.generateLiquidCode(init, false, renames, context)} %}`])
  }

  private whereFilter(arrayName: string, itemName: string, body: any): string | null {
    return _match(true)
      .with(
        isMemberExpression(body) && isIdentifier((body as any).object, { name: itemName }),
        () => `${arrayName} | where: "${(body.property as any).name ?? (body.property as any).value}"`,
      )
      .with(
        body?.type === 'BinaryExpression' &&
          (body.operator === '==' || (body.operator === '===' && true)) &&
          body.left?.type === 'MemberExpression' &&
          body.left?.object?.name === itemName,
        () => `${arrayName} | where: "${body.left.property.name ?? body.left.property.value}", ${generate(body.right).code}`,
      )
      .with(true, () => null)
      .exec() as string | null
  }

  private unsupportedFilter(idName: string, context?: ParsingContext): string[] {
    throw new ValidationError(
      `Unsupported filter assignment for "${idName}": only member and equality predicates compile to where filters.`,
      context?.currentFilePath,
    )
  }

  private flattenObjectPattern(pattern: ObjectPattern, basePath: string): string[] {
    return pattern.properties.flatMap((prop) =>
      _Maybe
        .of(!isObjectProperty(prop) || !isIdentifier(prop.key))
        .map((skip) => (skip ? [] : this.flattenProperty(prop as any, basePath)))
        .getOrElse([]),
    )
  }

  private flattenProperty(prop: any, basePath: string): string[] {
    const fullPath = `${basePath}.${prop.key.name}`
    return _match(true)
      .with(isIdentifier(prop.value), () => [`{% assign ${prop.value.name} = ${fullPath} %}`])
      .with(isObjectPattern(prop.value), () => this.flattenObjectPattern(prop.value, fullPath))
      .with(true, () => [])
      .exec() as string[]
  }

  private parseConditionalExpressionRecursive(
    idName: string,
    expr: any,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    const lines: string[] = [
      `{% if ${this.generateLiquidCode(expr.test, true, renames, context)} %}`,
      `  {% assign ${idName} = ${this.generateLiquidCode(expr.consequent, false, renames, context)} %}`,
    ]
    let alternate = expr.alternate
    while (isConditionalExpression(alternate)) {
      lines.push(`{% elsif ${this.generateLiquidCode(alternate.test, true, renames, context)} %}`)
      lines.push(`  {% assign ${idName} = ${this.generateLiquidCode(alternate.consequent, false, renames, context)} %}`)
      alternate = alternate.alternate
    }
    _Maybe
      .of(Boolean(alternate))
      .map((hasElse) =>
        hasElse
          ? lines.push(`{% else %}`, `  {% assign ${idName} = ${this.generateLiquidCode(alternate, false, renames, context)} %}`)
          : null,
      )
      .getOrElse(null)
    lines.push(`{% endif %}`)
    return lines
  }

  public parseIfStatement(
    statement: IfStatement,
    onReturn?: (node: any, context?: ParsingContext) => string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    const lines: string[] = []
    const parseBranch = (stmt: IfStatement, isElsif = false): void => {
      const keyword = _match(isElsif)
        .with(true, () => 'elsif')
        .with(isElsif, () => 'if')
        .exec() as string
      lines.push(`{% ${keyword} ${this.generateLiquidCode(stmt.test, true, renames, context)} %}`)
      lines.push(...this.extractAssignments(stmt.consequent, onReturn, renames, context).map((s) => `  ${s}`))
      _Maybe
        .of(stmt.alternate)
        .map((alternate) => {
          if (!alternate) return null
          return _match(isIfStatement(alternate))
            .with(true, () => parseBranch(alternate as IfStatement, true))
            .with(isIfStatement(alternate), () => {
              lines.push(`{% else %}`)
              lines.push(...this.extractAssignments(alternate, onReturn, renames, context).map((s) => `  ${s}`))
            })
            .exec()
        })
        .getOrElse(null)
    }
    parseBranch(statement)
    lines.push(`{% endif %}`)
    return lines
  }

  private extractAssignments(
    node: any,
    onReturn?: (node: any, context?: ParsingContext) => string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    return _match(true)
      .with(isBlockStatement(node), () => (node.body || []).flatMap((stmt: any) => this.extractSingle(stmt, onReturn, renames, context)))
      .with(isExpressionStatement(node) || isReturnStatement(node), () => this.extractSingle(node, onReturn, renames, context))
      .with(true, () => [])
      .exec() as string[]
  }

  private extractSingle(
    stmt: any,
    onReturn?: (node: any, context?: ParsingContext) => string,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): string[] {
    return _match(true)
      .with(isExpressionStatement(stmt) && isAssignmentExpression(stmt.expression) && isIdentifier(stmt.expression.left), () => [
        this.assignLine(
          stmt.expression.left.name,
          this.generateLiquidCode(stmt.expression.right, false, renames, context),
          stmt.expression.operator,
        ),
      ])
      .with(isExpressionStatement(stmt) && this.isMapCall(stmt.expression), () =>
        _Maybe
          .of(this.parseExpression)
          .map((parse: any) => [(parse as any)(stmt.expression, renames, context)])
          .getOrElse([]),
      )
      .with(isReturnStatement(stmt) && Boolean(onReturn), () => [(onReturn as any)((stmt as any).argument, context)])
      .with(isIfStatement(stmt), () => this.parseIfStatement(stmt, onReturn, renames, context))
      .with(true, () => [])
      .exec() as string[]
  }

  private isMapCall(expr: any): boolean {
    return (
      isCallExpression(expr) && isMemberExpression(expr.callee) && isIdentifier(expr.callee.property) && expr.callee.property.name === 'map'
    )
  }

  private assignLine(name: string, code: string, operator: string): string {
    return _match(operator)
      .with('+=', () => `{% assign ${name} = ${name} | append: ${code} %}`)
      .with(operator, () => `{% assign ${name} = ${code} %}`)
      .exec() as string
  }
}
