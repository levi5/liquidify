import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SchemaValidator } from '#dist/application/services/schema-validation.js'

const validator = new SchemaValidator()

test('range settings validate finite bounds, step alignment and defaults', () => {
  const range = { type: 'range', id: 'size', min: 0, max: 10, step: 0.5, default: 2.5 }
  validator.validate({ settings: [range] })
  for (const invalid of [{ min: 10 }, { max: 0 }, { default: 11 }, { step: 0 }, { step: 0.01 }, { default: 2.3 }, { min: Number.NaN }]) {
    assert.throws(() => validator.validate({ settings: [{ ...range, ...invalid }] }), /range/)
  }
})

test('select settings validate options, duplicates and default references', () => {
  const select = { type: 'select', id: 'size', options: [{ value: 'small', label: 'Small' }], default: 'small' }
  validator.validate({ settings: [select] })
  for (const invalid of [{ options: [] }, { default: 'large' }, { options: [select.options[0], select.options[0]] }]) {
    assert.throws(() => validator.validate({ settings: [{ ...select, ...invalid }] }), /options|option/)
  }
})

test('settings reject unknown types and invalid checkbox defaults', () => {
  assert.throws(() => validator.validate({ settings: [{ type: 'typo', id: 'title' }] }), /unsupported setting type/)
  assert.throws(() => validator.validate({ settings: [{ type: 'checkbox', id: 'enabled', default: 'false' }] }), /boolean/)
})

test('presets validate settings references, block references and limits', () => {
  const schema = { settings: [{ type: 'text', id: 'title' }], blocks: [{ type: 'slide', limit: 1 }], max_blocks: 2 }
  validator.validate({ ...schema, presets: [{ name: 'Hero', settings: { title: 'Hello' }, blocks: [{ type: 'slide' }] }] })
  for (const preset of [
    { name: 'Hero', settings: { missing: true } },
    { name: 'Hero', blocks: [{ type: 'missing' }] },
    { name: 'Hero', blocks: [{ type: 'slide' }, { type: 'slide' }] },
  ]) {
    assert.throws(() => validator.validate({ ...schema, presets: [preset] }), /unknown|limit/)
  }
  assert.throws(() => validator.validate({ max_blocks: 51 }), /max_blocks/)
})
