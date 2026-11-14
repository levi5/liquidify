import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateSchemaTypes, makeLiquidifyBuilder, SilentLogger } from '#dist/index.js'
import { resolveBuildLimits } from '#dist/core/entities/build-limits.js'
import { ImportGraphBuilder } from '#dist/application/services/dependency-tracker.js'
import { ASTParser } from '#dist/infra/adapters/parsers/babel/ASTParser.js'
import { EsbuildCompiler } from '#dist/infra/adapters/compilers/esbuild/esbuild-compiler.js'

test('schema type generation preserves literal choices and quoted setting IDs', () => {
  const output = generateSchemaTypes({
    settings: [
      { type: 'checkbox', id: 'is-enabled' },
      { type: 'select', id: 'size', options: [{ value: 'small', label: 'Small' }] },
    ],
    blocks: [{ type: 'slide', settings: [{ type: 'product', id: 'product' }] }],
  })
  assert.match(output, /"is-enabled": boolean/)
  assert.match(output, /"size": "small"/)
  assert.match(output, /type: "slide"/)
  assert.match(output, /"product": Product \| null/)
})

test('build limits reject invalid values and excessive dependency depth', () => {
  for (const limits of [{ maxFiles: 0 }, { maxDependencies: -1 }, { unknown: 10 }]) assert.throws(() => resolveBuildLimits(limits))
  const graph = new ImportGraphBuilder(
    { existsSync: () => true, readFileSync: () => 'import value from "./next"' },
    { configFiles: () => [], resolve: (_specifier, importer) => `${importer.replace('.ts', '')}Next.ts`, candidates: () => [] },
    new ASTParser(),
    resolveBuildLimits({ maxDependencyDepth: 3 }),
  )
  assert.throws(() => graph.build(['/entry.ts'], new Set()), /configured build limits/)
})

test('programmatic concurrency validates before constructing the builder', () => {
  assert.throws(
    () => makeLiquidifyBuilder({ componentsDir: '/unused', output: '/unused', concurrency: 0 }, { logger: new SilentLogger() }),
    /concurrency/,
  )
})

test('development bundles support inline sourcemaps without writing files', async () => {
  const compiler = new EsbuildCompiler({ mode: 'development', sourcemap: true })
  const result = await compiler.build({ stdin: { contents: 'console.log("development")', loader: 'js' }, write: false, bundle: true })
  assert.match(result.outputFiles[0].text, /sourceMappingURL=data:application\/json/)
  assert.match(result.outputFiles[0].text, /console.log/)
})
