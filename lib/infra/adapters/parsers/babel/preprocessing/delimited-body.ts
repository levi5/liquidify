import { quotedSpanEnd } from '@adapters/parsers/babel/preprocessing/source-spans'

interface DelimitedBody {
  body: string
  end: number
}

export function scanDelimitedBody(source: string, start: number, kind: 'tag' | 'output'): DelimitedBody | undefined {
  let cursor = start
  let body = ''
  let depth = 0
  const closing = kind === 'tag' ? '%}' : '}}'
  while (cursor < source.length) {
    const character = source[cursor]
    if (character === '"' || character === "'") {
      const end = quotedSpanEnd(source, cursor)
      body += source.slice(cursor, end)
      cursor = end
      continue
    }
    if (kind === 'output' && source.startsWith('{{', cursor)) {
      depth++
      body += character
      cursor++
      continue
    }
    if (source.startsWith(closing, cursor)) {
      if (depth === 0) return { body, end: cursor + 2 }
      depth--
    }
    body += character
    cursor++
  }
  return undefined
}
