export function quotedSpanEnd(source: string, start: number): number {
  const quote = source[start]
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
    if (character === quote) return cursor + 1
  }
  return source.length
}

export function commentSpanEnd(source: string, start: number): number | undefined {
  if (source.startsWith('//', start)) {
    const newline = source.slice(start).search(/[\r\n]/)
    return newline < 0 ? source.length : start + newline
  }
  if (!source.startsWith('/*', start)) return undefined
  const closing = source.indexOf('*/', start + 2)
  return closing < 0 ? source.length : closing + 2
}

export function isQuote(character: string): boolean {
  return character === '"' || character === "'" || character === '`'
}
