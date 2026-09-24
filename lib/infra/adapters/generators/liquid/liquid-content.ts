import { _match } from 'funcio'
import type { ParsedComponent } from '../../../../core/entities/parsed-component'
import { VOID_TAGS as voidTags } from '../../../../shared/liquid-constants'

interface ScanState {
  tokens: string[]
  start: number
  cursor: number
}

function htmlTokens(html: string): string[] {
  const end = Array.from({ length: html.length }, (_, index) => index).reduce((state, index) => stepToken(html, index, state), {
    tokens: [] as string[],
    start: 0,
    cursor: 0,
  })
  return _match(end.start < html.length)
    .with(true, () => [...end.tokens, html.slice(end.start)])
    .with(false, () => end.tokens)
    .exec() as string[]
}

function stepToken(html: string, index: number, state: ScanState): ScanState {
  return _match(index < state.cursor)
    .with(true, () => state)
    .with(false, () => openToken(html, index, state))
    .exec() as ScanState
}

function openToken(html: string, index: number, state: ScanState): ScanState {
  const end = liquidEnd(html, index)
  return _match(end === null)
    .with(true, () => openTag(html, index, state))
    .with(false, () => skipTo(state, (end as number) + 2))
    .exec() as ScanState
}

function liquidEnd(html: string, index: number): number | null {
  return _match(html.startsWith('{%', index) || html.startsWith('{{', index))
    .with(true, () => findClosing(html, index))
    .with(false, () => null)
    .exec() as number | null
}

function findClosing(html: string, index: number): number | null {
  const closing = _match(html[index + 1] === '%')
    .with(true, () => '%}')
    .with(false, () => '}}')
    .exec() as string
  const end = html.indexOf(closing, index + 2)
  return _match(end >= 0)
    .with(true, () => end)
    .with(false, () => null)
    .exec() as number | null
}

function openTag(html: string, index: number, state: ScanState): ScanState {
  return _match(html[index] === '<' && /[A-Za-z/!?]/.test(html[index + 1] || ''))
    .with(true, () => closeTag(html, index, state))
    .with(false, () => skipTo(state, index + 1))
    .exec() as ScanState
}

function closeTag(html: string, index: number, state: ScanState): ScanState {
  const end = tagEnd(html, index + 1, '')
  return _match(end === null)
    .with(true, () => skipTo(state, index + 1))
    .with(false, () => emitToken(html, state, index, end as number))
    .exec() as ScanState
}

function tagEnd(html: string, pos: number, quote: string): number | null {
  return _match(pos >= html.length)
    .with(true, () => null)
    .with(false, () => tagChar(html, pos, quote))
    .exec() as number | null
}

function tagChar(html: string, pos: number, quote: string): number | null {
  const char = html[pos]
  return _match(true)
    .with(quote !== '' && char === quote, () => tagEnd(html, pos + 1, ''))
    .with(quote !== '', () => tagEnd(html, pos + 1, quote))
    .with(char === '"' || char === "'", () => tagEnd(html, pos + 1, char))
    .with(char === '>', () => pos)
    .with(true, () => tagEnd(html, pos + 1, quote))
    .exec() as number | null
}

function skipTo(state: ScanState, cursor: number): ScanState {
  return { tokens: state.tokens, start: state.start, cursor }
}

function emitToken(html: string, state: ScanState, index: number, end: number): ScanState {
  const tokens = _match(state.start < index)
    .with(true, () => [...state.tokens, html.slice(state.start, index), html.slice(index, end + 1)])
    .with(false, () => [...state.tokens, html.slice(index, end + 1)])
    .exec() as string[]
  return { tokens, start: end + 1, cursor: end + 1 }
}

interface FormatState {
  indent: number
  lines: string[]
}

export function formatHtml(html: string): string {
  return htmlTokens(html)
    .reduce((state, token) => formatToken(token, state), { indent: 0, lines: [] as string[] })
    .lines.join('\n')
}

function formatToken(token: string, state: FormatState): FormatState {
  const trimmed = token.trim()
  return _match(trimmed === '')
    .with(true, () => state)
    .with(false, () => indentLine(token, trimmed, state))
    .exec() as FormatState
}

function indentLine(token: string, trimmed: string, state: FormatState): FormatState {
  const dedented = Math.max(0, state.indent - closingDepth(token))
  const body = _match(token.startsWith('<'))
    .with(true, () => token)
    .with(false, () => trimmed)
    .exec() as string
  const line = `${'  '.repeat(dedented)}${body}`
  return { indent: dedented + openingDepth(token), lines: [...state.lines, line] }
}

function closingDepth(token: string): number {
  return _match(/^<\/[\w:-]+\s*>$/.test(token))
    .with(true, () => 1)
    .with(false, () => 0)
    .exec() as number
}

function openingDepth(token: string): number {
  const opening = /^<([\w:-]+)(?=[\s/>])/.exec(token)
  return _match(opening !== null && !/\/\s*>$/.test(token) && !voidTags.has((opening as string[])[1].toLowerCase()))
    .with(true, () => 1)
    .with(false, () => 0)
    .exec() as number
}

function scriptTag(scriptFile: string): string {
  const scriptName = scriptFile.replace(/\.js$/, '')
  const scriptVar = `script_${scriptName.replace(/[^a-zA-Z0-9]/g, '_')}_loaded`
  return `\n\n{%- unless ${scriptVar} -%}\n  <script src="{{ '${scriptFile}' | asset_url }}" defer></script>\n  {%- assign ${scriptVar} = true -%}\n{%- endunless -%}`
}

export function buildLiquidContent(component: ParsedComponent, fileName: string): string {
  return [
    assignmentsHead(component),
    formatHtml(component.html),
    scriptsSection(component, fileName),
    schemaSection(component),
    cssSection(component),
  ].join('')
}

function assignmentsHead(component: ParsedComponent): string {
  const assignments = component.liquidAssignments ?? []
  return _match(assignments.length > 0)
    .with(true, () => `${assignments.join('\n')}\n\n`)
    .with(false, () => '')
    .exec() as string
}

function scriptsSection(component: ParsedComponent, fileName: string): string {
  return _match(component.mode === 'dom:global')
    .with(true, () => '')
    .with(false, () =>
      ownScript(component, fileName)
        .concat(component.scriptAssets ?? [])
        .map(scriptTag)
        .join(''),
    )
    .exec() as string
}

function ownScript(component: ParsedComponent, fileName: string): string[] {
  const assets = component.scriptAssets ?? []
  return _match(component.type !== 'snippets' && component.hasScript && !assets.includes(`${fileName}.js`))
    .with(true, () => [`${fileName}.js`])
    .with(false, () => [] as string[])
    .exec() as string[]
}

function schemaSection(component: ParsedComponent): string {
  return _match(component.type === 'snippets')
    .with(true, () => '')
    .with(false, () => schemaBlock(component))
    .exec() as string
}

function schemaBlock(component: ParsedComponent): string {
  const blocks = _match((component.blocksSchema ?? []).length > 0)
    .with(true, () => ({ blocks: component.blocksSchema }))
    .with(false, () => ({}))
    .exec() as Record<string, unknown>
  const schema = { ...component.schema, ...blocks }
  return `\n\n{% schema %}\n${JSON.stringify(schema, null, 2)}\n{% endschema %}`
}

function cssSection(component: ParsedComponent): string {
  return _match(!component.css)
    .with(true, () => '')
    .with(false, () => `\n\n{% stylesheet %}\n${component.css}{% endstylesheet %}`)
    .exec() as string
}
