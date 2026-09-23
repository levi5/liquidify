import { renderCondition } from './condition'
import { ValidationError } from '../../../../../core/errors/validation-error'
import { TemplateLiteralParser } from './template-literal-parser'
import generate from '@babel/generator'
import type { Compiler } from '../../../../../core/protocols/compiler'
import type { ImportResolver } from './import-resolver'
import type { LiquidLoopParser } from './loop-parser'
import {
  cloneNode,
  traverseFast,
  type Node,
  isBinaryExpression,
  isMemberExpression,
  isIdentifier,
  stringLiteral,
  isTemplateLiteral,
  isStringLiteral,
  isCallExpression,
  type CallExpression,
  type TemplateLiteral,
  type Expression,
  isParenthesizedExpression,
  identifier,
  isArrowFunctionExpression,
  isUnaryExpression,
  isNullLiteral,
  isLogicalExpression,
  isBooleanLiteral,
} from '@babel/types'
import { _Maybe, _match, _try } from 'funcio'
import { escapeHtml, escapedOutput, liquidJsonOutput } from '../../../../../shared/html'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

export class ExpressionParser {
  private readonly templateParser = new TemplateLiteralParser((node, renames, context) =>
    this.generateLiquidCode(node, false, renames, context),
  )

  constructor(
    private readonly compiler: Compiler,
    private readonly importResolver: ImportResolver,
    private readonly loopParser: LiquidLoopParser,
  ) {}

  public getPendingAssigns(context?: ParsingContext): string {
    return context?.getPendingAssigns() || ''
  }

  public generateLiquidCode(node: Node, inCondition = false, renames?: Record<string, string>, context?: ParsingContext): string {
    return _Maybe
      .of(isTemplateLiteral(node))
      .map((isTemplate) =>
        isTemplate
          ? this.templateParser.parse(node as TemplateLiteral, context, renames)
          : this.generateNodeCode(node, inCondition, renames, context),
      )
      .getOrElse('')
  }

  private generateNodeCode(node: Node, inCondition = false, renames?: Record<string, string>, context?: ParsingContext): string {
    if (inCondition && this.hasMixedOperators(node)) return this.stabilizedCondition(node, renames, context)
    const cloned = cloneNode(node, true)
    traverseFast(cloned, (n) => this.normalizeNode(n, inCondition, renames, context))
    const raw = _Maybe.of(generate(cloned).code).getOrElse('')
    const transpiled = _try
      .sync(() => this.compiler.transpileSync(raw, { loader: 'ts', format: 'esm', minify: false }))
      .match({
        right: (result: any) => (result.code as string).replace(/;\n$/, '').trim(),
        left: () => raw,
      }) as string
    return this.postprocess(transpiled)
  }

  private normalizeNode(n: any, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    _Maybe
      .of(isIdentifier(n) && renames?.[n.name])
      .map((renamed) => {
        if (renamed) n.name = renames![n.name]
        return renamed
      })
      .getOrElse(null)
    _Maybe
      .of(n?.type === 'OptionalMemberExpression')
      .map((optional) => (optional ? Object.assign(n, { type: 'MemberExpression' }) : null))
      .getOrElse(null)
    _Maybe
      .of(n?.type === 'OptionalCallExpression')
      .map((optional) => (optional ? Object.assign(n, { type: 'CallExpression' }) : null))
      .getOrElse(null)
    _Maybe
      .of(isParenthesizedExpression(n))
      .map((paren) => (paren ? Object.assign(n, n.expression) : null))
      .getOrElse(null)
    this.normalizeCall(n, inCondition, renames, context)
    this.normalizeUnary(n, renames, context)
    this.normalizeBinary(n, renames, context)
    this.normalizeMember(n)
  }

  private normalizeCall(n: any, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    _Maybe
      .of(isCallExpression(n))
      .map((isCall) => (isCall ? this.rewriteCall(n, inCondition, renames, context) : null))
      .getOrElse(null)
  }

  private rewriteCall(n: any, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    _match(true)
      .with(isIdentifier(n.callee, { name: 'String' }), () => {
        const arg = n.arguments[0]
        _Maybe
          .of(arg && 'type' in arg)
          .map(() => Object.assign(n, identifier(`${this.generateLiquidCode(arg, inCondition, renames, context)} | append: ""`)))
          .getOrElse(null)
      })
      .with(isIdentifier(n.callee, { name: 'Number' }), () => {
        const arg = n.arguments[0]
        _Maybe
          .of(arg && 'type' in arg)
          .map(() => Object.assign(n, identifier(`${this.generateLiquidCode(arg, inCondition, renames, context)} | plus: 0`)))
          .getOrElse(null)
      })
      .with(
        isIdentifier(n.callee) &&
          ['markdownify', 'handleize', 'downcase', 'upcase', 'strip', 'strip_html', 'money', 'money_without_currency'].includes(
            n.callee.name,
          ),
        () => {
          const arg = n.arguments[0]
          _Maybe
            .of(arg && 'type' in arg)
            .map(() => Object.assign(n, identifier(`${this.generateLiquidCode(arg, inCondition, renames, context)} | ${n.callee.name}`)))
            .getOrElse(null)
        },
      )
      .with(isMemberExpression(n.callee) && isIdentifier((n.callee as any).property), () =>
        this.rewriteMethod(n, inCondition, renames, context),
      )
      .with(true, () => null)
      .exec()
  }

  private rewriteMethod(n: any, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    const methodName = (n.callee as any).property.name
    _match(methodName)
      .with('toString', () =>
        Object.assign(n, identifier(`${this.generateLiquidCode(n.callee.object, inCondition, renames, context)} | append: ""`)),
      )
      .with('join', () => {
        const objectCode = this.generateLiquidCode(n.callee.object, inCondition, renames, context)
        const argCode = n.arguments.length > 0 ? this.generateLiquidCode(n.arguments[0] as Expression, inCondition, renames, context) : '""'
        Object.assign(n, identifier(`${objectCode} | join: ${argCode}`))
      })
      .with('toLowerCase', () => this.rewriteStringFilter(n, 'downcase', inCondition, renames, context))
      .with('toUpperCase', () => this.rewriteStringFilter(n, 'upcase', inCondition, renames, context))
      .with('trim', () => this.rewriteStringFilter(n, 'strip', inCondition, renames, context))
      .with('find', () => this.rewriteFind(n, renames, context))
      .with(methodName, () => null)
      .exec()
  }

  private rewriteStringFilter(
    n: any,
    filter: string,
    inCondition: boolean,
    _renames?: Record<string, string>,
    context?: ParsingContext,
  ): void {
    _match(inCondition)
      .with(true, () => {
        const objectCode = generate(n.callee.object).code
        const varName = `${objectCode.replace(/[^a-zA-Z0-9_]/g, '_')}_${filter}`
        context?.addPendingAssign(`{% assign ${varName} = ${objectCode} | ${filter} %}`)
        Object.assign(n, identifier(varName))
      })
      .with(inCondition, () => null)
      .exec()
  }

  private rewriteFind(n: any, renames?: Record<string, string>, context?: ParsingContext): void {
    const callback = n.arguments[0]
    if (
      !isArrowFunctionExpression(callback) ||
      callback.async ||
      callback.params.length !== 1 ||
      !isIdentifier(callback.params[0]) ||
      callback.body.type === 'BlockStatement'
    ) {
      throw new ValidationError(
        'Liquid .find() requires an inline arrow predicate such as items.find(item => item.available).',
        context?.currentFilePath,
        n.loc ? { line: n.loc.start.line, column: n.loc.start.column + 1 } : undefined,
      )
    }
    if (!context) throw new ValidationError('Liquid .find() requires a parsing context.', undefined)
    const objectCode = this.generateLiquidCode(n.callee.object, false, renames, context)
    const itemName = callback.params[0].name
    const varName = context.allocateName('found')
    const precedingAssigns = context.getPendingAssigns()
    const condition = this.generateLiquidCode(callback.body, true, renames, context)
    const predicateAssigns = context.getPendingAssigns()
    if (precedingAssigns) context.addPendingAssign(precedingAssigns.trimEnd())
    context.addPendingAssign(
      `{% assign ${varName} = nil %}\n{% for ${itemName} in ${objectCode} %}\n${predicateAssigns}  {% if ${condition} %}\n    {% assign ${varName} = ${itemName} %}\n    {% break %}\n  {% endif %}\n{% endfor %}`,
    )
    Object.assign(n, identifier(varName))
  }

  private normalizeUnary(n: any, renames?: Record<string, string>, context?: ParsingContext): void {
    _Maybe
      .of(isUnaryExpression(n) && n.operator === '!')
      .map((negated) =>
        negated
          ? Object.assign(
              n,
              identifier(
                `${this.generateLiquidCode(n.argument, true, renames, context).trim()} == blank or ${this.generateLiquidCode(n.argument, true, renames, context).trim()} == false`,
              ),
            )
          : null,
      )
      .getOrElse(null)
  }

  private normalizeBinary(n: any, renames?: Record<string, string>, context?: ParsingContext): void {
    _Maybe
      .of(isBinaryExpression(n))
      .map(() => {
        _match(n.operator)
          .with('===', () => ((n as any).operator = '=='))
          .with('!==', () => ((n as any).operator = '!='))
          .with('+', () => this.rewriteArithmetic(n, 'plus', renames, context))
          .with('-', () => this.rewriteArithmetic(n, 'minus', renames, context))
          .with('*', () => this.rewriteArithmetic(n, 'times', renames, context))
          .with('/', () => this.rewriteArithmetic(n, 'divided_by', renames, context))
          .with('%', () => this.rewriteArithmetic(n, 'modulo', renames, context))
          .with(n.operator, () => null)
          .exec()
        return true
      })
      .getOrElse(null)
  }

  private rewriteArithmetic(n: any, filter: string, renames?: Record<string, string>, context?: ParsingContext): void {
    const left = this.generateLiquidCode(n.left, false, renames, context)
    let right = this.generateLiquidCode(n.right, false, renames, context)
    if (right.includes(' | ')) {
      if (!context) throw new ValidationError('Nested arithmetic requires a parsing context.')
      const temporary = context.allocateName('arithmetic')
      context.addPendingAssign(`{% assign ${temporary} = ${right} %}`)
      right = temporary
    }
    Object.assign(n, identifier(`${left} | ${filter}: ${right}`))
  }

  private normalizeMember(n: any): void {
    _Maybe
      .of(isMemberExpression(n))
      .map(() =>
        _match(true)
          .with(
            isIdentifier((n as any).object) &&
              this.importResolver.getCssModules().has((n as any).object.name) &&
              isIdentifier((n as any).property),
            () => Object.assign(n, stringLiteral((n as any).property.name)),
          )
          .with(isIdentifier((n as any).property, { name: 'length' }) && !(n as any).computed, () => ((n as any).property.name = 'size'))
          .with(true, () => null)
          .exec(),
      )
      .getOrElse(null)
  }

  private postprocess(code: string): string {
    const literals: string[] = []
    const protectedCode = code.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, (literal) => {
      literals.push(literal)
      return `__LIQUIDIFY_LITERAL_${literals.length - 1}__`
    })
    return protectedCode
      .replace(/\s*===\s*/g, ' == ')
      .replace(/\s*!==\s*/g, ' != ')
      .replace(/\s*&&\s*/g, ' and ')
      .replace(/\s*\|\|\s*/g, ' or ')
      .replace(/\?\./g, '.')
      .replace(/\.toLowerCase\s*\(\)/g, ' | downcase')
      .replace(/\.toUpperCase\s*\(\)/g, ' | upcase')
      .replace(/\.trim\s*\(\)/g, ' | strip')
      .replace(/\.markdownify\s*\(\)/g, ' | markdownify')
      .replace(/\.handleize\s*\(\)/g, ' | handleize')
      .replace(/\.stripHtml\s*\(\)/g, ' | strip_html')
      .replace(/\.strip_html\s*\(\)/g, ' | strip_html')
      .replace(/\.money\s*\(\)/g, ' | money')
      .replace(/\.moneyWithoutCurrency\s*\(\)/g, ' | money_without_currency')
      .replace(/\.money_without_currency\s*\(\)/g, ' | money_without_currency')
      .replace(/\.includes\s*\(([^)]+)\)/g, ' contains $1')
      .replace(/__LIQUIDIFY_LITERAL_(\d+)__/g, (_, index) => literals[Number(index)])
      .trim()
  }

  private hasMixedOperators(node: Node): boolean {
    const operators = new Set<string>()
    traverseFast(node, (child) => {
      if (isLogicalExpression(child)) operators.add(child.operator)
    })
    return operators.has('&&') && operators.has('||')
  }

  private stabilizedCondition(node: Node, renames?: Record<string, string>, context?: ParsingContext): string {
    if (!context) throw new ValidationError('Mixed Liquid conditions require a parsing context.')
    const temporary = context.allocateName('condition')
    const markup = renderCondition(node, `{% assign ${temporary} = true %}`, `{% assign ${temporary} = false %}`, (leaf) =>
      this.generateLiquidCode(leaf, true, renames, context),
    )
    context.addPendingAssign(markup)
    return temporary
  }

  public parseExpression(expr: Expression, renames?: Record<string, string>, context?: ParsingContext): string {
    return _match(true)
      .with(isNullLiteral(expr) || isBooleanLiteral(expr), () => '')
      .with(isStringLiteral(expr), () => this.parseStringLiteral(expr as any, context))
      .with(this.loopParser.isMapCallExpression(expr), () => this.loopParser.transformMap(expr as CallExpression, renames, context))
      .with(
        isCallExpression(expr) &&
          isMemberExpression((expr as any).callee) &&
          isIdentifier(((expr as any).callee as any).object, { name: 'console' }),
        () => `<script>${this.generateLiquidCode(expr, false, renames, context)}</script>`,
      )
      .with(isUnaryExpression(expr) && (expr as any).operator === '!', () => {
        const argCode = this.generateLiquidCode((expr as any).argument, false, renames, context)
        return `{% if ${argCode} == blank or ${argCode} == false %}true{% else %}false{% endif %}`
      })
      .with(isLogicalExpression(expr) && (expr as any).operator === '??', () => this.parseNilCoalescing(expr as any, renames, context))
      .with(true, () => this.parseDefault(expr, renames, context))
      .exec() as string
  }

  private parseStringLiteral(expr: any, context?: ParsingContext): string {
    const hasLiquidTags = expr.value.includes('{{') || expr.value.includes('{%')
    return _match(true)
      .with(hasLiquidTags, () => expr.value)
      .with(expr.value.includes('|'), () => `{{ ${expr.value.trim()} }}`)
      .with(context?.outputContext === 'raw', () => expr.value)
      .with(true, () => escapeHtml(expr.value))
      .exec()
  }

  private parseNilCoalescing(expr: any, renames?: Record<string, string>, context?: ParsingContext): string {
    const left = this.generateLiquidCode(expr.left, false, renames, context)
    const right = this.generateLiquidCode(expr.right, false, renames, context)
    const assigns = this.getPendingAssigns(context)
    return `${assigns}{% if ${left} != nil %}${this.renderOutput(left, context)}{% else %}${this.renderOutput(right, context)}{% endif %}`
  }

  private parseDefault(expr: Expression, renames?: Record<string, string>, context?: ParsingContext): string {
    const code = this.generateLiquidCode(expr, false, renames, context)
    return `${this.getPendingAssigns(context)}${this.renderOutput(code, context)}`
  }

  private renderOutput(code: string, context?: ParsingContext): string {
    return _match(context?.outputContext)
      .with('json', () => liquidJsonOutput(code))
      .with('raw', () => `{{ ${code} }}`)
      .with(context?.outputContext, () => escapedOutput(code))
      .exec()
  }
}
