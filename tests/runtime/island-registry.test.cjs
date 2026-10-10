const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const { buildRuntimeScript } = require('../helpers/runtime-harness.cjs')

const island = (component, hydrated = false, parentIsIsland = false) => ({
  attributes: { component },
  hydrated,
  parentElement: parentIsIsland ? { closest: (selector) => (selector === 'react-island' ? {} : null) } : null,
})

const createDomWindow = (islands = []) => {
  const listeners = new Map()
  const queried = []
  const dispatched = []
  const record = (event) => dispatched.push(event.type)
  const CustomEvent = class {
    constructor(type, options = {}) {
      this.type = type
      this.detail = options.detail
    }
  }
  const on = (event, handler) => {
    if (!listeners.has(event)) listeners.set(event, new Set())
    listeners.get(event).add(handler)
  }
  const window = {
    addEventListener: on,
    removeEventListener(event, handler) {
      listeners.get(event)?.delete(handler)
    },
    dispatchEvent(event) {
      record(event)
      for (const handler of listeners.get(event.type) || []) handler(event)
    },
    setTimeout,
    clearTimeout,
  }
  const document = {
    addEventListener: on,
    removeEventListener(event, handler) {
      listeners.get(event)?.delete(handler)
    },
    dispatchEvent(event) {
      record(event)
      for (const handler of listeners.get(event.type) || []) handler(event)
    },
    querySelectorAll(selector) {
      queried.push(selector)
      const component = /component="([^"]*)"/.exec(selector)?.[1]
      const needsHydration = selector.includes(':not([data-react-hydrated])')
      return islands.filter((node) => node.attributes.component === component && (!needsHydration || !node.hydrated))
    },
  }
  return {
    window,
    document,
    dispatched,
    queried,
    context: { window, document, CustomEvent, CSS: { escape: String }, setTimeout, clearTimeout },
  }
}

const loadRuntime = async (islands) => {
  const dom = createDomWindow(islands)
  vm.runInNewContext(await buildRuntimeScript(), dom.context)
  return dom
}

test('registering an island stores it and announces readiness', async () => {
  const { window, dispatched } = await loadRuntime()

  const unregister = window.registerLiquidIsland('PriceTag', () => null)

  assert.equal(typeof window.LiquidifyComponents.PriceTag, 'function')
  assert.equal(window.LiquidxComponents.PriceTag, window.LiquidifyComponents.PriceTag)
  assert.ok(dispatched.includes('liquidify:ready:PriceTag'))
  assert.ok(dispatched.includes('liquidx:ready:PriceTag'))
  assert.equal(typeof unregister, 'function')
})

test('registering an island mounts elements that were already waiting', async () => {
  const { window, queried } = await loadRuntime([island('PriceTag'), island('PriceTag', true)])

  window.registerLiquidIsland('PriceTag', () => null)

  assert.ok(queried.includes('react-island[component="PriceTag"]:not([data-react-hydrated])'))
})

test('unregistering restores the component registered before it', async () => {
  const { window } = await loadRuntime()
  const first = () => null
  const second = () => null

  window.registerLiquidIsland('PriceTag', first)
  const unregisterSecond = window.registerLiquidIsland('PriceTag', second)

  assert.equal(window.LiquidifyComponents.PriceTag, second)

  unregisterSecond()

  assert.equal(window.LiquidifyComponents.PriceTag, first)
})

test('unregistering an island with no predecessor removes it', async () => {
  const { window } = await loadRuntime()
  const component = () => null

  window.registerLiquidIsland('PriceTag', component)()

  assert.equal(window.LiquidifyComponents.PriceTag, undefined)
})

test('unregistering an island that was replaced by another registration is a no-op', async () => {
  const { window } = await loadRuntime()
  const first = () => null
  const second = () => null

  const unregisterFirst = window.registerLiquidIsland('PriceTag', first)
  window.registerLiquidIsland('PriceTag', second)
  unregisterFirst()

  assert.equal(window.LiquidifyComponents.PriceTag, second)
})

test('registering an island requires a name and a component', async () => {
  const { window } = await loadRuntime()

  assert.throws(() => window.registerLiquidIsland('', () => null), /requires a non-empty component name/)
  assert.throws(() => window.registerLiquidIsland('   ', () => null), /requires a non-empty component name/)
  assert.throws(() => window.registerLiquidIsland(42, () => null), /requires a non-empty component name/)
  assert.throws(() => window.registerLiquidIsland('PriceTag', undefined), /requires a component function or object/)
  assert.throws(() => window.registerLiquidIsland('PriceTag', 'nope'), /requires a component function or object/)
  assert.equal(window.LiquidifyComponents.PriceTag, undefined)
})

test('the liquidify and liquidx aliases resolve to the same registry function', async () => {
  const { window } = await loadRuntime()

  assert.equal(window.LiquidxRegisterIsland, window.registerLiquidIsland)

  window.LiquidxRegisterIsland('PriceTag', () => null)
  assert.equal(typeof window.LiquidifyComponents.PriceTag, 'function')
})
