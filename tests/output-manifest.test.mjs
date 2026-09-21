import { test } from 'node:test'
import assert from 'node:assert/strict'
import { OutputManifest } from '../dist/infra/adapters/generators/liquid/output-manifest.js'
import { ValidationError } from '../dist/core/errors/validation-error.js'

const validEntry = { files: { 'snippets/card.liquid': 'a'.repeat(64) }, scripts: ['card.js'], css: '' }
const wrap = (entry) => ({ version: 1, entries: { '/src/Card.tsx': entry } })
const invalid = [
  ['invalid JSON', '{broken'],
  ['null manifest', 'null'],
  ['array manifest', '[]'],
  ['unsupported version', JSON.stringify({ version: 2, entries: {} })],
  ['array entries', JSON.stringify({ version: 1, entries: [] })],
  ...[
    ['null entry', null],
    ['array entry', []],
    ['missing fields', {}],
    ['null files', { ...validEntry, files: null }],
    ['array files', { ...validEntry, files: [] }],
    ['invalid hash', { ...validEntry, files: { 'snippets/card.liquid': 'bad' } }],
    ['non-string hash', { ...validEntry, files: { 'snippets/card.liquid': 123 } }],
    ['invalid scripts', { ...validEntry, scripts: 'card.js' }],
    ['non-string script', { ...validEntry, scripts: [null] }],
    ['invalid CSS', { ...validEntry, css: null }],
    ['unsafe output path', { ...validEntry, files: { '../outside.js': 'a'.repeat(64) } }],
  ].map(([name, entry]) => [name, JSON.stringify(wrap(entry))]),
]

for (const [name, content] of invalid) {
  test(`manifest rejects ${name} before touching generated files`, async () => {
    const calls = []
    const manifest = new OutputManifest('/out', {
      exists: async (file) => {
        calls.push(['exists', file])
        return true
      },
      readFile: async (file) => {
        calls.push(['read', file])
        return content
      },
      writeFile: async () => {
        assert.fail('must not write')
      },
      unlink: async () => {
        assert.fail('must not delete')
      },
    })
    await assert.rejects(manifest.begin([], new Set()), (error) => {
      assert.ok(error instanceof ValidationError)
      assert.equal(error.filePath, '/out/.liquidify-manifest.json')
      return true
    })
    assert.deepEqual(calls, [
      ['exists', '/out/.liquidify-manifest.json'],
      ['read', '/out/.liquidify-manifest.json'],
    ])
  })
}

test('valid persisted entries still mark missing outputs for regeneration', async () => {
  const manifest = new OutputManifest('/out', {
    exists: async (file) => file.endsWith('.liquidify-manifest.json'),
    readFile: async () => JSON.stringify(wrap(validEntry)),
  })
  const changed = new Set()
  await manifest.begin(['/src/Card.tsx'], changed)
  assert.deepEqual([...changed], ['/src/Card.tsx'])
})
