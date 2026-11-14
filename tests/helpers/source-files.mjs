import fs from 'node:fs'
import path from 'node:path'
import { glob } from 'glob'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'

export const internalAlias =
  /^(?:@(?:core|application|adapters|presentation|main|shared|liquidify-types|react-runtime|theme)\/|#(?:web|tests|dist)\/)/
export const assetExtension = /\.(?:css|json|svg|png|jpe?g|webp|gif|html|liquid)$/

export async function projectSources() {
  return glob(
    [
      'lib/**/*.{ts,tsx}',
      'resources/**/*.{ts,tsx,js,jsx}',
      'tests/**/*.{mjs,cjs,js,ts,tsx}',
      'web/src/**/*.{ts,tsx}',
      'web/*.ts',
      'scripts/*.mjs',
      'benchmarks/*.mjs',
    ],
    { ignore: ['**/node_modules/**', '**/dist/**'] },
  )
}

export function parseSource(filename) {
  const plugins = [...(/\.tsx?$/.test(filename) ? ['typescript'] : []), ...(!filename.endsWith('.ts') ? ['jsx'] : [])]
  return parse(fs.readFileSync(filename, 'utf8'), {
    sourceType: 'unambiguous',
    plugins,
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
  })
}

export function moduleSpecifiers(ast) {
  const specifiers = []
  const collect = (node) => {
    if (node?.type === 'StringLiteral') specifiers.push(node.value)
  }
  traverse.default(ast, {
    ImportDeclaration: (currentPath) => collect(currentPath.node.source),
    ExportNamedDeclaration: (currentPath) => collect(currentPath.node.source),
    ExportAllDeclaration: (currentPath) => collect(currentPath.node.source),
    TSImportType: (currentPath) => collect(currentPath.node.argument),
    CallExpression(currentPath) {
      const { callee, arguments: parameters } = currentPath.node
      if (callee.type === 'Import' || (callee.type === 'Identifier' && callee.name === 'require')) collect(parameters[0])
    },
  })
  return specifiers
}

export function executableArtifact(filename) {
  return path.extname(filename) === '.js' || filename.endsWith('.d.ts')
}
