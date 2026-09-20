import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { pascalToKebab, placeholder } from '../dist/shared/string.js'

describe('shared string helpers', () => {
  it('converts PascalCase to kebab-case', () => {
    assert.equal(pascalToKebab('ProductCard'), 'product-card')
    assert.equal(pascalToKebab('MainCollection'), 'main-collection')
    assert.equal(pascalToKebab('Hero'), 'hero')
  })

  it('replaces ${placeholders} with provided values', () => {
    assert.equal(placeholder('hi ${name}', { name: 'Ada' }), 'hi Ada')
  })

  it('keeps unknown placeholders untouched', () => {
    assert.equal(placeholder('hi ${name}', {}), 'hi ${name}')
  })
})
