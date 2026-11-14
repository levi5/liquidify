import { parseExpression } from '@babel/parser'
import { _try } from 'funcio'

const LIQUID_STRING_OR_BRACES_PATTERN =
  /("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*)|(\{([^{}]*)\})/g
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

function preprocessBraces(braces: string, expression: string): string {
  const trimmed = expression.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) return braces
  if (isJavaScriptExpression(expression)) return braces
  const unwrapped = trimmed.startsWith('`') && trimmed.endsWith('`') ? trimmed.slice(1, -1).trim() : trimmed
  return `{${JSON.stringify(unwrapped)}}`
}

export function replaceLiquidPipes(source: string): string {
  return source.replace(LIQUID_STRING_OR_BRACES_PATTERN, (matched, literal: string | undefined, braces: string, expression: string) => {
    if (literal !== undefined || !hasLiquidPipe(expression)) return matched
    return preprocessBraces(braces, expression)
  })
}
