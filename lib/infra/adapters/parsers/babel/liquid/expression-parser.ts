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
  isBlockStatement,
} from '@babel/types'
import { _match, _try } from 'funcio'
import { escapeHtml, escapedOutput, liquidJsonOutput } from '../../../../../shared/html'
import { HelperCallParser } from './helper-call-parser'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

const LIQUID_FILTERS = new Set(['markdownify', 'handleize', 'downcase', 'upcase', 'strip', 'strip_html', 'money', 'money_without_currency'])

const SHOPIFY_GLOBAL_FILTERS = new Set([
  'date',
  't',
  'translate',
  'asset_url',
  'stylesheet_tag',
  'script_tag',
  'image_url',
  'image_tag',
  'img_url',
  'link_to',
  'money_with_currency',
  'money_without_trailing_zeros',
  'weight_with_unit',
  'at_least',
  'at_most',
  'sum',
  'compact',
  'uniq',
  'default_errors',
  'format_address',
])

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

const TRANSPILE_CACHE_LIMIT = 1000

export class ExpressionParser {
  private readonly templateParser = new TemplateLiteralParser((node, renames, context) =>
    this.generateLiquidCode(node, false, renames, context),
  )
  private readonly transpileCache = new Map<string, string>()
  private readonly helperCallParser: HelperCallParser

  constructor(
    private readonly compiler: Compiler,
    private readonly importResolver: ImportResolver,
    private readonly loopParser: LiquidLoopParser,
  ) {
    this.helperCallParser = new HelperCallParser((node, inCondition, renames, context) =>
      this.generateLiquidCode(node as Node, inCondition, renames, context),
    )
  }

  public clearTranspileCache(): void {
    this.transpileCache.clear()
  }

  public get transpileCacheSize(): number {
    return this.transpileCache.size
  }

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
    const transpiled = this.transpileWithCache(raw)
    return this.postprocess(transpiled)
  }

  private transpileWithCache(raw: string): string {
    const cached = this.transpileCache.get(raw)
    if (cached !== undefined) return cached
    const transpiled = _try
      .sync(() => this.compiler.transpileSync(raw, { loader: 'ts', format: 'esm', minify: false }))
      .match({
        right: (result) => result.code.replace(/;\n$/, '').trim(),
        left: () => raw,
      })
    if (this.transpileCache.size >= TRANSPILE_CACHE_LIMIT) {
      const oldest = this.transpileCache.keys().next()
      if (!oldest.done) this.transpileCache.delete(oldest.value)
    }
    this.transpileCache.set(raw, transpiled)
    return transpiled
  }

  private normalizeNode(n: Node, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    this.applyRename(n, renames)
    this.foldOptional(n)
    this.stripConditionParens(n, inCondition)
    this.normalizeCall(n, inCondition, renames, context)
    this.normalizeUnary(n, renames, context)
    this.normalizeBinary(n, renames, context)
    this.normalizeMember(n)
  }

  private stripConditionParens(n: Node, inCondition: boolean): void {
    _match(inCondition && (n as { extra?: { parenthesized?: boolean } }).extra?.parenthesized === true)
      .with(true, () => {
        delete (n as { extra?: unknown }).extra
      })
      .with(false, () => undefined)
      .exec()
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
      .with(true, () => {
        const inner = (n as { expression: Node }).expression
        delete (n as { extra?: unknown }).extra
        Object.assign(n, cloneNode(inner, true))
      })
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
    if (this.helperCallParser.rewriteHelperCall(n, inCondition, renames, context)) return
    _match(true)
      .with(isIdentifier(n.callee, { name: 'String' }), () => this.rewriteGlobalFilter(n, 'append: ""', inCondition, renames, context))
      .with(isIdentifier(n.callee, { name: 'Number' }), () => this.rewriteGlobalFilter(n, 'plus: 0', inCondition, renames, context))
      .with(isIdentifier(n.callee) && LIQUID_FILTERS.has((n.callee as { name: string }).name), () =>
        this.rewriteGlobalFilter(n, (n.callee as { name: string }).name, inCondition, renames, context),
      )
      .with(isIdentifier(n.callee) && SHOPIFY_GLOBAL_FILTERS.has((n.callee as { name: string }).name), () =>
        this.rewriteShopifyGlobal(n, (n.callee as { name: string }).name, inCondition, renames, context),
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

  private rewriteShopifyGlobal(
    n: CallExpression,
    name: string,
    inCondition: boolean,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): void {
    const args = n.arguments
      .filter((arg) => hasNodeType(arg) && (arg as { type?: string }).type !== 'SpreadElement')
      .map((arg) => this.generateLiquidCode(arg as Expression, inCondition, renames, context))
    _match(args.length === 0)
      .with(true, () => {
        throw new ValidationError(
          `Liquid filter "${name}" requires at least one argument.`,
          this.filePathOf(context),
          this.errorLocation(n),
        )
      })
      .with(false, () => {
        const [first, ...rest] = args
        const filter = name === 'translate' ? 't' : name
        const suffix = rest.length > 0 ? `: ${rest.join(', ')}` : ''
        Object.assign(n, identifier(`${first} | ${filter}${suffix}`))
      })
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
    _match(!hasNodeType(arg) || (arg as { type?: string }).type === 'SpreadElement')
      .with(true, () => {
        throw new ValidationError(
          `Liquid filter "${filter}" requires a value argument (spread is not supported).`,
          this.filePathOf(context),
          this.errorLocation(n),
        )
      })
      .with(false, () =>
        Object.assign(n, identifier(`${this.generateLiquidCode(arg as Expression, inCondition, renames, context)} | ${filter}`)),
      )
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
    const parts = args.filter((arg) => hasNodeType(arg) && (arg as { type?: string }).type !== 'SpreadElement')
    _match(parts.length === 0)
      .with(true, () => {
        throw new ValidationError('clsx()/classNames() requires at least one argument.', this.filePathOf(context), this.errorLocation(n))
      })
      .with(false, () => {
        const joined = parts
          .map((arg) => {
            const code = this.generateLiquidCode(arg as Expression, inCondition, renames, context)
            return code.includes(' | ') ? `(${code})` : code
          })
          .join(' | append: " " | append: ')
        Object.assign(n, identifier(joined))
      })
      .exec()
  }

  private rewriteMethod(n: CallExpression, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    const callee = n.callee as { property?: unknown }
    _match(!isMemberExpression(n.callee) || !isIdentifier(callee.property as Node))
      .with(true, () => undefined)
      .with(false, () => this.rewriteKnownMethod(n, (callee.property as { name: string }).name, inCondition, renames, context))
      .exec()
  }

  private rewriteKnownMethod(
    n: CallExpression,
    methodName: string,
    inCondition: boolean,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): void {
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
      .with('split', () => this.rewriteSplit(n, inCondition, renames, context))
      .with('slice', () => this.rewriteSlice(n, inCondition, renames, context))
      .with('concat', () => this.rewriteConcat(n, inCondition, renames, context))
      .with('reverse', () => this.rewriteNoArgFilter(n, 'reverse', inCondition, renames, context))
      .with('sort', () => this.rewriteNoArgFilter(n, 'sort', inCondition, renames, context))
      .with('replace', () => this.rewriteReplace(n, inCondition, renames, context))
      .with('replaceAll', () => this.rewriteReplace(n, inCondition, renames, context))
      .with('substring', () => this.rewriteSlice(n, inCondition, renames, context))
      .with('truncate', () => this.rewriteSingleArgFilter(n, 'truncate', '50', inCondition, renames, context))
      .with('truncatewords', () => this.rewriteSingleArgFilter(n, 'truncatewords', '15', inCondition, renames, context))
      .with('prepend', () => this.rewriteSingleArgFilter(n, 'prepend', '""', inCondition, renames, context))
      .with('remove', () => this.rewriteSingleArgFilter(n, 'remove', '""', inCondition, renames, context))
      .with('upcase', () => this.rewriteNoArgFilter(n, 'upcase', inCondition, renames, context))
      .with('downcase', () => this.rewriteNoArgFilter(n, 'downcase', inCondition, renames, context))
      .with('stripHtml', () => this.rewriteNoArgFilter(n, 'strip_html', inCondition, renames, context))
      .with('urlEncode', () => this.rewriteNoArgFilter(n, 'url_encode', inCondition, renames, context))
      .with('first', () => this.rewriteNoArgFilter(n, 'first', inCondition, renames, context))
      .with('last', () => this.rewriteNoArgFilter(n, 'last', inCondition, renames, context))
      .with('size', () => this.rewriteNoArgFilter(n, 'size', inCondition, renames, context))
      .with('uniq', () => this.rewriteNoArgFilter(n, 'uniq', inCondition, renames, context))
      .with('compact', () => this.rewriteNoArgFilter(n, 'compact', inCondition, renames, context))
      .with('sum', () => this.rewriteNoArgFilter(n, 'sum', inCondition, renames, context))
      .with('floor', () => this.rewriteMathFilter(n, 'floor', inCondition, renames, context))
      .with('ceil', () => this.rewriteMathFilter(n, 'ceil', inCondition, renames, context))
      .with('round', () => this.rewriteMathFilter(n, 'round', inCondition, renames, context))
      .with('abs', () => this.rewriteMathFilter(n, 'abs', inCondition, renames, context))
      .with('max', () => this.rewriteMathBinary(n, 'at_least', inCondition, renames, context))
      .with('min', () => this.rewriteMathBinary(n, 'at_most', inCondition, renames, context))
      .with('stringify', () => this.rewriteJson(n, inCondition, renames, context))
      .with('keys', () => this.rewriteObjectKeys(n, context))
      .with(methodName, () => undefined)
      .exec()
  }

  private rewriteSplit(n: CallExpression, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    const objectCode = this.generateLiquidCode((n.callee as { object: Expression }).object, inCondition, renames, context)
    const argCode = _match(n.arguments.length > 0)
      .with(true, () => this.generateLiquidCode(n.arguments[0] as Expression, inCondition, renames, context))
      .with(false, () => '" "')
      .exec() as string
    Object.assign(n, identifier(`${objectCode} | split: ${argCode}`))
  }

  private rewriteSlice(n: CallExpression, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    const objectCode = this.generateLiquidCode((n.callee as { object: Expression }).object, inCondition, renames, context)
    const startNode = n.arguments[0] as Expression | undefined
    const endNode = n.arguments[1] as Expression | undefined
    const start = startNode ? this.generateLiquidCode(startNode, inCondition, renames, context) : '0'
    _match(endNode === undefined)
      .with(true, () => Object.assign(n, identifier(`${objectCode} | slice: ${start}`)))
      .with(false, () =>
        this.rewriteSliceRange(n, objectCode, start, startNode as Expression, endNode as Expression, inCondition, renames, context),
      )
      .exec()
  }

  private rewriteSliceRange(
    n: CallExpression,
    objectCode: string,
    start: string,
    startNode: Expression,
    endNode: Expression,
    inCondition: boolean,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): void {
    const startNum = startNode.type === 'NumericLiteral' ? (startNode as { value: number }).value : null
    const endNum = endNode.type === 'NumericLiteral' ? (endNode as { value: number }).value : null
    _match(startNum !== null && endNum !== null)
      .with(true, () => this.rewriteStaticSlice(n, objectCode, startNum as number, endNum as number))
      .with(false, () => {
        const end = this.generateLiquidCode(endNode, inCondition, renames, context)
        _match(startNum === 0)
          .with(true, () => Object.assign(n, identifier(`${objectCode} | slice: 0, ${end}`)))
          .with(false, () => this.rewriteDynamicSlice(n, objectCode, start, end, context))
          .exec()
      })
      .exec()
  }

  private rewriteDynamicSlice(
    n: CallExpression,
    objectCode: string,
    start: string,
    end: string,
    context?: ParsingContext,
  ): void {
    _match(context !== undefined)
      .with(true, () => {
        const temp = (context as ParsingContext).allocateName('slice')
        ;(context as ParsingContext).addPendingAssign(`{% assign ${temp} = ${end} | minus: ${start} %}`)
        Object.assign(n, identifier(`${objectCode} | slice: ${start}, ${temp}`))
      })
      .with(false, () => Object.assign(n, identifier(`${objectCode} | slice: ${start}, ${end}`)))
      .exec()
  }

  private rewriteStaticSlice(n: CallExpression, objectCode: string, startNum: number, endNum: number): void {
    _match(endNum <= startNum)
      .with(true, () => Object.assign(n, identifier('empty')))
      .with(false, () => Object.assign(n, identifier(`${objectCode} | slice: ${startNum}, ${endNum - startNum}`)))
      .exec()
  }

  private rewriteConcat(n: CallExpression, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    const objectCode = this.generateLiquidCode((n.callee as { object: Expression }).object, inCondition, renames, context)
    const argCode = _match(n.arguments.length > 0)
      .with(true, () => this.generateLiquidCode(n.arguments[0] as Expression, inCondition, renames, context))
      .with(false, () => 'empty')
      .exec() as string
    Object.assign(n, identifier(`${objectCode} | concat: ${argCode}`))
  }

  private rewriteNoArgFilter(
    n: CallExpression,
    filter: string,
    inCondition: boolean,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): void {
    const objectCode = this.generateLiquidCode((n.callee as { object: Expression }).object, inCondition, renames, context)
    Object.assign(n, identifier(`${objectCode} | ${filter}`))
  }

  private rewriteReplace(n: CallExpression, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    const objectCode = this.generateLiquidCode((n.callee as { object: Expression }).object, inCondition, renames, context)
    const from = _match(n.arguments.length > 0)
      .with(true, () => this.generateLiquidCode(n.arguments[0] as Expression, inCondition, renames, context))
      .with(false, () => '""')
      .exec() as string
    const to = _match(n.arguments.length > 1)
      .with(true, () => `, ${this.generateLiquidCode(n.arguments[1] as Expression, inCondition, renames, context)}`)
      .with(false, () => '')
      .exec() as string
    Object.assign(n, identifier(`${objectCode} | replace: ${from}${to}`))
  }

  private rewriteSingleArgFilter(
    n: CallExpression,
    filter: string,
    fallback: string,
    inCondition: boolean,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): void {
    const objectCode = this.generateLiquidCode((n.callee as { object: Expression }).object, inCondition, renames, context)
    const argCode = _match(n.arguments.length > 0)
      .with(true, () => this.generateLiquidCode(n.arguments[0] as Expression, inCondition, renames, context))
      .with(false, () => fallback)
      .exec() as string
    Object.assign(n, identifier(`${objectCode} | ${filter}: ${argCode}`))
  }

  private rewriteMathFilter(
    n: CallExpression,
    filter: string,
    inCondition: boolean,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): void {
    const target = _match(isMemberExpression(n.callee) && (n.callee as { object: unknown }).object !== undefined)
      .with(true, () => this.mathTarget(n, inCondition, renames, context))
      .with(false, () => '')
      .exec() as string
    _match(target === '')
      .with(true, () => undefined)
      .with(false, () => Object.assign(n, identifier(`${target} | ${filter}`)))
      .exec()
  }

  private mathTarget(n: CallExpression, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): string {
    const callee = n.callee as { object: Expression }
    const obj = callee.object
    const isMathCall = isIdentifier(obj) && (obj as { name: string }).name === 'Math'
    return _match(true)
      .with(isMathCall && n.arguments.length === 0, () => {
        throw new ValidationError(
          'Math method requires an argument (e.g. Math.floor(price)).',
          this.filePathOf(context),
          this.errorLocation(n),
        )
      })
      .with(isMathCall && n.arguments.length > 0, () =>
        this.generateLiquidCode(n.arguments[0] as Expression, inCondition, renames, context),
      )
      .with(true, () => this.generateLiquidCode(obj, inCondition, renames, context))
      .exec() as string
  }

  private rewriteMathBinary(
    n: CallExpression,
    filter: string,
    inCondition: boolean,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): void {
    const callee = n.callee as { object: Expression }
    const obj = callee.object
    const isMath = isIdentifier(obj) && (obj as { name: string }).name === 'Math'
    const hasSpread = n.arguments.some((a) => (a as { type?: string }).type === 'SpreadElement')
    _match(true)
      .with(!isMath, () => undefined)
      .with(n.arguments.length < 2 || hasSpread, () => {
        throw new ValidationError(
          'Math.max/min require two plain arguments (e.g. Math.max(a, b)). Spread is not supported in Liquid.',
          this.filePathOf(context),
          this.errorLocation(n),
        )
      })
      .with(true, () => {
        const first = this.generateLiquidCode(n.arguments[0] as Expression, inCondition, renames, context)
        const second = this.generateLiquidCode(n.arguments[1] as Expression, inCondition, renames, context)
        Object.assign(n, identifier(`${first} | ${filter}: ${second}`))
      })
      .exec()
  }

  private rewriteJson(n: CallExpression, inCondition: boolean, renames?: Record<string, string>, context?: ParsingContext): void {
    const callee = n.callee as { object: Expression }
    const obj = callee.object
    const prop = (n.callee as { property?: { name?: string } }).property?.name
    const isJsonParse = isIdentifier(obj) && (obj as { name: string }).name === 'JSON' && prop === 'parse'
    const isJsonStringify = isIdentifier(obj) && (obj as { name: string }).name === 'JSON' && n.arguments.length > 0
    _match(true)
      .with(isJsonParse, () => {
        throw new ValidationError(
          'JSON.parse() has no Liquid equivalent. Pass parsed data as props instead.',
          this.filePathOf(context),
          this.errorLocation(n),
        )
      })
      .with(isJsonStringify, () => {
        const arg = this.generateLiquidCode(n.arguments[0] as Expression, inCondition, renames, context)
        Object.assign(n, identifier(`${arg} | json`))
      })
      .with(true, () => undefined)
      .exec()
  }

  private rewriteObjectKeys(n: CallExpression, context?: ParsingContext): void {
    const callee = n.callee as { object: Expression }
    const obj = callee.object
    _match(isIdentifier(obj) && (obj as { name: string }).name === 'Object')
      .with(true, () => {
        throw new ValidationError(
          'Object.keys() has no direct Liquid filter. Iterate with `for (const key of Object.keys(obj))` is not supported; use `{% for pair in obj %}{{ pair[0] }}{% endfor %}` pattern or pass keys as an array prop.',
          this.filePathOf(context),
          this.errorLocation(n),
        )
      })
      .with(false, () => undefined)
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
    const objectCode = this.generateLiquidCode((n.callee as { object: Expression }).object, false, undefined, context)
    _match(context === undefined)
      .with(true, () => Object.assign(n, identifier(`${objectCode} | ${filter}`)))
      .with(false, () => this.assignStringFilter(n, objectCode, filter, context as ParsingContext))
      .exec()
  }

  private assignStringFilter(n: CallExpression, objectCode: string, filter: string, context: ParsingContext): void {
    const sanitized = objectCode.replace(/[^a-zA-Z0-9_]/g, '_')
    const safe = /^[0-9]/.test(sanitized) ? `v_${sanitized}` : sanitized || 'v'
    const varName = `${safe}_${filter}`
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
      .with(
        true,
        () =>
          this.hasSingleIdentifierParam(callback as ArrowFunctionExpression) &&
          this.hasReadablePredicate(callback as ArrowFunctionExpression),
      )
      .with(false, () => false)
      .exec() as boolean
  }

  private hasReadablePredicate(callback: ArrowFunctionExpression): boolean {
    return _match(callback.body.type)
      .with('BlockStatement', () => this.hasSingleReturn(callback))
      .with(callback.body.type, () => true)
      .exec() as boolean
  }

  private hasSingleReturn(callback: ArrowFunctionExpression): boolean {
    const body = callback.body as { body?: Array<{ type?: string; argument?: unknown }> }
    const statements = body.body ?? []
    return (
      statements.length === 1 &&
      statements[0].type === 'ReturnStatement' &&
      statements[0].argument !== null &&
      statements[0].argument !== undefined
    )
  }

  private hasSingleIdentifierParam(callback: ArrowFunctionExpression): boolean {
    return !callback.async && callback.params.length === 1 && isIdentifier(callback.params[0])
  }

  private findPredicateBody(callback: ArrowFunctionExpression): Expression {
    return _match(callback.body.type === 'BlockStatement')
      .with(true, () => (callback.body as { body: Array<{ argument: Expression }> }).body[0].argument as Expression)
      .with(false, () => callback.body as Expression)
      .exec() as Expression
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
    const condition = this.generateLiquidCode(this.findPredicateBody(callback), true, renames, context)
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
    _match(!isArrowFunctionExpression(callback as Node) || (callback as { params: unknown[] }).params.length === 0)
      .with(true, () => {
        throw new ValidationError(
          'Liquid .some() requires an inline arrow predicate such as items.some(item => item.available).',
          this.filePathOf(context),
          this.errorLocation(n),
        )
      })
      .with(false, () => this.emitSomeLoop(n, callback as ArrowFunctionExpression, renames, context))
      .exec()
  }

  private emitSomeLoop(
    n: CallExpression,
    callback: ArrowFunctionExpression,
    renames?: Record<string, string>,
    context?: ParsingContext,
  ): void {
    const objectCode = this.generateLiquidCode((n.callee as { object: Expression }).object, false, renames, context)
    const itemName = isIdentifier(callback.params[0]) ? (callback.params[0] as { name: string }).name : 'item'
    const predicate = isBlockStatement(callback.body) ? this.blockPredicate(callback.body) : (callback.body as Expression)
    const varName = context?.allocateName('some') ?? `${objectCode.replace(/[^a-zA-Z0-9_]/g, '_')}_some`
    const condition = this.generateLiquidCode(predicate, true, renames, context)
    _match(context === undefined)
      .with(true, () => Object.assign(n, identifier(varName)))
      .with(false, () => {
        ;(context as ParsingContext).addPendingAssign(
          `{% assign ${varName} = false %}\n{% for ${itemName} in ${objectCode} %}\n  {% if ${condition} %}\n    {% assign ${varName} = true %}\n    {% break %}\n  {% endif %}\n{% endfor %}`,
        )
        Object.assign(n, identifier(varName))
      })
      .exec()
  }

  private blockPredicate(body: import('@babel/types').BlockStatement): Expression {
    const found = body.body.find((s) => s.type === 'ReturnStatement' && (s as { argument?: Expression }).argument)
    const arg = (found as { argument?: Expression } | undefined)?.argument
    return _match(arg === undefined)
      .with(true, () => {
        throw new ValidationError('Liquid .some() block body must have a single return with a condition.')
      })
      .with(false, () => arg as Expression)
      .exec() as Expression
  }

  private normalizeUnary(n: Node, renames?: Record<string, string>, context?: ParsingContext): void {
    _match(isUnaryExpression(n) && (n as UnaryExpression).operator === '!')
      .with(true, () => this.negateNode(n as UnaryExpression, renames, context))
      .with(false, () => undefined)
      .exec()
  }

  private negateNode(n: UnaryExpression, renames?: Record<string, string>, context?: ParsingContext): void {
    const code = this.generateLiquidCode(n.argument as Expression, true, renames, context).trim()
    _match(context !== undefined && !/^[a-zA-Z0-9_.[\]"']+$/.test(code))
      .with(true, () => {
        const temp = (context as ParsingContext).allocateName('not')
        ;(context as ParsingContext).addPendingAssign(`{% assign ${temp} = ${code} %}`)
        Object.assign(n, identifier(`${temp} == blank or ${temp} == false`))
      })
      .with(false, () => Object.assign(n, identifier(`${code} == blank or ${code} == false`)))
      .exec()
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
    const right = _match(this.hasTopLevelPipe(rightCode))
      .with(true, () => this.hoistArithmetic(rightCode, context))
      .with(false, () => rightCode)
      .exec() as string
    Object.assign(n, identifier(`${left} | ${filter}: ${right}`))
  }

  private hasTopLevelPipe(code: string): boolean {
    let single = false
    let dbl = false
    for (let i = 0; i < code.length - 2; i++) {
      const c = code[i]
      if (c === "'" && !dbl) single = !single
      else if (c === '"' && !single) dbl = !dbl
      else if (!single && !dbl && c === ' ' && code[i + 1] === '|' && code[i + 2] === ' ') return true
    }
    return false
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
    const m = n as { property?: unknown; computed?: boolean }
    const prop = m.property as Node | undefined
    const isLength =
      (isIdentifier(prop as Node, { name: 'length' }) && !m.computed) ||
      (prop?.type === 'StringLiteral' && (prop as { value: string }).value === 'length')
    _match(true)
      .with(this.isCssModuleReference(n), () => Object.assign(n, stringLiteral(this.cssModuleName(n))))
      .with(isMemberExpression(n) && isLength, () => {
        ;(n as { property: { name: string } }).property = identifier('size') as unknown as { name: string }
        ;(n as { computed: boolean }).computed = false
      })
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
    return _match(true)
      .with(isIdentifier(property as Node), () => (property as { name: string }).name)
      .with(isStringLiteral(property as Node), () => (property as { value: string }).value)
      .with(true, () => {
        throw new ValidationError('CSS module access requires a static key (e.g. styles.button).')
      })
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
    let hasNegation = false
    traverseFast(node, (child) => {
      _match(isLogicalExpression(child))
        .with(true, () => operators.add((child as LogicalExpression).operator))
        .with(false, () => undefined)
        .exec()
      _match(isUnaryExpression(child) && (child as UnaryExpression).operator === '!')
        .with(true, () => {
          hasNegation = true
        })
        .with(false, () => undefined)
        .exec()
    })
    return (
      (operators.has('&&') && operators.has('||')) ||
      (hasNegation && operators.has('&&'))
    )
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
    const helper = this.helperCallParser.parseHelperExpression(expr, renames, context)
    return _match(true)
      .with(helper !== null, () => helper as string)
      .with(isNullLiteral(expr), () => `${this.getPendingAssigns(context)}${this.renderOutput('nil', context)}`)
      .with(isBooleanLiteral(expr), () => {
        const lit = (expr as { value: boolean }).value ? 'true' : 'false'
        return `${this.getPendingAssigns(context)}${this.renderOutput(lit, context)}`
      })
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
    return _match(true)
      .with(expr.value.includes('{{') || expr.value.includes('{%'), () => expr.value)
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
    return _match(this.isSnippetChildren(code) && this.outputContextOf(context) !== 'json')
      .with(true, () => `{{ ${code} }}`)
      .with(false, () =>
        _match(this.outputContextOf(context))
          .with('json', () => liquidJsonOutput(code))
          .with('raw', () => `{{ ${code} }}`)
          .with(this.outputContextOf(context), () => escapedOutput(code))
          .exec(),
      )
      .exec() as string
  }

  private isSnippetChildren(code: string): boolean {
    return /^\s*children\s*$/.test(code)
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
  const replaced = [
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
  ].reduce((code, [pattern, replacement]) => code.replace(pattern as RegExp, replacement as string), protectedCode)
  return replaceIncludesBalanced(replaced)
    .replace(/__LIQUIDIFY_LITERAL_(\d+)__/g, (_, index) => literals[Number(index)])
    .trim()
}

const INCLUDES_NEEDLE = '.includes'

function replaceIncludesBalanced(code: string): string {
  return replaceNextIncludes(code, 0, '')
}

function replaceNextIncludes(code: string, from: number, out: string): string {
  const idx = code.indexOf(INCLUDES_NEEDLE, from)
  return _match(idx === -1)
    .with(true, () => `${out}${code.slice(from)}`)
    .with(false, () => replaceIncludesAt(code, from, idx, out))
    .exec() as string
}

function replaceIncludesAt(code: string, from: number, idx: number, out: string): string {
  const open = skipIncludesWhitespace(code, idx + INCLUDES_NEEDLE.length)
  return _match(code[open] !== '(')
    .with(true, () => replaceNextIncludes(code, open, `${out}${code.slice(from, open)}`))
    .with(false, () => closeIncludesCall(code, from, idx, open, out))
    .exec() as string
}

function skipIncludesWhitespace(code: string, at: number): number {
  return _match(at < code.length && /\s/.test(code[at] ?? ''))
    .with(true, () => skipIncludesWhitespace(code, at + 1))
    .with(false, () => at)
    .exec() as number
}

function closeIncludesCall(code: string, from: number, idx: number, open: number, out: string): string {
  const close = findClosingParen(code, open + 1, 1)
  return _match(close === -1)
    .with(true, () => `${out}${code.slice(from)}`)
    .with(false, () =>
      replaceNextIncludes(code, close + 1, `${out}${code.slice(from, idx)} contains ${code.slice(open + 1, close).trim()}`),
    )
    .exec() as string
}

function findClosingParen(code: string, at: number, depth: number): number {
  return _match(true)
    .with(at >= code.length, () => -1)
    .with(code[at] === '(', () => findClosingParen(code, at + 1, depth + 1))
    .with(code[at] === ')', () => (depth === 1 ? at : findClosingParen(code, at + 1, depth - 1)))
    .with(true, () => findClosingParen(code, at + 1, depth))
    .exec() as number
}
