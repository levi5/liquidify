import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parse, parseExpression } from '@babel/parser'
import { LiquidAttributeConverter } from '../dist/infra/adapters/parsers/babel/liquid/attribute-parser.js'
import { ExpressionParser } from '../dist/infra/adapters/parsers/babel/liquid/expression-parser.js'
import { LiquidVariableParser } from '../dist/infra/adapters/parsers/babel/liquid/variable-parser.js'
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

test('Liquid event attributes keep JS logical operators executable', () => {
  const converter = new LiquidAttributeConverter(expressions())
  const element = parseExpression(
    `<button onClick={() => (window.emit || window.fallback)?.('message::menu-mobile', true)} />`,
    { plugins: ['jsx'] },
  )
  const result = converter.getAttributes(element.openingElement.attributes)
  assert.doesNotMatch(result, /\{\{\s*or\s*\|/)
  assert.match(result, /\|\|/)
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

test('LiquidVariableParser parses variable declarations, destructuring, and fallbacks', () => {
  const ast = parse(
    'const { a, b: { c } } = props; const x = cond ? 1 : 2; const y = name || "default"; const z = opt ?? "nil_fallback";',
    { plugins: ['jsx', 'typescript'] },
  )
  const variableParser = new LiquidVariableParser((node) => {
    if (node.type === 'Identifier') return node.name
    if (node.type === 'StringLiteral') return `"${node.value}"`
    if (node.type === 'NumericLiteral') return String(node.value)
    return 'val'
  })
  const decls = ast.program.body.flatMap((stmt) => variableParser.parseVariableDeclaration(stmt.declarations[0]))
  assert.deepEqual(decls, [
    '{% assign a = props.a %}',
    '{% assign c = props.b.c %}',
    '{% if cond %}',
    '  {% assign x = 1 %}',
    '{% else %}',
    '  {% assign x = 2 %}',
    '{% endif %}',
    '{% assign y = name %}',
    '{% if y == nil or y == "" or y == false or y == 0 %}',
    '  {% assign y = "default" %}',
    '{% endif %}',
    '{% assign z = opt %}',
    '{% if z == nil %}',
    '  {% assign z = "nil_fallback" %}',
    '{% endif %}',
  ])
})

test('LiquidVariableParser parses if statement assignments and map calls', () => {
  const ast = parse('if (available) { count = 1; items.map(i => i); } else { count += 2; }', { plugins: ['jsx', 'typescript'] })
  const variableParser = new LiquidVariableParser((node) => {
    if (node.type === 'Identifier') return node.name
    if (node.type === 'NumericLiteral') return String(node.value)
    return 'expr'
  })
  variableParser.parseExpression = () => '{% for item in items %}{% endfor %}'

  const lines = variableParser.parseIfStatement(ast.program.body[0])
  assert.deepEqual(lines, [
    '{% if available %}',
    '  {% assign count = 1 %}',
    '  {% for item in items %}{% endfor %}',
    '{% else %}',
    '  {% assign count = count | append: 2 %}',
    '{% endif %}',
  ])
})

test('page title default escape stays as liquid output', () => {
  const parser = expressions()
  assert.equal(
    parser.parseExpression(parseExpression('\'page.title | default: "Vamos conversar." | escape\'')),
    '{{ page.title | default: "Vamos conversar." | escape }}',
  )
  assert.equal(
    parser.parseExpression(parseExpression('`page.title | default: "Vamos conversar." | escape`')),
    '{{ page.title | default: "Vamos conversar." | escape }}',
  )
  assert.equal(
    parser.parseExpression(parseExpression('"{{ page.title | default: \\"Vamos conversar.\\" | escape }}"')),
    '{{ page.title | default: "Vamos conversar." | escape }}',
  )
  assert.equal(parser.parseExpression(parseExpression('"Plain Text"')), 'Plain Text')
})

test('expression parser rewrites dynamic classNames calls to append filters', () => {
  const parser = expressions()
  const result = parser.generateLiquidCode(parseExpression('classNames(styles.base, dynamicClass)'), false)
  assert.equal(result, 'styles.base | append: " " | append: dynamicClass')
})
