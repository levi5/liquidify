import { _try } from 'funcio'
import { parse } from '@babel/parser'
import type { File } from '@babel/types'
import { LiquidifyError } from '@core/errors/liquidify-error'
import { preprocessLiquidDelimiters } from '@adapters/parsers/babel/preprocessing'
import { replaceLiquidPipes } from '@adapters/parsers/babel/preprocessing/replace-liquid-pipes'

export { preprocessLiquidDelimiters, preprocessLiquidExpressions } from '@adapters/parsers/babel/preprocessing'

export class ASTParser {
  parse(source: string, filePath?: string): File {
    const delimited = preprocessLiquidDelimiters(source)
    return _try
      .sync(() => parse(delimited, { sourceType: 'module', plugins: ['jsx', 'typescript'] }))
      .match({
        right: (ast) => ast,
        left: () => this.parsePreprocessed(delimited, filePath),
      })
  }

  private parsePreprocessed(source: string, filePath?: string): File {
    return _try
      .sync(() => parse(replaceLiquidPipes(source), { sourceType: 'module', plugins: ['jsx', 'typescript'] }))
      .match({
        right: (ast) => ast,
        left: (error) => {
          throw new LiquidifyError(`Failed to parse JavaScript/TypeScript: ${error.message}`, filePath, this.errorLocation(error))
        },
      })
  }

  private errorLocation(error: unknown): { line: number; column: number } | undefined {
    const location = (error as { loc?: { line: number; column: number } }).loc
    if (!location) return undefined
    return { line: location.line, column: location.column + 1 }
  }
}
