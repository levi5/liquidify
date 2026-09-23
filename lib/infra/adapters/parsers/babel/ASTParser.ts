import { _try } from 'funcio'
import { LiquidifyError } from '../../../../core/errors/liquidify-error'
import { parse, parseExpression } from '@babel/parser'
import type { File } from '@babel/types'

function isValidJsExpr(code: string): boolean {
  try {
    parseExpression(code, { plugins: ['jsx', 'typescript'] })
    return true
  } catch {
    return false
  }
}

export function preprocessLiquidExpressions(source: string): string {
  const pattern =
    /("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*)|(\{([^{}]*?[^|&]\s*\|\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:[^{}]*?)\})/g

  return source.replace(pattern, (_match, strOrComment, fullBraces, inner) => {
    if (strOrComment) return strOrComment
    const trimmed = inner.trim()
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return fullBraces
    }
    if (isValidJsExpr(inner)) {
      return fullBraces
    }
    let exprContent = trimmed
    if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
      exprContent = trimmed.slice(1, -1).trim()
    }
    return `{${JSON.stringify(exprContent)}}`
  })
}

export class ASTParser {
  public parse(source: string, filePath?: string): File {
    const directResult = _try.sync(() =>
      parse(source, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      }),
    )

    if (directResult.isRight()) {
      return directResult.match({
        right: (ast) => ast,
        left: (error) => {
          throw error
        },
      })
    }

    const preprocessed = preprocessLiquidExpressions(source)
    const result = _try.sync(() =>
      parse(preprocessed, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      }),
    )

    return result.match({
      left: (error) => {
        const loc = (error as Error & { loc?: { line: number; column: number } }).loc
        throw new LiquidifyError(
          `Failed to parse JavaScript/TypeScript: ${error.message}`,
          filePath,
          loc ? { line: loc.line, column: loc.column + 1 } : undefined,
        )
      },
      right: (ast) => ast,
    })
  }
}
