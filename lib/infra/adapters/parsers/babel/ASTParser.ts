import { _match, _try } from 'funcio'
import { LiquidifyError } from '../../../../core/errors/liquidify-error'
import { parse, parseExpression } from '@babel/parser'
import type { File } from '@babel/types'

const LIQUID_PIPE_PATTERN =
  /("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*)|(\{([^{}]*?[^|&]\s*\|\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:[^{}]*?)\})/g

function isValidJsExpr(code: string): boolean {
  return _try
    .sync(() => parseExpression(code, { plugins: ['jsx', 'typescript'] }))
    .match({
      right: () => true,
      left: () => false,
    })
}

export function preprocessLiquidExpressions(source: string): string {
  return source.replace(
    LIQUID_PIPE_PATTERN,
    (_matched, strOrComment, fullBraces, inner) =>
      _match(strOrComment !== undefined)
        .with(true, () => strOrComment as string)
        .with(false, () => preprocessBraces(fullBraces as string, inner as string))
        .exec() as string,
  )
}

function preprocessBraces(fullBraces: string, inner: string): string {
  const trimmed = inner.trim()
  return _match(true)
    .with((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'")), () => fullBraces)
    .with(isValidJsExpr(inner), () => fullBraces)
    .with(true, () => `{${JSON.stringify(unwrapTemplate(trimmed))}}`)
    .exec() as string
}

function unwrapTemplate(trimmed: string): string {
  return _match(trimmed.startsWith('`') && trimmed.endsWith('`'))
    .with(true, () => trimmed.slice(1, -1).trim())
    .with(false, () => trimmed)
    .exec() as string
}

export class ASTParser {
  public parse(source: string, filePath?: string): File {
    return _try
      .sync(() =>
        parse(source, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
        }),
      )
      .match({
        right: (ast) => ast,
        left: () => this.parsePreprocessed(source, filePath),
      })
  }

  private parsePreprocessed(source: string, filePath?: string): File {
    return _try
      .sync(() =>
        parse(preprocessLiquidExpressions(source), {
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
        }),
      )
      .match({
        right: (ast) => ast,
        left: (error) => {
          throw new LiquidifyError(`Failed to parse JavaScript/TypeScript: ${error.message}`, filePath, this.errorLocation(error))
        },
      })
  }

  private errorLocation(error: unknown): { line: number; column: number } | undefined {
    const loc = (error as { loc?: { line: number; column: number } }).loc
    return _match(loc === undefined)
      .with(true, () => undefined)
      .with(false, () => ({ line: (loc as { line: number }).line, column: (loc as { column: number }).column + 1 }))
      .exec() as { line: number; column: number } | undefined
  }
}
