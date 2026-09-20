import { _try } from 'funcio'
import { LiquidifyError } from '../../../../core/errors/liquidify-error'
import { parse } from '@babel/parser'
import type { File } from '@babel/types'

export class ASTParser {
  public parse(source: string, filePath?: string): File {
    const result = _try.sync(() =>
      parse(source, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      }),
    )

    return result.match({
      left: (error) => {
        throw new LiquidifyError(`Failed to parse JavaScript/TypeScript: ${error.message}`, filePath)
      },
      right: (ast) => ast,
    })
  }
}
