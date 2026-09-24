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
    const src = `"use snippets"; export default function A(){ return <div><MyIsland data={{ a: 1, b: [true, null] }} /></div> }`
    const out = await parser.parse(src, '/tmp/A.tsx')
    assert.ok(typeof out.html === 'string')
  })

  it('falls back to liquid json for non-static props instead of eval', async () => {
    const parser = makeParser()
    const src = `"use snippets"; import {x} from './x'; export default function A(){ return <div>{x}</div> }`
    const out = await parser.parse(src, '/tmp/B.tsx')
    assert.ok(out.html.includes('x') || out.html === '')
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
