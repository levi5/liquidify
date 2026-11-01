import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ParsingContext } from '../dist/core/entities/parsing-context.js'
import { escapedOutput } from '../dist/shared/html.js'
import { makeParser } from './helpers.mjs'

describe('bugfix regressions', () => {
  it('for i<n emits inclusive-safe range with minus:1, <= keeps limit', async () => {
    const parser = makeParser()
    const lt = await parser.parse(
      `export default function A({ n }) {
        let total = 0;
        for (let i = 0; i < n; i++) { total += i; }
        return <div>{total}</div>
      }`,
      '/theme/src/components/sections/A.tsx',
    )
    assert.match(lt.html, /\(0\.\.\(n \| minus: 1\)\)/)

    const lte = await parser.parse(
      `export default function B({ n }) {
        let total = 0;
        for (let i = 0; i <= n; i++) { total += i; }
        return <div>{total}</div>
      }`,
      '/theme/src/components/sections/B.tsx',
    )
    assert.match(lte.html, /\(0\.\.n\)/)
    assert.doesNotMatch(lte.html, /minus: 1/)
  })

  it('derived contexts share sequence counter and assets', () => {
    const parent = new ParsingContext({})
    const a = parent.allocateName('logic')
    const child = ParsingContext.derive(parent, { outputContext: 'raw' })
    const b = child.allocateName('logic')
    assert.notEqual(a, b)
    child.addScriptAsset('x.js')
    assert.ok(parent.scriptAssets.has('x.js'))
  })

  it('escapedOutput requires a final HTML escape even after json', () => {
    assert.equal(escapedOutput('v | escape'), '{{ v | escape }}')
    assert.equal(escapedOutput('v | escape_once'), '{{ v | escape_once }}')
    assert.equal(escapedOutput('v | escape | upcase'), '{{ v | escape | upcase | escape }}')
    assert.equal(escapedOutput('v | json'), '{{ v | json | escape }}')
    assert.equal(escapedOutput('v'), '{{ v | escape }}')
  })

  it('object fallback in || still assigns', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `export default function C({ a }) {
        const x = a || { b: 1 };
        return <div>{x.b}</div>
      }`,
      '/theme/src/components/sections/C.tsx',
    )
    assert.match(component.html, /assign x =/)
  })

  it('array rest uses slice with minus length', async () => {
    const parser = makeParser()
    const component = await parser.parse(
      `export default function D({ items }) {
        const [first, ...rest] = items;
        return <div>{rest}</div>
      }`,
      '/theme/src/components/sections/D.tsx',
    )
    assert.match(component.html, /\| slice: 1, items\.size \| minus: 1/)
  })
})
