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
  type LogicalExpression,
  type TemplateLiteral,
  type Expression,
  type MemberExpression,
  type BinaryExpression,
  type UnaryExpression,
  isParenthesizedExpression,
  identifier,
  isArrowFunctionExpression,
  type ArrowFunctionExpression,
  isUnaryExpression,
  isNullLiteral,
  isLogicalExpression,
  isBooleanLiteral,
} from '@babel/types'
import { _match, _try } from 'funcio'
import { escapeHtml, escapedOutput, liquidJsonOutput } from '../../../../../shared/html'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

const LIQUID_FILTERS = new Set(['markdownify', 'handleize', 'downcase', 'upcase', 'strip', 'strip_html', 'money', 'money_without_currency'])

const CLASSNAMES_FNS = new Set(['classNames', 'classnames', 'clsx'])

const STRING_LIKE_METHODS = new Set([
  'toString',
  'join',
  'toLowerCase',
  'toUpperCase',
  'trim',
  'markdownify',
  'handleize',
  'strip',
  'strip_html',
  'money',
  'money_without_currency',
])

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
    return _match(context === undefined)
      .with(true, () => '')
      .with(false, () => (context as ParsingContext).getPendingAssigns())
      .exec() as string
  }

  public generateLiquidCode(node: Node, inCondition = false, renames?: Record<string, string>, context?: ParsingContext): string {
    return _match(isTemplateLiteral(node))
      .with(true, () => this.templateParser.parse(node as TemplateLiteral, context, renames))
      .with(false, () => this.generateNodeCode(node, inCondition, renames, context))
      .exec() as string
  }

  private generateNodeCode(node: Node, inCondition = false, renames?: Record<string, string>, context?: ParsingContext): string {
    return _match(inCondition && this.hasMixedOperators(node))
      .with(true, () => this.stabilizedCondition(node, renames, context))
      .with(false, () => this.transpileNode(node, inCondition, renames, context))
      .exec() as string
  }

  private transpileNode(node: Node, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): string {
    const cloned = cloneNode(node, true)
    traverseFast(cloned, (child) => this.normalizeNode(child, inCondition, renames, context))
    const raw = generate(cloned).code
    const transpiled = _try
      .sync(() => this.compiler.transpileSync(raw, { loader: 'ts', format: 'esm', minify: false }))
      .match({
        right: (result) => result.code.replace(/;\n$/, '').trim(),
        left: () => raw,
      })
    return this.postprocess(transpiled)
  }

  private normalizeNode(n: Node, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    this.applyRename(n, renames)
    this.foldOptional(n)
    this.normalizeCall(n, inCondition, renames, context)
    this.normalizeUnary(n, renames, context)
    this.normalizeBinary(n, renames, context)
    this.normalizeMember(n)
  }

  private applyRename(n: Node, renames?: Record<string, string>): void {
    _match(isIdentifier(n) && Boolean(renames?.[(n as { name: string }).name]))
      .with(true, () => {
        ;(n as { name: string }).name = (renames as Record<string, string>)[(n as { name: string }).name]
      })
      .with(false, () => undefined)
      .exec()
  }

  private foldOptional(n: Node): void {
    _match(n.type)
      .with('OptionalMemberExpression', () => Object.assign(n, { type: 'MemberExpression' }))
      .with('OptionalCallExpression', () => Object.assign(n, { type: 'CallExpression' }))
      .with(n.type, () => this.foldParenthesized(n))
      .exec()
  }

  private foldParenthesized(n: Node): void {
    _match(isParenthesizedExpression(n))
      .with(true, () => Object.assign(n, (n as { expression: object }).expression))
      .with(false, () => undefined)
      .exec()
  }

  private normalizeCall(n: Node, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    _match(isCallExpression(n))
      .with(true, () => this.rewriteCall(n as CallExpression, inCondition, renames, context))
      .with(false, () => undefined)
      .exec()
  }

  private rewriteCall(n: CallExpression, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    _match(true)
      .with(isIdentifier(n.callee, { name: 'String' }), () => this.rewriteGlobalFilter(n, 'append: ""', inCondition, renames, context))
      .with(isIdentifier(n.callee, { name: 'Number' }), () => this.rewriteGlobalFilter(n, 'plus: 0', inCondition, renames, context))
      .with(isIdentifier(n.callee) && LIQUID_FILTERS.has((n.callee as { name: string }).name), () =>
        this.rewriteGlobalFilter(n, (n.callee as { name: string }).name, inCondition, renames, context),
      )
      .with(isIdentifier(n.callee) && CLASSNAMES_FNS.has((n.callee as { name: string }).name), () =>
        this.rewriteClassNames(n, inCondition, renames, context),
      )
      .with(isMemberExpression(n.callee) && isIdentifier((n.callee as { property: unknown }).property as Node), () =>
        this.rewriteMethod(n, inCondition, renames, context),
      )
      .with(true, () => undefined)
      .exec()
  }

  private rewriteGlobalFilter(
    n: CallExpression,
    filter: string,
    inCondition: boolean,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): void {
    const arg = n.arguments[0]
    _match(hasNodeType(arg))
      .with(true, () =>
        Object.assign(n, identifier(`${this.generateLiquidCode(arg as Expression, inCondition, renames, context)} | ${filter}`)),
      )
      .with(false, () => undefined)
      .exec()
  }

  private rewriteClassNames(n: CallExpression, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    _match(true)
      .with(n.arguments.length === 1, () => this.rewriteSingleClassName(n, n.arguments[0], inCondition, renames, context))
      .with(n.arguments.length > 1, () => this.rewriteJoinedClassNames(n, n.arguments, inCondition, renames, context))
      .with(true, () => undefined)
      .exec()
  }

  private rewriteSingleClassName(
    n: CallExpression,
    arg: CallExpression['arguments'][number],
    inCondition: boolean,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): void {
    _match(hasNodeType(arg))
      .with(true, () => Object.assign(n, identifier(this.generateLiquidCode(arg as Expression, inCondition, renames, context))))
      .with(false, () => undefined)
      .exec()
  }

  private rewriteJoinedClassNames(
    n: CallExpression,
    args: CallExpression['arguments'],
    inCondition: boolean,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): void {
    const joined = args
      .map((arg) => this.generateLiquidCode(arg as Expression, inCondition, renames, context))
      .join(' | append: " " | append: ')
    Object.assign(n, identifier(joined))
  }

  private rewriteMethod(n: CallExpression, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    const methodName = ((n.callee as { property: { name: string } }).property as { name: string }).name
    _match(methodName)
      .with('toString', () =>
        Object.assign(
          n,
          identifier(`${this.generateLiquidCode((n.callee as { object: Expression }).object, inCondition, renames, context)} | append: ""`),
        ),
      )
      .with('join', () => this.rewriteJoin(n, inCondition, renames, context))
      .with('toLowerCase', () => this.rewriteStringFilter(n, 'downcase', inCondition, context))
      .with('toUpperCase', () => this.rewriteStringFilter(n, 'upcase', inCondition, context))
      .with('trim', () => this.rewriteStringFilter(n, 'strip', inCondition, context))
      .with('find', () => this.rewriteFind(n, renames, context))
      .with('some', () => this.rewriteSome(n, renames, context))
      .with(methodName, () => undefined)
      .exec()
  }

  private rewriteJoin(n: CallExpression, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    const objectCode = this.generateLiquidCode((n.callee as { object: Expression }).object, inCondition, renames, context)
    const argCode = _match(n.arguments.length > 0)
      .with(true, () => this.generateLiquidCode(n.arguments[0] as Expression, inCondition, renames, context))
      .with(false, () => '""')
      .exec() as string
    Object.assign(n, identifier(`${objectCode} | join: ${argCode}`))
  }

  private rewriteStringFilter(n: CallExpression, filter: string, inCondition: boolean, context?: ParsingContext): void {
    _match(inCondition)
      .with(true, () => this.hoistStringFilter(n, filter, context))
      .with(false, () => undefined)
      .exec()
  }

  private hoistStringFilter(n: CallExpression, filter: string, context?: ParsingContext): void {
    const objectCode = generate((n.callee as { object: Node }).object).code
    _match(context === undefined)
      .with(true, () => Object.assign(n, identifier(`${objectCode} | ${filter}`)))
      .with(false, () => this.assignStringFilter(n, objectCode, filter, context as ParsingContext))
      .exec()
  }

  private assignStringFilter(n: CallExpression, objectCode: string, filter: string, context: ParsingContext): void {
    const varName = `${objectCode.replace(/[^a-zA-Z0-9_]/g, '_')}_${filter}`
    context.addPendingAssign(`{% assign ${varName} = ${objectCode} | ${filter} %}`)
    Object.assign(n, identifier(varName))
  }

  private rewriteFind(n: CallExpression, renames?: Record<string, string>, context?: ParsingContext): void {
    const callback = n.arguments[0]
    _match(this.isValidFindPredicate(callback))
      .with(true, () => this.buildFindLoop(n, callback as ArrowFunctionExpression, renames, context))
      .with(false, () => {
        throw new ValidationError(
          'Liquid .find() requires an inline arrow predicate such as items.find(item => item.available).',
          this.filePathOf(context),
          this.errorLocation(n),
        )
      })
      .exec()
  }

  private isValidFindPredicate(callback: CallExpression['arguments'][number]): boolean {
    return _match(isArrowFunctionExpression(callback as Node))
      .with(true, () => this.hasSingleIdentifierParam(callback as ArrowFunctionExpression))
      .with(false, () => false)
      .exec() as boolean
  }

  private hasSingleIdentifierParam(callback: ArrowFunctionExpression): boolean {
    return !callback.async && callback.params.length === 1 && isIdentifier(callback.params[0]) && callback.body.type !== 'BlockStatement'
  }

  private buildFindLoop(
    n: CallExpression,
    callback: ArrowFunctionExpression,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): void {
    _match(context === undefined)
      .with(true, () => {
        throw new ValidationError('Liquid .find() requires a parsing context.', undefined)
      })
      .with(false, () => this.emitFindLoop(n, callback, renames, context as ParsingContext))
      .exec()
  }

  private emitFindLoop(
    n: CallExpression,
    callback: ArrowFunctionExpression,
    renames: Record<string, string> | undefined,
    context: ParsingContext,
  ): void {
    const objectCode = this.generateLiquidCode((n.callee as { object: Expression }).object, false, renames, context)
    const itemName = (callback.params[0] as { name: string }).name
    const varName = context.allocateName('found')
    const precedingAssigns = context.getPendingAssigns()
    const condition = this.generateLiquidCode(callback.body as Expression, true, renames, context)
    const predicateAssigns = context.getPendingAssigns()
    _match(precedingAssigns !== '')
      .with(true, () => context.addPendingAssign(precedingAssigns.trimEnd()))
      .with(false, () => undefined)
      .exec()
    context.addPendingAssign(
      `{% assign ${varName} = nil %}\n{% for ${itemName} in ${objectCode} %}\n${predicateAssigns}  {% if ${condition} %}\n    {% assign ${varName} = ${itemName} %}\n    {% break %}\n  {% endif %}\n{% endfor %}`,
    )
    Object.assign(n, identifier(varName))
  }

  private rewriteSome(n: CallExpression, renames?: Record<string, string>, context?: ParsingContext): void {
    const callback = n.arguments[0]
    _match(isArrowFunctionExpression(callback as Node) && (callback as { params: unknown[] }).params.length > 0)
      .with(true, () => this.emitSomeLoop(n, callback as ArrowFunctionExpression, renames, context))
      .with(false, () => undefined)
      .exec()
  }

  private emitSomeLoop(
    n: CallExpression,
    callback: ArrowFunctionExpression,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): void {
    const objectCode = generate((n.callee as { object: Node }).object).code
    const itemName = _match(isIdentifier(callback.params[0]))
      .with(true, () => (callback.params[0] as { name: string }).name)
      .with(false, () => 'item')
      .exec() as string
    const varName = `${objectCode.replace(/[^a-zA-Z0-9_]/g, '_')}_some`
    const condition = this.generateLiquidCode(callback.body as Expression, true, renames, context)
    _match(context === undefined)
      .with(true, () => undefined)
      .with(false, () =>
        (context as ParsingContext).addPendingAssign(
          `{% assign ${varName} = false %}\n{% for ${itemName} in ${objectCode} %}\n  {% if ${condition} %}\n    {% assign ${varName} = true %}\n    {% break %}\n  {% endif %}\n{% endfor %}`,
        ),
      )
      .exec()
    Object.assign(n, identifier(varName))
  }

  private normalizeUnary(n: Node, renames?: Record<string, string>, context?: ParsingContext): void {
    _match(isUnaryExpression(n) && (n as UnaryExpression).operator === '!')
      .with(true, () => this.negateNode(n as UnaryExpression, renames, context))
      .with(false, () => undefined)
      .exec()
  }

  private negateNode(n: UnaryExpression, renames?: Record<string, string>, context?: ParsingContext): void {
    const code = this.generateLiquidCode(n.argument as Expression, true, renames, context).trim()
    Object.assign(n, identifier(`${code} == blank or ${code} == false`))
  }

  private normalizeBinary(n: Node, renames?: Record<string, string>, context?: ParsingContext): void {
    _match(isBinaryExpression(n))
      .with(true, () => this.rewriteBinary(n as BinaryExpression, renames, context))
      .with(false, () => undefined)
      .exec()
  }

  private rewriteBinary(n: BinaryExpression, renames?: Record<string, string>, context?: ParsingContext): void {
    _match(n.operator)
      .with('===', () => {
        n.operator = '=='
      })
      .with('!==', () => {
        n.operator = '!='
      })
      .with('+', () => this.rewritePlus(n, renames, context))
      .with('-', () => this.rewriteArithmetic(n, 'minus', renames, context))
      .with('*', () => this.rewriteArithmetic(n, 'times', renames, context))
      .with('/', () => this.rewriteArithmetic(n, 'divided_by', renames, context))
      .with('%', () => this.rewriteArithmetic(n, 'modulo', renames, context))
      .with(n.operator, () => undefined)
      .exec()
  }

  private rewritePlus(n: BinaryExpression, renames?: Record<string, string>, context?: ParsingContext): void {
    const leftCode = this.generateLiquidCode(n.left, false, renames, context)
    const rightCode = this.generateLiquidCode(n.right, false, renames, context)
    _match(isStringLiteral(n.left) || this.isLikelyString(n.left) || isStringLiteral(n.right) || this.isLikelyString(n.right))
      .with(true, () => Object.assign(n, identifier(`${leftCode} | append: ${rightCode}`)))
      .with(false, () => this.rewriteArithmetic(n, 'plus', renames, context))
      .exec()
  }

  private isLikelyString(node: BinaryExpression['left']): boolean {
    return _match(true)
      .with(isTemplateLiteral(node), () => true)
      .with(isCallExpression(node), () => STRING_LIKE_METHODS.has(this.methodNameOf(node as CallExpression)))
      .with(
        isMemberExpression(node) && isIdentifier((node as MemberExpression).property),
        () => !['length', 'size'].includes(((node as MemberExpression).property as { name: string }).name),
      )
      .with(true, () => false)
      .exec() as boolean
  }

  private methodNameOf(node: CallExpression): string {
    return _match(isMemberExpression(node.callee) && isIdentifier((node.callee as { property: unknown }).property as Node))
      .with(true, () => ((node.callee as { property: { name: string } }).property as { name: string }).name)
      .with(false, () => '')
      .exec() as string
  }

  private rewriteArithmetic(n: BinaryExpression, filter: string, renames?: Record<string, string>, context?: ParsingContext): void {
    const left = this.generateLiquidCode(n.left, false, renames, context)
    const rightCode = this.generateLiquidCode(n.right, false, renames, context)
    const right = _match(rightCode.includes(' | '))
      .with(true, () => this.hoistArithmetic(rightCode, context))
      .with(false, () => rightCode)
      .exec() as string
    Object.assign(n, identifier(`${left} | ${filter}: ${right}`))
  }

  private hoistArithmetic(rightCode: string, context?: ParsingContext): string {
    return _match(context === undefined)
      .with(true, () => {
        throw new ValidationError('Nested arithmetic requires a parsing context.')
      })
      .with(false, () => this.reserveArithmetic(rightCode, context as ParsingContext))
      .exec() as string
  }

  private reserveArithmetic(rightCode: string, context: ParsingContext): string {
    const temporary = context.allocateName('arithmetic')
    context.addPendingAssign(`{% assign ${temporary} = ${rightCode} %}`)
    return temporary
  }

  private normalizeMember(n: Node): void {
    _match(isMemberExpression(n))
      .with(true, () => this.normalizeMemberExpression(n))
      .with(false, () => undefined)
      .exec()
  }

  private normalizeMemberExpression(n: Node): void {
    _match(true)
      .with(this.isCssModuleReference(n), () => Object.assign(n, stringLiteral(this.cssModuleName(n))))
      .with(
        isIdentifier((n as { property?: unknown }).property as Node, { name: 'length' }) && !(n as { computed: boolean }).computed,
        () => {
          ;(n as { property: { name: string } }).property.name = 'size'
        },
      )
      .with(true, () => undefined)
      .exec()
  }

  private isCssModuleReference(n: Node): boolean {
    const object = (n as { object?: unknown }).object
    const property = (n as { property?: unknown }).property
    return (
      isIdentifier(object as Node) &&
      this.importResolver.getCssModules().has((object as { name: string }).name) &&
      (isIdentifier(property as Node) || isStringLiteral(property as Node))
    )
  }

  private cssModuleName(n: Node): string {
    const property = (n as { property: { name?: string; value?: string } }).property
    return _match(isIdentifier(property as Node))
      .with(true, () => (property as { name: string }).name)
      .with(false, () => (property as { value: string }).value)
      .exec() as string
  }

  private postprocess(code: string): string {
    const literals: string[] = []
    const protectedCode = code.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, (literal) => this.protectLiteral(literal, literals))
    return _pipeReplacements(protectedCode, literals)
  }

  private protectLiteral(literal: string, literals: string[]): string {
    literals.push(literal)
    return `__LIQUIDIFY_LITERAL_${literals.length - 1}__`
  }

  private hasMixedOperators(node: Node): boolean {
    const operators = new Set<string>()
    traverseFast(node, (child) => {
      _match(isLogicalExpression(child))
        .with(true, () => operators.add((child as LogicalExpression).operator))
        .with(false, () => undefined)
        .exec()
    })
    return operators.has('&&') && operators.has('||')
  }

  private stabilizedCondition(node: Node, renames?: Record<string, string>, context?: ParsingContext): string {
    return _match(context === undefined)
      .with(true, () => {
        throw new ValidationError('Mixed Liquid conditions require a parsing context.')
      })
      .with(false, () => this.stabilizeMixed(node, renames, context as ParsingContext))
      .exec() as string
  }

  private stabilizeMixed(node: Node, renames: Record<string, string> | undefined, context: ParsingContext): string {
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
      .with(isStringLiteral(expr), () => this.parseStringLiteral(expr as { value: string }, context))
      .with(this.loopParser.isMapCallExpression(expr), () => this.loopParser.transformMap(expr as CallExpression, renames, context))
      .with(this.isConsoleCall(expr), () => `<script>${this.generateLiquidCode(expr, false, renames, context)}</script>`)
      .with(isUnaryExpression(expr) && (expr as UnaryExpression).operator === '!', () =>
        this.renderNegation(expr as UnaryExpression, renames, context),
      )
      .with(isLogicalExpression(expr) && (expr as LogicalExpression).operator === '??', () =>
        this.parseNilCoalescing(expr as LogicalExpression, renames, context),
      )
      .with(true, () => this.parseDefault(expr, renames, context))
      .exec() as string
  }

  private isConsoleCall(expr: Expression): boolean {
    return (
      isCallExpression(expr) &&
      isMemberExpression((expr as CallExpression).callee) &&
      isIdentifier(((expr as CallExpression).callee as { object: unknown }).object as Node, { name: 'console' })
    )
  }

  private renderNegation(expr: UnaryExpression, renames?: Record<string, string>, context?: ParsingContext): string {
    const argCode = this.generateLiquidCode(expr.argument as Expression, false, renames, context)
    return `{% if ${argCode} == blank or ${argCode} == false %}true{% else %}false{% endif %}`
  }

  private parseStringLiteral(expr: { value: string }, context?: ParsingContext): string {
    const hasLiquidTags = expr.value.includes('{{') || expr.value.includes('{%')
    return _match(true)
      .with(hasLiquidTags, () => expr.value)
      .with(expr.value.includes('|'), () => `{{ ${expr.value.trim()} }}`)
      .with(this.outputContextOf(context) === 'raw', () => expr.value)
      .with(true, () => escapeHtml(expr.value))
      .exec() as string
  }

  private parseNilCoalescing(expr: LogicalExpression, renames?: Record<string, string>, context?: ParsingContext): string {
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
    return _match(this.outputContextOf(context))
      .with('json', () => liquidJsonOutput(code))
      .with('raw', () => `{{ ${code} }}`)
      .with('text', () => escapedOutput(code))
      .with(this.outputContextOf(context), () => escapedOutput(code))
      .exec() as string
  }

  private outputContextOf(context?: ParsingContext): string {
    return _match(context === undefined || context.outputContext === undefined)
      .with(true, () => 'text')
      .with(false, () => (context as ParsingContext).outputContext as string)
      .exec() as string
  }

  private filePathOf(context?: ParsingContext): string | undefined {
    return _match(context === undefined)
      .with(true, () => undefined)
      .with(false, () => (context as ParsingContext).currentFilePath)
      .exec() as string | undefined
  }

  private errorLocation(n: CallExpression): { line: number; column: number } | undefined {
    const loc = (n as { loc?: { start: { line: number; column: number } } }).loc
    return _match(loc === undefined)
      .with(true, () => undefined)
      .with(false, () => ({
        line: (loc as { start: { line: number } }).start.line,
        column: (loc as { start: { column: number } }).start.column + 1,
      }))
      .exec() as { line: number; column: number } | undefined
  }
}

function hasNodeType(arg: unknown): boolean {
  return typeof arg === 'object' && arg !== null && 'type' in arg
}

function _pipeReplacements(protectedCode: string, literals: string[]): string {
  return [
    [/\s*===\s*/g, ' == '],
    [/\s*!==\s*/g, ' != '],
    [/\s*&&\s*/g, ' and '],
    [/\s*\|\|\s*/g, ' or '],
    [/\?\./g, '.'],
    [/\.toLowerCase\s*\(\)/g, ' | downcase'],
    [/\.toUpperCase\s*\(\)/g, ' | upcase'],
    [/\.trim\s*\(\)/g, ' | strip'],
    [/\.markdownify\s*\(\)/g, ' | markdownify'],
    [/\.handleize\s*\(\)/g, ' | handleize'],
    [/\.stripHtml\s*\(\)/g, ' | strip_html'],
    [/\.strip_html\s*\(\)/g, ' | strip_html'],
    [/\.money\s*\(\)/g, ' | money'],
    [/\.moneyWithoutCurrency\s*\(\)/g, ' | money_without_currency'],
    [/\.money_without_currency\s*\(\)/g, ' | money_without_currency'],
    [/\.includes\s*\(([^)]+)\)/g, ' contains $1'],
  ]
    .reduce((code, [pattern, replacement]) => code.replace(pattern as RegExp, replacement as string), protectedCode)
    .replace(/__LIQUIDIFY_LITERAL_(\d+)__/g, (_, index) => literals[Number(index)])
    .trim()
}
