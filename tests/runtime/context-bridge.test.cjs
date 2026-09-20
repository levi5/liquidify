const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const { buildRuntimeScript, createComponentCompiler } = require('../helpers/runtime-harness.cjs')

test('context bridge reports initialization failures before executing components', async () => {
  const window = {}
  const errors = []
  const context = vm.createContext({ window, console: { error: (...args) => errors.push(args) } })

  vm.runInContext(await buildRuntimeScript(), context)
  Object.defineProperty(window.React, 'createContext', {
    get() {
      throw new Error('broken context')
    },
  })

  const result = await createComponentCompiler().compile({ name: 'Counter' }, 'function Counter() { return null }')

  assert.throws(() => vm.runInContext(result.script, context), /broken context/)
  assert.match(errors[0][0], /Context bridge initialization failed.*same Liquidify version/)
})
