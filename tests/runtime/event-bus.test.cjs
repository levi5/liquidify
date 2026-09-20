const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const { buildRuntimeScript } = require('../helpers/runtime-harness.cjs')

const createDomWindow = () => {
  const listeners = new Map()
  const CustomEvent = class {
    constructor(type, options) {
      this.type = type
      this.detail = options.detail
    }
  }
  const window = {
    addEventListener(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event).add(handler)
    },
    removeEventListener(event, handler) {
      listeners.get(event)?.delete(handler)
    },
    dispatchEvent(event) {
      for (const handler of listeners.get(event.type) || []) handler(event)
    },
  }

  return { listeners, window, CustomEvent }
}

test('duplicate event subscriptions have independent cleanup', async () => {
  const { window, CustomEvent } = createDomWindow()

  vm.runInNewContext(await buildRuntimeScript(), { window, CustomEvent })

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
})

test('removing every subscription releases all listeners', async () => {
  const { listeners, window, CustomEvent } = createDomWindow()

  vm.runInNewContext(await buildRuntimeScript(), { window, CustomEvent })

  const callback = () => {}
  const bus = window.LiquidifyEvents
  const cartSubscription = bus.on('cart', callback)
  const productSubscription = bus.on('product', callback)

  cartSubscription()
  productSubscription()

  assert.equal(listeners.get('cart').size, 0)
  assert.equal(listeners.get('product').size, 0)
})
