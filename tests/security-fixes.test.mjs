import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { toSafeFileName, assertSafeFileName, pascalToKebab } from '../dist/shared/string.js'
import { liquidAssign, sha256Hex } from '../dist/shared/liquid-helpers.js'
import { VOID_TAGS, COMPONENT_TYPES, OUTPUT_RESERVED } from '../dist/shared/liquid-constants.js'
import { makeParser } from './helpers.mjs'

describe('security fixes', () => {
  it('sanitizes traversal component names', () => {
    assert.equal(toSafeFileName('../../evil'), 'evil')
    assert.equal(toSafeFileName('MyComponent'), 'my-component')
    assert.throws(() => assertSafeFileName('../../evil'), /Unsafe/)
    assert.doesNotThrow(() => assertSafeFileName('my-component'))
  })

  it('does not execute object props via new Function', async () => {
    const parser = makeParser()
    parser.setReactRegistry(new Map([['MyIsland', { rootId: '', script: 'my-island.js', mode: 'react' }]]))
    const src = `"use snippets"; export default function A(){ return <div><MyIsland data={{ a: 1, b: [true, null] }} /></div> }`
    const out = await parser.parse(src, '/tmp/A.tsx')
    const json = out.html.match(/data-react-props>(.*?)<\/script>/s)?.[1]
    assert.ok(json, 'must exercise island prop serialization')
    assert.deepEqual(JSON.parse(json), { data: { a: 1, b: [true, null] } })
  })

  it('serializes dynamic Liquid props as script-safe JSON instead of evaluating them', async () => {
    const parser = makeParser()
    parser.setReactRegistry(new Map([['MyIsland', { rootId: '', script: 'my-island.js', mode: 'react' }]]))
    const src = `"use snippets"; export default function A(){ return <MyIsland data={product.title} /> }`
    const out = await parser.parse(src, '/tmp/B.tsx')
    assert.match(out.html, /"data": {{ product.title \| json \| replace: '<', '\\u003c' }}/)
  })

  it('liquid helpers build assigns', () => {
    assert.equal(liquidAssign('a', '1'), '{% assign a = 1 %}')
    assert.equal(sha256Hex('hello').length, 64)
  })

  it('shared constants dedupe void tags', () => {
    assert.ok(VOID_TAGS.has('img'))
    assert.ok(COMPONENT_TYPES.has('sections'))
    assert.ok(OUTPUT_RESERVED.has('assets/react-runtime.js'))
  })

  it('pascalToKebab still works', () => {
    assert.equal(pascalToKebab('MyComponent'), 'my-component')
  })
})
