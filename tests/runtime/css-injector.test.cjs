const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const { CssInjector } = require('../../dist/infra/adapters/compilers/react/runtime/css-injector')

test('CSS values survive JavaScript serialization without executing embedded text', () => {
  const injector = new CssInjector()
  const css = 'a::before { content: "` ${window.bad = true} \\\\ </script>" }'
  const id = "css-'quoted"
  let received
  const window = {
    __react_css_inject__: (...args) => {
      received = args
    },
  }

  vm.runInNewContext(injector.buildCall(css, id), { window })

  assert.deepEqual(received, [css, id])
  assert.equal(window.bad, undefined)
})
