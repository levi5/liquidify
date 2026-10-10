import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { preprocessLiquidDelimiters, preprocessLiquidExpressions } from '../dist/infra/adapters/parsers/babel/ASTParser.js'
import { makeParser } from './helpers.mjs'

const compile = async (body, directive = "'use snippets'") => {
  const parser = makeParser()
  const component = await parser.parse(
    `${directive}\nexport default function Sample(props) {\n  return (${body})\n}`,
    '/theme/src/components/snippets/Sample.tsx',
  )
  return component.html
}

describe('Liquid delimiters in JSX text', () => {
  it('emits assign tags verbatim, with and without filters', async () => {
    assert.equal(await compile('<p>{% assign y = x %}hi</p>'), '<p>{% assign y = x %}hi</p>')
    assert.equal(await compile('<p>{% assign y = x | default: 1 %}hi</p>'), '<p>{% assign y = x | default: 1 %}hi</p>')
  })

  it('emits output tags verbatim, with and without filters', async () => {
    assert.equal(await compile('<p>{{ x }}</p>'), '<p>{{ x }}</p>')
    assert.equal(await compile("<p>{{ x | default: 'y' }}</p>"), "<p>{{ x | default: 'y' }}</p>")
  })

  it('emits control flow tags verbatim', async () => {
    assert.equal(await compile('<p>{% if x %}a{% else %}b{% endif %}</p>'), '<p>{% if x %}a{% else %}b{% endif %}</p>')
    assert.equal(
      await compile('<ul>{% for i in items %}<li>{{ i.title }}</li>{% endfor %}</ul>'),
      '<ul>{% for i in items %}<li>{{ i.title }}</li>{% endfor %}</ul>',
    )
  })

  it('emits capture and case tags verbatim', async () => {
    assert.equal(await compile('<div>{% capture t %}x{% endcapture %}{{ t }}</div>'), '<div>{% capture t %}x{% endcapture %}{{ t }}</div>')
    assert.equal(
      await compile('<div>{% case x %}{% when 1 %}one{% endcase %}</div>'),
      '<div>{% case x %}{% when 1 %}one{% endcase %}</div>',
    )
  })

  it('leaves plain JSX and interpolation untouched', async () => {
    assert.equal(await compile('<h1>{title}</h1>'), '<h1>{{ title | escape }}</h1>')
    assert.equal(await compile('<p>50% off</p>'), '<p>50% off</p>')
  })

  it('does not rewrite Liquid that already sits inside a string literal', async () => {
    assert.equal(await compile("<p>{'{% assign y = x %}'}hi</p>"), '<p>{% assign y = x %}hi</p>')
  })

  it('does not rewrite an unknown tag name, so typos still surface as JS errors', async () => {
    await assert.rejects(() => compile('<p>{% notarealtag x %}hi</p>'), /Failed to parse JavaScript\/TypeScript/)
  })
})

describe('preprocessLiquidDelimiters', () => {
  it('wraps tags and outputs as string literals and keeps delimiters intact', () => {
    assert.equal(preprocessLiquidDelimiters('return <p>{% assign y = x %}hi</p>'), 'return <p>{"{% assign y = x %}"}hi</p>')
    assert.equal(preprocessLiquidDelimiters('return <p>{{ x }}</p>'), 'return <p>{"{{ x }}"}</p>')
  })

  it('leaves quoted and commented Liquid alone', () => {
    assert.equal(preprocessLiquidDelimiters('const a = "{% assign y = x %}"'), 'const a = "{% assign y = x %}"')
    assert.equal(preprocessLiquidDelimiters('const a = `{{ x }}`'), 'const a = `{{ x }}`')
    assert.equal(preprocessLiquidDelimiters('// {% assign y = x %}'), '// {% assign y = x %}')
    assert.equal(preprocessLiquidDelimiters('/* {% assign y = x %} */'), '/* {% assign y = x %} */')
  })

  it('leaves JSX expressions and object literals alone', () => {
    assert.equal(
      preprocessLiquidDelimiters('return <div className={styles.a}>{title}</div>'),
      'return <div className={styles.a}>{title}</div>',
    )
    assert.equal(preprocessLiquidDelimiters('const o = { a: 1 }'), 'const o = { a: 1 }')
    assert.equal(preprocessLiquidDelimiters('const n = 50 % 3'), 'const n = 50 % 3')
  })
})

describe('preprocessLiquidExpressions', () => {
  it('also applies the pipe rewrite for expressions that only parse after it', () => {
    assert.equal(preprocessLiquidExpressions('return <p>{{ x | default: 1 }}</p>'), 'return <p>{"{{ x | default: 1 }}"}</p>')
  })

  it('keeps a valid JS expression container untouched', () => {
    assert.equal(preprocessLiquidExpressions('return <div className={a.b} />'), 'return <div className={a.b} />')
  })
})
