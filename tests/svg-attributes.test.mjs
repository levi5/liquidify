import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parse, parseExpression } from '@babel/parser'
import { LiquidAttributeConverter } from '../dist/infra/adapters/parsers/babel/liquid/attribute-parser.js'
import { ExpressionParser } from '../dist/infra/adapters/parsers/babel/liquid/expression-parser.js'
import { EsbuildCompiler } from '../dist/infra/adapters/compilers/esbuild/esbuild-compiler.js'
import { ParsingContext } from '../dist/core/entities/parsing-context.js'
import { makeParser } from './helpers.mjs'

function converter() {
  const compiler = new EsbuildCompiler()
  const parser = new ExpressionParser(compiler, { getCssModules: () => new Map() }, { isMapCallExpression: () => false })
  return new LiquidAttributeConverter(parser)
}

const attributesOf = (source, context) => {
  const element = parseExpression(source, { plugins: ['jsx'] })
  return converter().getAttributes(element.openingElement.attributes, undefined, context)
}

const compile = async (body, file = '/theme/src/components/snippets/Icon.tsx') => {
  const parser = makeParser()
  const component = await parser.parse(`'use snippets'\nexport default function Icon() {\n  return (${body})\n}`, file)
  return component.html
}

describe('SVG attribute naming', () => {
  it('converts camelCase presentation attributes to their hyphenated SVG names', () => {
    const svg = new ParsingContext({ inSvg: true })
    for (const [jsx, svgName] of [
      ['strokeWidth', 'stroke-width'],
      ['strokeLinecap', 'stroke-linecap'],
      ['strokeLinejoin', 'stroke-linejoin'],
      ['strokeDasharray', 'stroke-dasharray'],
      ['strokeMiterlimit', 'stroke-miterlimit'],
      ['fillOpacity', 'fill-opacity'],
      ['fillRule', 'fill-rule'],
      ['stopColor', 'stop-color'],
      ['stopOpacity', 'stop-opacity'],
      ['clipPath', 'clip-path'],
      ['clipRule', 'clip-rule'],
      ['floodColor', 'flood-color'],
      ['fontFamily', 'font-family'],
      ['letterSpacing', 'letter-spacing'],
      ['dominantBaseline', 'dominant-baseline'],
      ['textAnchor', 'text-anchor'],
      ['textDecoration', 'text-decoration'],
      ['xlinkHref', 'xlink-href'],
      ['vectorEffect', 'vector-effect'],
      ['paintOrder', 'paint-order'],
    ]) {
      assert.equal(attributesOf(`<path ${jsx}="2" />`, svg), ` ${svgName}="2"`, jsx)
    }
  })

  it('preserves case-sensitive SVG attribute names verbatim', () => {
    const svg = new ParsingContext({ inSvg: true })
    for (const name of [
      'viewBox',
      'preserveAspectRatio',
      'baseFrequency',
      'pathLength',
      'gradientUnits',
      'gradientTransform',
      'patternUnits',
      'patternTransform',
      'clipPathUnits',
      'maskUnits',
      'markerUnits',
      'stdDeviation',
      'systemLanguage',
      'primitiveUnits',
      'spreadMethod',
      'refX',
      'refY',
      'keyPoints',
      'keyTimes',
      'keySplines',
      'calcMode',
      'repeatCount',
      'attributeName',
      'tableValues',
      'filterUnits',
      'startOffset',
      'textLength',
      'markerWidth',
      'markerHeight',
      'numOctaves',
      'pathLength',
    ]) {
      assert.equal(attributesOf(`<g ${name}="2" />`, svg), ` ${name}="2"`, name)
    }
  })

  it('leaves already hyphenated and lowercase SVG attributes untouched', () => {
    const svg = new ParsingContext({ inSvg: true })
    for (const name of ['d', 'cx', 'cy', 'r', 'fill', 'stroke-width', 'stroke-linecap', 'xmlns', 'viewbox']) {
      assert.equal(attributesOf(`<path ${name}="2" />`, svg), ` ${name}="2"`, name)
    }
  })

  it('does not touch HTML attributes outside an svg subtree', () => {
    const html = new ParsingContext()
    assert.equal(attributesOf('<div strokeWidth="2" viewBox="0 0 1 1" />', html), ' strokewidth="2" viewbox="0 0 1 1"')
  })

  it('keeps the React special cases inside an svg subtree', () => {
    const svg = new ParsingContext({ inSvg: true })
    assert.equal(attributesOf('<g className="icon" htmlFor="x" key="k" />', svg), ' class="icon" for="x"')
  })

  it('keeps data- and aria- attributes verbatim inside an svg subtree', () => {
    const svg = new ParsingContext({ inSvg: true })
    assert.equal(
      attributesOf('<g data-icon="y" aria-label="z" aria-hidden="true" />', svg),
      ' data-icon="y" aria-label="z" aria-hidden="true"',
    )
  })
})

describe('SVG markup end to end', () => {
  it('renders camelCase attributes on nested svg descendants', async () => {
    const html = await compile('<svg viewBox="0 0 24 24"><path d="M0 0" strokeWidth="2" strokeLinecap="round" /></svg>')

    assert.match(html, /<svg viewBox="0 0 24 24">/)
    assert.match(html, /<path d="M0 0" stroke-width="2"/)
    assert.match(html, /stroke-linecap="round"/)
    assert.doesNotMatch(html, /strokewidth|strokelinecap/)
  })

  it('applies SVG naming deeply nested inside groups and defs', async () => {
    const html = await compile(
      '<svg viewBox="0 0 10 10"><defs><linearGradient gradientUnits="userSpaceOnUse"><stop stopColor="#fff" stopOpacity="0" /></linearGradient></defs><g fillRule="evenodd"><use xlinkHref="#a" /></g></svg>',
    )

    assert.match(html, /gradientUnits="userSpaceOnUse"/)
    assert.match(html, /stop-color="#fff"/)
    assert.match(html, /stop-opacity="0"/)
    assert.match(html, /fill-rule="evenodd"/)
    assert.match(html, /xlink-href="#a"/)
  })

  it('leaves HTML after a closing svg tag in normal casing', async () => {
    const html = await compile('<div><svg viewBox="0 0 1 1"><path strokeWidth="2" /></svg><span viewBox="0 0 2 2" /></div>')

    assert.match(html, /<svg viewBox="0 0 1 1">/)
    assert.match(html, /<path stroke-width="2">/)
    assert.match(html, /<span viewbox="0 0 2 2">/)
  })

  it('derives the svg context from a nested svg element', async () => {
    const html = await compile('<div><section><svg><path strokeWidth="2" /></svg></section></div>')

    assert.match(html, /<path stroke-width="2">/)
  })

  it('applies SVG naming to camelCase attributes on the svg root itself', async () => {
    const html = await compile('<svg fillOpacity="0.5" preserveAspectRatio="xMidYMid" strokeWidth="2" />')

    assert.equal(html, '<svg fill-opacity="0.5" preserveAspectRatio="xMidYMid" stroke-width="2"></svg>')
  })

  it('does not leak svg naming into a sibling section', async () => {
    const html = await compile('<div><svg><path strokeWidth="2" /></svg><div fillOpacity="1" /></div>')

    assert.match(html, /<path stroke-width="2">/)
    assert.match(html, /<div fillopacity="1">/)
  })

  it('keeps CSS class names working inside an svg subtree', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `'use snippets'
import styles from './Icon.module.css'
export default function Icon() {
  return <svg className={styles.root} viewBox="0 0 1 1"><path strokeWidth="2" className={styles.line} /></svg>
}`,
      '/theme/src/components/snippets/Icon.tsx',
    )

    assert.match(component.html, /stroke-width="2"/)
  })
})

describe('ParsingContext svg flag', () => {
  it('defaults to false and survives derivation', () => {
    assert.equal(new ParsingContext().inSvg, false)

    const derived = ParsingContext.derive(new ParsingContext({ inSvg: true }), {})
    assert.equal(derived.inSvg, true)

    assert.equal(ParsingContext.derive(derived, { inSvg: false }).inSvg, false)
  })

  it('defaults derived contexts built without a parent to false', () => {
    assert.equal(ParsingContext.derive(undefined, { outputContext: 'raw' }).inSvg, false)
  })
})

describe('attribute name normalisation outside svg', () => {
  it('still lowercases plain html attribute names', () => {
    const element = parse('<div tabIndex="1" />', { plugins: ['jsx'] })
    const attributes = converter().getAttributes(element.program.body[0].expression.openingElement.attributes)
    assert.equal(attributes, ' tabindex="1"')
  })
})
