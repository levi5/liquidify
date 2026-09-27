import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseExpression } from '@babel/parser'
import { ExpressionParser } from '../dist/infra/adapters/parsers/babel/liquid/expression-parser.js'
import { EsbuildCompiler } from '../dist/infra/adapters/compilers/esbuild/esbuild-compiler.js'

function countingParser(counter) {
  const real = new EsbuildCompiler()
  const compiler = {
    transpileSync: (code, options) => {
      counter.calls += 1
      return real.transpileSync(code, options)
    },
    build: (options) => real.build(options),
  }
  return new ExpressionParser(compiler, { getCssModules: () => new Map() }, { isMapCallExpression: () => false })
}

const parse = (source) => parseExpression(source, { plugins: ['jsx', 'typescript'] })

describe('ExpressionParser transpile cache', () => {
  it('does not retranspile identical expressions', () => {
    const counter = { calls: 0 }
    const parser = countingParser(counter)
    const first = parser.generateLiquidCode(parse('a + b'))
    const afterFirst = counter.calls
    assert.ok(afterFirst > 0, 'expected at least one transpile')
    const second = parser.generateLiquidCode(parse('a + b'))
    assert.equal(first, second)
    assert.equal(counter.calls, afterFirst)
    assert.ok(parser.transpileCacheSize > 0)
  })

  it('transpiles distinct expressions independently', () => {
    const counter = { calls: 0 }
    const parser = countingParser(counter)
    const first = parser.generateLiquidCode(parse('a + b'))
    const afterFirst = counter.calls
    const second = parser.generateLiquidCode(parse('c - d'))
    assert.notEqual(first, second)
    assert.ok(counter.calls > afterFirst, 'distinct expression should trigger new transpiles')
  })

  it('clears the cache on demand', () => {
    const counter = { calls: 0 }
    const parser = countingParser(counter)
    parser.generateLiquidCode(parse('a + b'))
    const afterFirst = counter.calls
    assert.ok(parser.transpileCacheSize > 0)
    parser.clearTranspileCache()
    assert.equal(parser.transpileCacheSize, 0)
    parser.generateLiquidCode(parse('a + b'))
    assert.equal(counter.calls, afterFirst * 2)
  })
})
