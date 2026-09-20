const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const { buildRuntimeScript } = require('../helpers/runtime-harness.cjs')

test('registered actions can be replaced and unregistered', async () => {
  const window = {}

  vm.runInNewContext(await buildRuntimeScript(), { window })

  const callback = () => {}
  const unsubscribe = window.registerLiquidifyAction('test', callback)

  assert.equal(window.LiquidifyActions.get('test'), callback)

  const replacement = () => {}
  window.registerLiquidifyAction('test', replacement)
  unsubscribe()

  assert.equal(window.LiquidifyActions.get('test'), replacement)
})
