import { scanDelimitedBody } from '@adapters/parsers/babel/preprocessing/delimited-body'
import { quotedSpanEnd, commentSpanEnd, isQuote } from '@adapters/parsers/babel/preprocessing/source-spans'

const LIQUID_TAGS = new Set([
  'assign',
  'capture',
  'case',
  'comment',
  'decrement',
  'echo',
  'elsif',
  'else',
  'endcapture',
  'endcase',
  'endcomment',
  'endfor',
  'endform',
  'endif',
  'endpaginate',
  'endraw',
  'endstyle',
  'endtablerow',
  'for',
  'form',
  'if',
  'ifchanged',
  'include',
  'increment',
  'layout',
  'liquid',
  'paginate',
  'raw',
  'render',
  'section',
  'style',
  'tablerow',
  'unless',
  'when',
  'schema',
  'stylesheet',
  'endstylesheet',
  'javascript',
  'endjavascript',
  'endlayout',
])

function isKnownTag(body: string): boolean {
  const trimmed = body.trim()
  const firstSpace = trimmed.indexOf(' ')
  return LIQUID_TAGS.has(firstSpace >= 0 ? trimmed.slice(0, firstSpace) : trimmed)
}

export function replaceLiquidTags(source: string): string {
  let output = ''
  let cursor = 0
  while (cursor < source.length) {
    const character = source[cursor]
    const spanEnd = isQuote(character) ? quotedSpanEnd(source, cursor) : commentSpanEnd(source, cursor)
    if (spanEnd !== undefined) {
      output += source.slice(cursor, spanEnd)
      cursor = spanEnd
      continue
    }
    if (source.startsWith('{%', cursor)) {
      const token = scanDelimitedBody(source, cursor + 2, 'tag')
      if (token && isKnownTag(token.body)) {
        output += `{${JSON.stringify(`{%${token.body}%}`)}}`
        cursor = token.end
        continue
      }
      output += '{%'
      cursor += 2
      continue
    }
    output += character
    cursor++
  }
  return output
}
