import { parse } from '@babel/parser'
import { File } from '@babel/types'
import { _try } from 'funcio/lib/Monads/Either'
import { LiquidifyError } from '../../../../core/errors/liquidify-error'

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
