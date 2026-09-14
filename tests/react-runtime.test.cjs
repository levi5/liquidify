const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const esbuild = require('esbuild')
const { ReactRuntimeBuilder } = require('../dist/infra/adapters/compilers/react/runtime/runtime-builder')
const { ReactComponentCompiler } = require('../dist/infra/adapters/compilers/react/component-compiler')
const { CssInjector } = require('../dist/infra/adapters/compilers/react/runtime/css-injector')

test('CSS values survive JavaScript serialization without executing embedded text', () => {
  const injector = new CssInjector()
  const css = 'a::before { content: "` ${window.bad = true} \\\\ </script>" }'
  const id = "css-'quoted"
  let received
  const window = { __react_css_inject__: (...args) => { received = args } }
  vm.runInNewContext(injector.buildCall(css, id), { window })
  assert.deepEqual(received, [css, id])
  assert.equal(window.bad, undefined)
})

test('runtime provides root cleanup and compatible event aliases', async () => {
  const calls = []
  const compiler = { build: options => esbuild.build({ ...options, plugins: [{
    name: 'mock-preact', setup(build) {
      build.onResolve({ filter: /^preact\/compat$/ }, () => ({ path: 'preact', namespace: 'mock' }))
      build.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: 'export default {}; export function render(element, container) { window.record(element, container) }; export const hydrate = render; export function unmountComponentAtNode(container) { render(null, container) }' }))
    },
  }] }) }
  const script = await new ReactRuntimeBuilder(compiler).build()
  const window = { record: (...args) => calls.push(args) }
  vm.runInNewContext(script, { window })
  const container = {}
  const root = window.ReactDOM.createRoot(container)
  root.render('hello')
  root.unmount()
  assert.deepEqual(calls, [['hello', container], [null, container]])
  assert.equal(window.LiquidifyEvents, window.LiquidxEvents)
})

test('component templates bundle, preserve source tokens and register hydration before readiness', async () => {
  const compiler = new ReactComponentCompiler(esbuild, new CssInjector())
  const result = await compiler.compile({ name: 'Counter' }, 'function Counter() { return "__LIQUIDIFY_COMPONENT__" }')
  assert.equal(result.html, '<react-island component="Counter"></react-island>')
  assert.ok(result.script.includes('__LIQUIDIFY_COMPONENT__'))
  assert.ok(result.script.indexOf('window.LiquidifyHydrate.Counter =') < result.script.indexOf('document.dispatchEvent'))
  new vm.Script(result.script)
  const root = await compiler.compile({ name: 'Counter', reactRootId: 'a"<&' }, 'function Counter() { return null }')
  assert.equal(root.html, '<div id="a&quot;&lt;&amp;"></div>')
  await assert.rejects(() => compiler.compile({ name: "bad'name" }, ''), /Invalid React component name/)
})

test('runtime resolves its dependencies outside the consuming working directory', async () => {
  const cwd = process.cwd()
  try {
    process.chdir('/tmp')
    const script = await new ReactRuntimeBuilder(esbuild).build()
    new vm.Script(script)
  } finally {
    process.chdir(cwd)
  }
})

test('strict mode omits dynamic evaluation while legacy builds preserve it', async () => {
  const source = 'function Counter() { return null }'
  const legacy = await new ReactComponentCompiler(esbuild, new CssInjector(), { strictCsp: false }).compile({ name: 'Counter' }, source)
  const strict = await new ReactComponentCompiler(esbuild, new CssInjector()).compile({ name: 'Counter' }, source)
  assert.match(legacy.script, /new Function\(/)
  assert.doesNotMatch(strict.script, /new Function\(|\beval\(/)
  assert.match(strict.script, /registerLiquidifyAction/)
})

test('JSON diagnostics use Funcio, preserve fallback values and identify invalid data', async () => {
  const warnings = []
  const window = {}
  const script = await new ReactRuntimeBuilder(esbuild).build()
  vm.runInNewContext(script, { window, console: { warn: (...args) => warnings.push(args) } }, { contextCodeGeneration: { strings: false, wasm: false } })
  const node = { id: 'invalid-store' }
  const fallback = {}
  assert.equal(window.LiquidifyParseJSON('{broken', node, 'data-react-props', fallback), fallback)
  assert.match(warnings[0][0], /data-react-props.*json filter/)
  assert.equal(warnings[0][1], node)
  assert.equal(window.LiquidifyParseJSON('plain text', node, 'data-liquid-title', 'plain text', true), 'plain text')
  assert.equal(window.LiquidifyParseJSON('', node, 'data-liquid-title', '', true), '')
  assert.equal(warnings.length, 1)
  assert.equal(window.LiquidifyParseJSON('{"count":2}', node, 'data-react-props', {}).count, 2)
  const callback = () => {}
  const unsubscribe = window.registerLiquidifyAction('test', callback)
  assert.equal(window.LiquidifyActions.get('test'), callback)
  const replacement = () => {}
  window.registerLiquidifyAction('test', replacement)
  unsubscribe()
  assert.equal(window.LiquidifyActions.get('test'), replacement)
})

test('context bridge reports initialization failures before executing components', async () => {
  const window = {}
  const errors = []
  const context = vm.createContext({ window, console: { error: (...args) => errors.push(args) } })
  vm.runInContext(await new ReactRuntimeBuilder(esbuild).build(), context)
  Object.defineProperty(window.React, 'createContext', { get() { throw new Error('broken context') } })
  const result = await new ReactComponentCompiler(esbuild, new CssInjector()).compile({ name: 'Counter' }, 'function Counter() { return null }')
  assert.throws(() => vm.runInContext(result.script, context), /broken context/)
  assert.match(errors[0][0], /Context bridge initialization failed.*same Liquidify version/)
})

test('duplicate event subscriptions have independent cleanup and off removes all matching listeners', async () => {
  const listeners = new Map()
  const window = {
    addEventListener(event, handler) { if (!listeners.has(event)) listeners.set(event, new Set()); listeners.get(event).add(handler) },
    removeEventListener(event, handler) { listeners.get(event)?.delete(handler) },
    dispatchEvent(event) { for (const handler of listeners.get(event.type) || []) handler(event) },
  }
  const CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail } }
  vm.runInNewContext(await new ReactRuntimeBuilder(esbuild).build(), { window, CustomEvent })
  const values = []
  const callback = Object.freeze((value) => values.push(value))
  const bus = window.LiquidifyEvents
  const first = bus.on('cart', callback)
  const second = bus.on('cart', callback)
  const otherEvent = bus.on('product', callback)
  bus.emit('cart', 1)
  assert.deepEqual(values, [1, 1])
  first()
  first()
  bus.emit('cart', 2)
  assert.deepEqual(values, [1, 1, 2])
  bus.on('cart', callback)
  bus.off('cart', callback)
  bus.emit('cart', 3)
  assert.deepEqual(values, [1, 1, 2])
  bus.emit('product', 4)
  assert.deepEqual(values, [1, 1, 2, 4])
  const renewed = bus.on('cart', callback)
  second()
  bus.off('cart', callback)
  bus.emit('cart', 5)
  assert.deepEqual(values, [1, 1, 2, 4])
  renewed()
  otherEvent()
  assert.equal(listeners.get('cart').size, 0)
  assert.equal(listeners.get('product').size, 0)
})
