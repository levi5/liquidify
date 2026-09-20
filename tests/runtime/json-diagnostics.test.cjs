const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const { buildRuntimeScript } = require('../helpers/runtime-harness.cjs')

const runScript = async () => {
  const warnings = []
  const window = {}
  const script = await buildRuntimeScript()

  vm.runInNewContext(
    script,
    { window, console: { warn: (...args) => warnings.push(args) } },
    { contextCodeGeneration: { strings: false, wasm: false } },
  )

  return { warnings, window }
}

test('JSON diagnostics report invalid payloads and identify the source', async () => {
  const { warnings, window } = await runScript()
  const node = { id: 'invalid-store' }
  const fallback = {}

  assert.equal(window.LiquidifyParseJSON('{broken', node, 'data-react-props', fallback), fallback)
  assert.match(warnings[0][0], /data-react-props.*json filter/)
  assert.equal(warnings[0][1], node)
})

test('JSON parsing preserves fallback values for plain text', async () => {
  const { warnings, window } = await runScript()
  const node = { id: 'invalid-store' }

  assert.equal(window.LiquidifyParseJSON('plain text', node, 'data-liquid-title', 'plain text', true), 'plain text')
  assert.equal(window.LiquidifyParseJSON('', node, 'data-liquid-title', '', true), '')
  assert.equal(warnings.length, 0)
  assert.equal(window.LiquidifyParseJSON('{"count":2}', node, 'data-react-props', {}).count, 2)
})
