import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseExpression } from '@babel/parser'
import { LiquidAttributeConverter } from '../dist/infra/adapters/parsers/babel/liquid/attribute-parser.js'
import { ExpressionParser } from '../dist/infra/adapters/parsers/babel/liquid/expression-parser.js'
import { EsbuildCompiler } from '../dist/infra/adapters/compilers/esbuild/esbuild-compiler.js'
import { ParsingContext } from '../dist/core/entities/parsing-context.js'

function expressions() {
  return new ExpressionParser(new EsbuildCompiler(), { getCssModules: () => new Map() }, { isMapCallExpression: () => false })
}

test('template expressions preserve interpolation, filters and renames', () => {
  const parser = expressions()
  for (const [source, expected] of [
    ['`Hello`', '"Hello"'],
    ['`product.price | money`', 'product.price | money'],
    ['`Hello ${name}!`', '"Hello " | append: customer.name | append: "!"'],
    ['`${image} | image_url: width: 400, crop: center`', "image | image_url: width: 400, crop: 'center'"],
  ]) {
    assert.equal(parser.generateLiquidCode(parseExpression(source), false, { name: 'customer.name' }), expected)
  }
})

test('DOM event attributes preserve component binding and event parameter names', () => {
  const converter = new LiquidAttributeConverter(expressions())
  const element = parseExpression('<button onClick={(e) => submit(e)} />', { plugins: ['jsx'] })
  const result = converter.getAttributes(
    element.openingElement.attributes,
    undefined,
    new ParsingContext({
      mode: 'dom',
      componentName: 'ProductCard',
    }),
  )
  assert.equal(result, ` onclick="liquidify['product-card'].submit(event)"`)
})

test('Liquid event attributes interpolate values and escape quotes', () => {
  const converter = new LiquidAttributeConverter(expressions())
  const element = parseExpression('<button onClick={() => window.add(product.id, "cart")} />', { plugins: ['jsx'] })
  assert.equal(
    converter.getAttributes(element.openingElement.attributes),
    ' onclick="window.add({{ product.id | json | escape }}, &quot;cart&quot;)"',
  )
})

test('expression output retains null coalescing and HTML escaping', () => {
  const output = expressions().parseExpression(parseExpression('title ?? "Fallback"'))
  assert.equal(output, '{% if title != nil %}{{ title | escape }}{% else %}{{ "Fallback" | escape }}{% endif %}')
})

test('event references use constructor defaults and context overrides', () => {
  const converter = new LiquidAttributeConverter(expressions(), 'DefaultCard', 'dom')
  const element = parseExpression('<button onClick={submit} />', { plugins: ['jsx'] })
  const attributes = element.openingElement.attributes
  assert.equal(converter.getAttributes(attributes), ` onclick="liquidify['default-card'].submit(event)"`)
  assert.equal(
    converter.getAttributes(attributes, undefined, new ParsingContext({ mode: 'dom:global', componentName: 'Cart' })),
    ` onclick="liquidify['cart'].submit(event)"`,
  )
  assert.equal(converter.getAttributes(attributes, undefined, new ParsingContext({ mode: 'liquid' })), ' onclick="{{ submit | escape }}"')
})

test('block event handlers keep their body, rename the event and escape quotes', () => {
  const converter = new LiquidAttributeConverter(expressions(), 'Card', 'dom')
  const element = parseExpression('<button onClick={(e) => { window.alert("cart"); e.preventDefault() }} />', { plugins: ['jsx'] })
  const result = converter.getAttributes(element.openingElement.attributes)
  assert.match(result, /window.alert\(&quot;cart&quot;\)/)
  assert.match(result, /event.preventDefault\(\)/)
  assert.doesNotMatch(result, /liquidify\[/)
})

test('null coalescing uses the selected output context for both branches', () => {
  const parser = expressions()
  const node = parseExpression('title ?? fallback')
  assert.equal(
    parser.parseExpression(node, undefined, new ParsingContext({ outputContext: 'raw' })),
    '{% if title != nil %}{{ title }}{% else %}{{ fallback }}{% endif %}',
  )
  const json = parser.parseExpression(node, undefined, new ParsingContext({ outputContext: 'json' }))
  assert.match(json, /{{ title \| json \| replace:/)
  assert.match(json, /{{ fallback \| json \| replace:/)
})

test('null coalescing emits pending fallback assignments before using them', () => {
  const context = new ParsingContext()
  const output = expressions().parseExpression(parseExpression('title ?? products.find((item) => item.available)'), undefined, context)
  assert.ok(output.indexOf('{% for item in products %}') < output.indexOf('{% if title != nil %}'))
  assert.match(output, /{{ __liquidify_found_\d+ \| escape }}/)
  assert.equal(context.getPendingAssigns(), '')
})

test('string literal with liquid filter expression is wrapped in liquid output', () => {
  const parser = expressions()
  const output = parser.parseExpression(parseExpression('"settings.brand_name | default: shop.name | escape"'))
  assert.equal(output, '{{ settings.brand_name | default: shop.name | escape }}')

  const alreadyWrapped = parser.parseExpression(parseExpression('"{{ settings.brand_name | default: shop.name | escape }}"'))
  assert.equal(alreadyWrapped, '{{ settings.brand_name | default: shop.name | escape }}')

  const plainText = parser.parseExpression(parseExpression('"Plain Text"'))
  assert.equal(plainText, 'Plain Text')
})

