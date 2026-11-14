import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sourceCodeFrame } from '../dist/shared/source-code-frame.js'

test('code frames include adjacent lines and a bounded caret', () => {
  const frame = sourceCodeFrame('first\nbroken\nlast', { line: 2, column: 3 })
  assert.match(frame, /> 2 \| broken/)
  assert.match(frame, /  1 \| first/)
  assert.match(frame, /  3 \| last/)
  assert.equal(sourceCodeFrame('source', { line: 4, column: 1 }), undefined)
  assert.ok(sourceCodeFrame('x'.repeat(10000), { line: 1, column: 9000 }).length < 400)
})
