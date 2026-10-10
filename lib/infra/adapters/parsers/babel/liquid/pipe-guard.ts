import { _match } from 'funcio'
import type { ParsingContext } from '../../../../../core/entities/parsing-context'

function scanState() {
  return { single: false, dbl: false, tick: false, escaped: false }
}

function stepQuote(c: string, prev: string, s: { single: boolean; dbl: boolean; tick: boolean }): void {
  const escaped = prev === '\\'
  if (!escaped && c === "'" && !s.dbl && !s.tick) s.single = !s.single
  else if (!escaped && c === '"' && !s.single && !s.tick) s.dbl = !s.dbl
  else if (!escaped && c === '`' && !s.single && !s.dbl) s.tick = !s.tick
}

function inString(s: { single: boolean; dbl: boolean; tick: boolean }): boolean {
  return s.single || s.dbl || s.tick
}

export function hasTopLevelPipe(code: string): boolean {
  const s = scanState()
  for (let i = 0; i < code.length - 2; i++) {
    const c = code[i]
    stepQuote(c, i > 0 ? code[i - 1] : '', s)
    if (!inString(s) && c === ' ' && code[i + 1] === '|' && code[i + 2] === ' ') return true
  }
  return false
}

export function hoistPipedArg(code: string, prefix: string, context?: ParsingContext): string {
  return _match(!hasTopLevelPipe(code) || context === undefined)
    .with(true, () => code)
    .with(false, () => {
      const parsed = context as ParsingContext
      const temp = parsed.allocateName(prefix)
      parsed.addPendingAssign(`{% assign ${temp} = ${code} %}`)
      return temp
    })
    .exec() as string
}

const CHAR_LOCAL_FILTERS: ReadonlySet<string> = new Set([
  'escape',
  'escape_once',
  'upcase',
  'downcase',
  'capitalize',
  'strip',
  'lstrip',
  'rstrip',
  'strip_html',
  'strip_newlines',
  'newline_to_br',
  'url_encode',
  'url_decode',
  'append',
  'prepend',
  'json',
  'default',
  'size',
  'first',
  'last',
  'join',
  'split',
  'where',
  'where_exp',
  'sort',
  'uniq',
  'reverse',
  'minus',
  'plus',
  'times',
  'divided_by',
  'modulo',
  'round',
  'ceil',
  'floor',
  'abs',
])

export function lastTopLevelFilter(code: string): string | null {
  const s = scanState()
  let last: string | null = null
  for (let i = 0; i < code.length - 2; i++) {
    const c = code[i]
    stepQuote(c, i > 0 ? code[i - 1] : '', s)
    if (!inString(s) && c === ' ' && code[i + 1] === '|' && code[i + 2] === ' ') {
      const rest = code.slice(i + 3).trimStart()
      const name = rest.split(/[^a-zA-Z_]/, 1)[0] ?? ''
      last = name === '' ? last : name
    }
  }
  return last
}

export function needsHoist(code: string): boolean {
  if (!hasTopLevelPipe(code)) return false
  const last = lastTopLevelFilter(code)
  return last === null || !CHAR_LOCAL_FILTERS.has(last)
}

export function hoistLogicalOperators(code: string, prefix: string, context?: ParsingContext): string {
  if (typeof code !== 'string') {
    code = String(code)
  }
  return _match(context === undefined || !hasTopLevelLogical(code))
    .with(true, () => code)
    .with(false, () => {
      const parsed = context as ParsingContext
      const temp = parsed.allocateName(prefix)
      const parts = splitTopLevelLogical(code)
      if (parts.length <= 1) return code
      const [head, ...tail] = parts
      const headExpr = typeof head.expr === 'string' ? head.expr : String(head.expr)
      parsed.addPendingAssign(`{% assign ${temp} = ${headExpr} %}`)
      tail.forEach((part) => {
        const guard =
          part.operator === 'and'
            ? `{% if ${temp} == nil or ${temp} == "" or ${temp} == false or ${temp} == 0 %}{% else %}{% assign ${temp} = ${part.expr} %}{% endif %}`
            : `{% if ${temp} == nil or ${temp} == "" or ${temp} == false or ${temp} == 0 %}{% assign ${temp} = ${part.expr} %}{% endif %}`
        parsed.addPendingAssign(guard)
      })
      return temp
    })
    .exec() as string
}

function hasTopLevelLogical(code: string): boolean {
  const s = scanState()
  for (let i = 0; i < code.length - 4; i++) {
    const c = code[i]
    stepQuote(c, i > 0 ? code[i - 1] : '', s)
    if (!inString(s) && (code.startsWith(' or ', i) || code.startsWith(' and ', i))) return true
  }
  return false
}

function splitTopLevelLogical(code: string): { expr: string; operator: 'or' | 'and' }[] {
  const parts: { expr: string; operator: 'or' | 'and' }[] = []
  const s = scanState()
  let current = ''
  let operator: 'or' | 'and' | null = null
  for (let i = 0; i < code.length; i++) {
    const c = code[i]
    stepQuote(c, i > 0 ? code[i - 1] : '', s)
    if (!inString(s)) {
      if (code.startsWith(' or ', i)) {
        parts.push({ expr: current.trim(), operator: 'or' })
        current = ''
        i += 3
        operator = 'or'
        continue
      }
      if (code.startsWith(' and ', i)) {
        parts.push({ expr: current.trim(), operator: 'and' })
        current = ''
        i += 4
        operator = 'and'
        continue
      }
    }
    current += c
  }
  parts.push({ expr: current.trim(), operator: operator ?? 'or' })
  return parts
}
