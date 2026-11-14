import { scanDelimitedBody } from '@adapters/parsers/babel/preprocessing/delimited-body'
import { quotedSpanEnd, commentSpanEnd, isQuote } from '@adapters/parsers/babel/preprocessing/source-spans'

function looksLikeLiquid(body: string): boolean {
  const trimmed = body.trim()
  return trimmed.length > 0 && (/[|.[]/.test(trimmed) || /^[a-zA-Z_$][\w$]*$/.test(trimmed))
}

function nextBoundary(source: string, cursor: number, previous: boolean): boolean {
  const character = source[cursor]
  if (character === '>' || character === '\n' || source.startsWith('%}', cursor)) return true
  if (![' ', '\t', '\r', '}'].includes(character)) return false
  return previous
}

export function replaceLiquidOutputs(source: string): string {
  let output = ''
  let cursor = 0
  let boundary = true
  while (cursor < source.length) {
    const character = source[cursor]
    if (boundary && source.startsWith('{{', cursor)) {
      const token = scanDelimitedBody(source, cursor + 2, 'output')
      if (token && looksLikeLiquid(token.body)) {
        output += `{${JSON.stringify(`{{${token.body}}}`)}}`
        cursor = token.end
        boundary = false
        continue
      }
      output += '{{'
      cursor += 2
      boundary = false
      continue
    }
    boundary = nextBoundary(source, cursor, boundary)
    const spanEnd = isQuote(character) ? quotedSpanEnd(source, cursor) : commentSpanEnd(source, cursor)
    if (spanEnd !== undefined) {
      output += source.slice(cursor, spanEnd)
      cursor = spanEnd
      boundary = false
      continue
    }
    output += character
    cursor++
  }
  return output
}
