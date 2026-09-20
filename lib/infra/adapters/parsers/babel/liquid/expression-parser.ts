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
  isLogicalExpression,
  identifier,
  isArrowFunctionExpression,
  isObjectPattern,
  isUnaryExpression,
  isNullLiteral,
  isBooleanLiteral,
} from '@babel/types'
import { _Maybe, _match } from 'funcio'
import { _try } from 'funcio/lib/Monads/Either'
import { escapeHtml, escapedOutput, liquidJsonOutput } from '../../../../../shared/html'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

export class ExpressionParser {
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
          ? this.transformTemplateLiteralToLiquid(node as TemplateLiteral, context, renames)
          : this.generateNodeCode(node, inCondition, renames, context),
      )
      .getOrElse('')
  }

  private generateNodeCode(node: Node, inCondition = false, renames?: Record<string, string>, context?: ParsingContext): string {
    const cloned = cloneNode(node, true)
    traverseFast(cloned, (n) => this.normalizeNode(n, inCondition, renames, context))
    const raw = _Maybe.of(generate(cloned).code).getOrElse('')
    const transpiled = _try
      .sync(() => this.compiler.transpileSync(raw, { loader: 'ts', format: 'esm', minify: false }))
      .match({
        right: (result: any) => (result.code as string).replace(/;\n$/, '').trim(),
        left: () => raw,
      }) as string
    const code = this.postprocess(transpiled)
    return _match(inCondition && this.hasMixedOperators(node))
      .with(true, () => this.stabilizedCondition(node, code, renames, context))
      .with(inCondition && this.hasMixedOperators(node), () => code)
      .exec() as string
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
    this.normalizeBinary(n)
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
    _Maybe
      .of(isArrowFunctionExpression(callback) && callback.params.length > 0)
      .map(() => {
        const objectCode = generate(n.callee.object).code
        const param = callback.params[0]
        const itemName = isIdentifier(param) ? param.name : isObjectPattern(param) ? 'item' : 'item'
        const varName = `${objectCode.replace(/[^a-zA-Z0-9_]/g, '_')}_found`
        const condition = this.generateLiquidCode(callback.body, true, renames, context)
        context?.addPendingAssign(
          `{% assign ${varName} = nil %}\n{% for ${itemName} in ${objectCode} %}\n  {% if ${condition} %}\n    {% assign ${varName} = ${itemName} %}\n    {% break %}\n  {% endif %}\n{% endfor %}`,
        )
        Object.assign(n, identifier(varName))
        return true
      })
      .getOrElse(null)
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

  private normalizeBinary(n: any): void {
    _Maybe
      .of(isBinaryExpression(n))
      .map(() => {
        _match(n.operator)
          .with('===', () => ((n as any).operator = '=='))
          .with('!==', () => ((n as any).operator = '!='))
          .with('+', () => this.rewriteArithmetic(n, 'plus'))
          .with('-', () => this.rewriteArithmetic(n, 'minus'))
          .with('*', () => this.rewriteArithmetic(n, 'times'))
          .with('/', () => this.rewriteArithmetic(n, 'divided_by'))
          .with('%', () => this.rewriteArithmetic(n, 'modulo'))
          .with(n.operator, () => null)
          .exec()
        return true
      })
      .getOrElse(null)
  }

  private rewriteArithmetic(n: any, filter: string): void {
    const left = generate(n.left).code
    const right = generate(n.right).code
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
    return code
      .replace(/\s*===\s*/g, ' == ')
      .replace(/\s*!==\s*/g, ' != ')
      .replace(/\s*&&\s*/g, ' and ')
      .replace(/\s*\|\|\s*/g, ' or ')
      .replace(/\?\./g, '.')
      .replace(/\?/g, '')
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
      .trim()
  }

  private hasMixedOperators(node: Node): boolean {
    const code = generate(cloneNode(node, true)).code
    return code.includes('&&') && code.includes('||')
  }

  private stabilizedCondition(_node: Node, code: string, _renames?: Record<string, string>, context?: ParsingContext): string {
    return _Maybe
      .of(context)
      .map((ctx) => {
        const temp = ctx!.allocateName('cond')
        const parts = code.split(/\s+or\s+/)
        const last = parts.pop() as string
        const head = parts.join(' or ')
        ctx!.addPendingAssign(`{% assign ${temp} = ${head} %}`)
        return `${temp} or ${last}`.replace(/^.* or /, (_m) => `${temp} or ${last} `).trim() && `${temp} or ${last}`
      })
      .getOrElse(code)
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
    return _match(true)
      .with(expr.value.includes('{{') || expr.value.includes('{%'), () => expr.value)
      .with(
        true,
        () =>
          _match(context?.outputContext)
            .with('raw', () => expr.value)
            .with(context?.outputContext, () => escapeHtml(expr.value))
            .exec() as string,
      )
      .exec() as string
  }

  private parseNilCoalescing(expr: any, renames?: Record<string, string>, context?: ParsingContext): string {
    const left = this.generateLiquidCode(expr.left, false, renames, context)
    const assigns = this.getPendingAssigns(context)
    const yes = _match(context?.outputContext)
      .with('raw', () => `{{ ${this.generateLiquidCode(expr.left, false, renames, context)} }}`)
      .with('json', () => liquidJsonOutput(this.generateLiquidCode(expr.left, false, renames, context)))
      .with(context?.outputContext, () => escapedOutput(this.generateLiquidCode(expr.left, false, renames, context)))
      .exec() as string
    const no = _match(context?.outputContext)
      .with('raw', () => `{{ ${this.generateLiquidCode(expr.right, false, renames, context)} }}`)
      .with('json', () => liquidJsonOutput(this.generateLiquidCode(expr.right, false, renames, context)))
      .with(context?.outputContext, () => escapedOutput(this.generateLiquidCode(expr.right, false, renames, context)))
      .exec() as string
    return `${assigns}{% if ${left} != nil %}${yes}{% else %}${no}{% endif %}`
  }

  private parseDefault(expr: Expression, renames?: Record<string, string>, context?: ParsingContext): string {
    const code = this.generateLiquidCode(expr, false, renames, context)
    const assigns = this.getPendingAssigns(context)
    return _match(context?.outputContext)
      .with('json', () => `${assigns}${liquidJsonOutput(code)}`)
      .with('raw', () => `${assigns}{{ ${code} }}`)
      .with(context?.outputContext, () => `${assigns}${escapedOutput(code)}`)
      .exec() as string
  }

  private transformTemplateLiteralToLiquid(expr: TemplateLiteral, context?: ParsingContext, renames?: Record<string, string>): string {
    return _Maybe
      .of(expr.expressions.length === 0)
      .map((constant) => (constant ? this.constantTemplate(expr) : this.dynamicTemplate(expr, context, renames)))
      .getOrElse('')
  }

  private constantTemplate(expr: TemplateLiteral): string {
    const raw = expr.quasis.map((q) => q.value.raw).join('')
    return _match(raw.includes('|'))
      .with(true, () => raw)
      .with(raw.includes('|'), () => `"${raw}"`)
      .exec() as string
  }

  private dynamicTemplate(expr: TemplateLiteral, context?: ParsingContext, renames?: Record<string, string>): string {
    let result = expr.quasis[0].value.raw ? `"${expr.quasis[0].value.raw}"` : ''
    const arg = `(?:[a-zA-Z0-9_]+\\s*:\\s*)?(?:'[^']*'|"[^"]*"|[^,'\\"\\s|]+)`
    const regex = new RegExp(`^\\s*\\|\\s*([a-zA-Z0-9_]+(?:\\s*:\\s*${arg}(?:\\s*,\\s*${arg})*)?)`)
    for (let i = 0; i < expr.expressions.length; i++) {
      const base = this.generateLiquidCode(expr.expressions[i], false, renames, context)
      const quasi = expr.quasis[i + 1].value.raw
      const filters: string[] = []
      let remaining = quasi
      while (true) {
        const matched = remaining.match(regex)
        if (!matched) break
        let filterStr = matched[1].trim()
        filterStr = filterStr.replace(/crop\s*:\s*([^,'"\s]+)/g, (m, val) => {
          if (val === 'center' || val === 'top' || val === 'bottom' || val === 'left' || val === 'right') return `crop: '${val}'`
          return m
        })
        filters.push(filterStr)
        remaining = remaining.substring(matched[0].length)
      }
      const filterSuffix = filters.length > 0 ? ` | ${filters.join(' | ')}` : ''
      result = !result ? `${base}${filterSuffix}` : `${result} | append: ${base}${filterSuffix}`
      if (remaining) result += ` | append: "${remaining}"`
    }
    return result
  }
}
