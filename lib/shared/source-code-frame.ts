export function sourceCodeFrame(source: string, location: { line: number; column: number }): string | undefined {
  const lines = source.split(/\r?\n/)
  const targetIndex = location.line - 1
  if (targetIndex < 0 || targetIndex >= lines.length || location.column < 1) return undefined
  const firstIndex = Math.max(0, targetIndex - 1)
  const finalIndex = Math.min(lines.length - 1, targetIndex + 1)
  const horizontalOffset = Math.max(0, location.column - 100)
  const prefix = horizontalOffset ? '…' : ''
  const width = String(finalIndex + 1).length
  const frame: string[] = []
  for (let lineIndex = firstIndex; lineIndex <= finalIndex; lineIndex++) {
    const selected = lineIndex === targetIndex
    frame.push(
      `${selected ? '>' : ' '} ${String(lineIndex + 1).padStart(width)} | ${prefix}${lines[lineIndex].slice(horizontalOffset, horizontalOffset + 200)}`,
    )
    if (selected) frame.push(`  ${' '.repeat(width)} | ${' '.repeat(Math.max(0, location.column - 1 - horizontalOffset) + prefix.length)}^`)
  }
  return frame.join('\n')
}
