import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseExpression } from '@babel/parser'
import { ExpressionParser } from '../dist/infra/adapters/parsers/babel/liquid/expression-parser.js'
import { EsbuildCompiler } from '../dist/infra/adapters/compilers/esbuild/esbuild-compiler.js'
import { ParsingContext } from '../dist/core/entities/parsing-context.js'
import { ComponentRegistry, DirectiveScanner } from '../dist/application/services/component-registry.js'
import { ASTParser } from '../dist/infra/adapters/parsers/babel/ASTParser.js'

const scanner = () => new DirectiveScanner(new ASTParser())
const detectDirectives = (source) => scanner().scan(source)

const expressions = () =>
  new ExpressionParser(new EsbuildCompiler(), { getCssModules: () => new Map() }, { isMapCallExpression: () => false })

test('expression normalization preserves punctuation, operators and escapes inside strings', () => {
  for (const value of ['Ready?', 'a && b || c === d', 'x?.y.includes(z)', 'say "Hi?"', "it's fine?"]) {
    const code = expressions().generateLiquidCode(parseExpression(JSON.stringify(value)))
    assert.equal(JSON.parse(code), value)
  }
})

test('arithmetic preserves the precedence of nested operands and renames', () => {
  const context = new ParsingContext()
  const parser = expressions()
  assert.equal(
    parser.generateLiquidCode(parseExpression('a + b * c'), false, { b: 'product.price' }, context),
    'a | plus: __liquidify_arithmetic_0',
  )
  assert.equal(context.getPendingAssigns(), '{% assign __liquidify_arithmetic_0 = product.price | times: c %}\n')
  assert.equal(parser.generateLiquidCode(parseExpression('(a + b) * c'), false, undefined, context), 'a | plus: b | times: c')
})

test('unsupported find predicates report location and a useful diagnostic', () => {
  for (const source of ['items.find(predicate)', 'items.find()', 'items.find(item => { const x = 1; return x; })']) {
    assert.throws(
      () =>
        expressions().generateLiquidCode(
          parseExpression(source),
          false,
          undefined,
          new ParsingContext({ currentFilePath: '/theme/Card.tsx' }),
        ),
      (error) => {
        assert.equal(error.name, 'ValidationError')
        assert.equal(error.filePath, '/theme/Card.tsx')
        assert.deepEqual(error.location, { line: 1, column: 1 })
        assert.match(error.message, /inline arrow predicate/)
        return true
      },
    )
  }
})

test('syntax errors include structured source locations', () => {
  assert.throws(
    () => new ASTParser().parse('\nconst =', '/theme/Bad.tsx'),
    (error) => {
      assert.equal(error.filePath, '/theme/Bad.tsx')
      assert.equal(error.location.line, 2)
      assert.ok(error.location.column > 0)
      return true
    },
  )
})

test('only real module directives classify components', () => {
  for (const source of ['// "use react"\nexport const a = 1', 'const text = "use react"', 'function helper() { "use react" }']) {
    assert.equal(detectDirectives(source).isReact, false)
  }
  assert.deepEqual(detectDirectives('// comment\n"use react (#root)";'), { isReact: true, isDom: false, isSnippet: false, rootId: 'root' })
})

test('registry rejects duplicate names and normalized script name collisions', async () => {
  for (const names of [
    ['Card', 'Card'],
    ['ProductCard', 'productCard'],
  ]) {
    let index = 0
    const registry = new ComponentRegistry(
      { parse: async () => ({ name: names[index++], mode: 'react' }) },
      { readFileSync: () => '"use react"' },
      scanner(),
    )
    await assert.rejects(registry.scan(['/a.tsx', '/b.tsx']), /name conflict/)
  }
})

test('mixed conditions produce nested Liquid conditions instead of boolean assign expressions', () => {
  const context = new ParsingContext()
  const result = expressions().generateLiquidCode(parseExpression('a && (b || c)'), true, undefined, context)
  assert.equal(result, '__liquidify_condition_0')
  const markup = context.getPendingAssigns()
  assert.match(markup, /{% if a %}{% if b %}/)
  assert.match(markup, /{% if c %}/)
  assert.doesNotMatch(markup, /assign [^%]*(?: and | or )/)
})

test('negated conditions never emit parentheses rejected by Shopify', () => {
  const single = expressions().generateLiquidCode(parseExpression('!current_tags'), true, undefined, new ParsingContext())
  assert.equal(single, 'current_tags == blank or current_tags == false')

  const orChain = expressions().generateLiquidCode(
    parseExpression('!blocks || blocks.size == 0'),
    true,
    undefined,
    new ParsingContext(),
  )
  assert.equal(orChain, 'blocks == blank or blocks == false or blocks.size == 0')
  assert.doesNotMatch(orChain, /[()]/)
})

test('negation mixed with && stabilizes via nested conditions instead of parentheses', () => {
  const context = new ParsingContext()
  const result = expressions().generateLiquidCode(parseExpression('!a && b'), true, undefined, context)
  assert.equal(result, '__liquidify_condition_0')
  const markup = context.getPendingAssigns()
  assert.doesNotMatch(markup, /[()]/)
  assert.doesNotMatch(markup, /{% if [^%]* and [^%]* or [^%]*%}/)
  assert.doesNotMatch(markup, /{% if [^%]* or [^%]* and [^%]*%}/)
})
