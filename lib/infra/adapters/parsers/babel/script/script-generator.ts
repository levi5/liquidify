import generate from '@babel/generator'
import { isExpressionStatement, isStringLiteral, type Statement } from '@babel/types'
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

    try {
      const result = this.compiler.transpileSync(code, { loader: 'ts', format: 'esm', minify: false })
      const cleanCode = result.code.replace(/['"]use dom(:global)?['"];?\n?/, '')

      if (componentName) {
        const kebabName = pascalToKebab(componentName)
        const topLevelIds: string[] = []

        for (const stmt of filteredStatements) {
          if (stmt.type === 'VariableDeclaration') {
            for (const decl of stmt.declarations) {
              if (decl.id.type === 'Identifier') {
                topLevelIds.push(decl.id.name)
              }
            }
          } else if (stmt.type === 'FunctionDeclaration' && stmt.id) {
            topLevelIds.push(stmt.id.name)
          }
        }

        const exportLines = topLevelIds.map((id) => `  scope.${id} = ${id};`).join('\n')

        return `"use strict";\n(function() {\n  window.liquidify = window.liquidify || window.liquidx || {};\n  window.liquidx = window.liquidify;\n  window.liquidify['${kebabName}'] = {};\n  const scope = window.liquidify['${kebabName}'];\n${cleanCode.replace(/export\s+const\s+(\w+)/g, 'scope.$1')}\n${exportLines}\n})();`
      }

      return `"use strict";\n(function() {\n${cleanCode}\n})();`
    } catch (_e) {
      const cleanCode = code.replace(/['"]use (dom(:global)?|script)['"];?\n?/, '')
      return `"use strict";\n(function() {\n${cleanCode}\n})();`
    }
  }
}
