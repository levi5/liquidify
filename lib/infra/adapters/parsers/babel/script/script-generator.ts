import generate from '@babel/generator'
import { _match, _try } from 'funcio'
import {
  isExpressionStatement,
  isIdentifier,
  isStringLiteral,
  type Statement,
  type VariableDeclaration,
  type VariableDeclarator,
} from '@babel/types'
import { pascalToKebab } from '../../../../../shared/string'

import type { Compiler } from '../../../../../core/protocols/compiler'

export class ScriptGenerator {
  constructor(private readonly compiler: Compiler) {}

  public generate(statements: Statement[], componentName?: string): string {
    const filteredStatements = statements.filter(
      (statement) =>
        !(
          isExpressionStatement(statement) &&
          isStringLiteral(statement.expression) &&
          statement.expression.value.match(/^use (dom(:global)?|script)$/)
        ),
    )
    const code = filteredStatements.map((stmt) => generate(stmt).code).join('\n')
    return _try
      .sync(() => this.transpile(code, filteredStatements, componentName))
      .match({
        right: (script) => script,
        left: () => this.fallback(code),
      })
  }

  private transpile(code: string, filteredStatements: Statement[], componentName?: string): string {
    const result = this.compiler.transpileSync(code, { loader: 'ts', format: 'esm', minify: false })
    const cleanCode = result.code.replace(/['"]use dom(:global)?['"];?\n?/, '')
    return _match(componentName === undefined)
      .with(true, () => `"use strict";\n(function() {\n${cleanCode}\n})();`)
      .with(false, () => this.wrapScoped(cleanCode, filteredStatements, componentName as string))
      .exec() as string
  }

  private wrapScoped(cleanCode: string, filteredStatements: Statement[], componentName: string): string {
    const kebabName = pascalToKebab(componentName)
    const exportLines = filteredStatements
      .flatMap((stmt) => this.exportedIds(stmt))
      .map((id) => `  scope.${id} = ${id};`)
      .join('\n')
    return `"use strict";\n(function() {\n  window.liquidify = window.liquidify || window.liquidx || {};\n  window.liquidx = window.liquidify;\n  window.liquidify['${kebabName}'] = {};\n  const scope = window.liquidify['${kebabName}'];\n${cleanCode.replace(/export\s+const\s+(\w+)/g, 'scope.$1')}\n${exportLines}\n})();`
  }

  private exportedIds(stmt: Statement): string[] {
    return _match(true)
      .with(stmt.type === 'VariableDeclaration', () =>
        (stmt as VariableDeclaration).declarations.flatMap((decl) => this.declaratorId(decl)),
      )
      .with(stmt.type === 'FunctionDeclaration' && (stmt as { id?: unknown }).id != null, () => [
        (stmt as { id: { name: string } }).id.name,
      ])
      .with(true, () => [] as string[])
      .exec() as string[]
  }

  private declaratorId(decl: VariableDeclarator): string[] {
    return _match(isIdentifier(decl.id))
      .with(true, () => [(decl.id as { name: string }).name])
      .with(false, () => [] as string[])
      .exec() as string[]
  }

  private fallback(code: string): string {
    const cleanCode = code.replace(/['"]use (dom(:global)?|script)['"];?\n?/, '')
    return `"use strict";\n(function() {\n${cleanCode}\n})();`
  }
}
