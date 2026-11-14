import { parseExpression } from '@babel/parser'
import { _try } from 'funcio'

const FILTER_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*/

function isJavaScriptExpression(source: string): boolean {
  return _try
    .sync(() => parseExpression(source, { plugins: ['jsx', 'typescript'] }))
    .match({
      right: () => true,
      left: () => false,
    })
}

function hasFilterArguments(segment: string): boolean {
  const trimmed = segment.trimStart()
  const name = FILTER_NAME_PATTERN.exec(trimmed)?.[0]
  return name !== undefined && trimmed.slice(name.length).trimStart().startsWith(':')
}

function hasLiquidPipe(expression: string): boolean {
  return expression.split('|').some((segment, index, segments) => {
    const previous = segments[index - 1]
    return Boolean(previous) && !previous.endsWith('&') && hasFilterArguments(segment)
  })
}

function stringSpanEnd(source: string, start: number): number | undefined {
  let escaped = false
  for (let cursor = start + 1; cursor < source.length; cursor++) {
    const character = source[cursor]
    if (escaped) {
      escaped = false
      continue
    }
    if (character === '\\') {
      escaped = true
      continue
    }
    if (character === source[start]) return cursor + 1
  }
  return undefined
}

function braceSpanEnd(source: string, start: number): number | undefined {
  for (let cursor = start + 1; cursor < source.length; cursor++) {
    const character = source[cursor]
    if (character === '}') return cursor + 1
    if (character === '{') return undefined
  }
  return undefined
}

function preprocessBraces(braces: string, expression: string): string {
  const trimmed = expression.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) return braces
  if (isJavaScriptExpression(expression)) return braces
  const unwrapped = trimmed.startsWith('`') && trimmed.endsWith('`') ? trimmed.slice(1, -1).trim() : trimmed
  return `{${JSON.stringify(unwrapped)}}`
}

export function replaceLiquidPipes(source: string): string {
  let output = ''
  let cursor = 0
  let blockCommentClosable = true
  const unterminatedStrings = new Set<string>()
  while (cursor < source.length) {
    const character = source[cursor]
    if ((character === '"' || character === "'" || character === '`') && !unterminatedStrings.has(character)) {
      const end = stringSpanEnd(source, cursor)
      if (end !== undefined) {
        output += source.slice(cursor, end)
        cursor = end
        continue
      }
      unterminatedStrings.add(character)
    }
    if (blockCommentClosable && source.startsWith('/*', cursor)) {
      const closing = source.indexOf('*/', cursor + 2)
      if (closing >= 0) {
        output += source.slice(cursor, closing + 2)
        cursor = closing + 2
        continue
      }
      blockCommentClosable = false
    }
    if (source.startsWith('//', cursor)) {
      let end = cursor + 2
      while (end < source.length && source[end] !== '\n' && source[end] !== '\r') end++
      output += source.slice(cursor, end)
      cursor = end
      continue
    }
    if (character === '{') {
      const end = braceSpanEnd(source, cursor)
      if (end !== undefined) {
        const expression = source.slice(cursor + 1, end - 1)
        output += hasLiquidPipe(expression) ? preprocessBraces(source.slice(cursor, end), expression) : source.slice(cursor, end)
        cursor = end
        continue
      }
    }
    output += character
    cursor++
  }
  return output
}
