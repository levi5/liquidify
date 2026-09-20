import { parse } from '@babel/parser'
import type { File } from '@babel/types'

export class ASTParser {
  public parse(source: string): File {
    return parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    })
  }
}
