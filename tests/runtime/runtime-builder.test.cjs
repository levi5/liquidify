const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const { buildRuntimeScript, mockPreactCompiler } = require('../helpers/runtime-harness.cjs')

test('runtime provides root cleanup and compatible event aliases', async () => {
  const calls = []
  const script = await buildRuntimeScript(mockPreactCompiler())
  const window = { record: (...args) => calls.push(args) }

  vm.runInNewContext(script, { window })

  const container = {}
  const root = window.ReactDOM.createRoot(container)
  root.render('hello')
  root.unmount()

  assert.deepEqual(calls, [
    ['hello', container],
    [null, container],
  ])
  assert.equal(window.LiquidifyEvents, window.LiquidxEvents)
})

test('runtime resolves its dependencies outside the consuming working directory', async () => {
  const cwd = process.cwd()

  try {
    process.chdir('/tmp')
    const script = await buildRuntimeScript()
    new vm.Script(script)
  } finally {
    process.chdir(cwd)
  }
})
