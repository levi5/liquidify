import { _try } from 'funcio/lib/Monads/Either'
import React from 'preact/compat'
import * as ReactDOM from 'preact/compat'
import * as ReactDOMClient from 'preact/compat/client'
import * as JSXRuntime from 'preact/jsx-runtime'
import * as JSXDevRuntime from 'preact/jsx-dev-runtime'

window.LiquidifyTry = _try
window.LiquidifyParseJSON = (text, node, attribute, fallback, allowText = false) => {
  if (allowText && text === '') return ''
  const parsed = _try.sync(() => JSON.parse(text || '{}'))
  if (parsed.isLeft()) {
    if (!allowText || /^[\s]*[\[{]/.test(text)) {
      console.warn(
        '[Liquidify] Invalid JSON in ' + attribute + '. Generate JSON with the Liquid json filter and escape attribute values.',
        node,
        parsed.value,
      )
    }
    return fallback
  }
  return parsed.value
}
window.React = React
window.ReactDOM = { ...ReactDOM, ...ReactDOMClient }
window.ReactDOMClient = ReactDOMClient
window.LiquidifyJSXRuntime = JSXRuntime
window.LiquidifyJSXDevRuntime = JSXDevRuntime
window.LiquidifyActions = window.LiquidifyActions || new Map()
window.registerLiquidifyAction = (name, handler) => {
  if (!name || typeof handler !== 'function') throw new TypeError('[Liquidify] An action requires a name and a function.')
  window.LiquidifyActions.set(name, handler)
  return () => {
    if (window.LiquidifyActions.get(name) === handler) window.LiquidifyActions.delete(name)
  }
}

window.LiquidifyComponents = window.LiquidifyComponents || window.LiquidxComponents || {}
window.LiquidxComponents = window.LiquidifyComponents
const announceReady = (name: string) => {
  for (const prefix of ['liquidify', 'liquidx']) {
    document.dispatchEvent(new CustomEvent(`${prefix}:ready:${name}`))
  }
}
const mountWaitingIslands = (name: string) => {
  const selector = `react-island[component="${CSS.escape(name)}"]:not([data-react-hydrated])`
  for (const island of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
    if (island.parentElement?.closest('react-island')) continue
    window.LiquidifyMount?.(island, name)
  }
}
window.registerLiquidIsland = (name, component) => {
  if (typeof name !== 'string' || !name.trim()) {
    throw new TypeError('[Liquidify] registerLiquidIsland requires a non-empty component name.')
  }
  if (!component || (typeof component !== 'function' && typeof component !== 'object')) {
    throw new TypeError(`[Liquidify] registerLiquidIsland("${name}") requires a component function or object.`)
  }
  const key = name.trim()
  const previous = window.LiquidifyComponents[key]
  window.LiquidifyComponents[key] = component
  announceReady(key)
  mountWaitingIslands(key)
  return () => {
    if (window.LiquidifyComponents[key] !== component) return
    if (previous !== undefined) window.LiquidifyComponents[key] = previous
    else delete window.LiquidifyComponents[key]
  }
}
window.LiquidxRegisterIsland = window.registerLiquidIsland

const eventSubscriptions = new WeakMap()
const subscriberCounts = new Map()
const pendingEmits = new Map()
window.LiquidifyEvents = {
  on(event: string, callback: (data: any) => void) {
    let events = eventSubscriptions.get(callback)
    if (!events) {
      events = new Map()
      eventSubscriptions.set(callback, events)
    }
    let handlers = events.get(event)
    if (!handlers) {
      handlers = new Set()
      events.set(event, handlers)
    }
    const handler = (e: Event) => callback((e as CustomEvent).detail)
    handlers.add(handler)
    subscriberCounts.set(event, (subscriberCounts.get(event) || 0) + 1)
    window.addEventListener(event, handler)
    return () => {
      window.removeEventListener(event, handler)
      handlers.delete(handler)
      if (!handlers.size && events.get(event) === handlers) events.delete(event)
      if (!events.size && eventSubscriptions.get(callback) === events) eventSubscriptions.delete(callback)
      const left = (subscriberCounts.get(event) || 1) - 1
      if (left > 0) subscriberCounts.set(event, left)
      else subscriberCounts.delete(event)
    }
  },
  off(event: string, callback: (data: any) => void) {
    const events = eventSubscriptions.get(callback)
    const handlers = events?.get(event)
    if (!handlers) return
    for (const handler of handlers) window.removeEventListener(event, handler)
    handlers.clear()
    events.delete(event)
    if (!events.size) eventSubscriptions.delete(callback)
    subscriberCounts.delete(event)
  },
  emit(event: string, data: any) {
    if (!subscriberCounts.get(event)) {
      const queued = pendingEmits.get(event)
      if (queued) queued.push(data)
      else pendingEmits.set(event, [data])
    }
    const ev = new CustomEvent(event, {
      detail: data,
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(ev)
  },
}
window.LiquidxEvents = window.LiquidifyEvents

window.LiquidifyTakePendingEvents = (event) => {
  const queued = pendingEmits.get(event)
  pendingEmits.delete(event)
  return queued || []
}
;(window as any).LiquidxTakePendingEvents = window.LiquidifyTakePendingEvents

window.LiquidifyUseEvent = (event: string, callback: (data: any) => void) => {
  const savedCallback = React.useRef(callback)
  React.useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  React.useEffect(() => {
    const listener = (data: any) => {
      if (savedCallback.current) savedCallback.current(data)
    }
    return window.LiquidifyEvents.on(event, listener)
  }, [event])
}
window.LiquidxUseEvent = window.LiquidifyUseEvent

window.LiquidifyEmitEvent = (event: string, data: any) => {
  window.LiquidifyEvents.emit(event, data)
}
window.LiquidxEmitEvent = window.LiquidifyEmitEvent

const suspendedSections = new WeakSet()
window.LiquidifyCanMount = (container: Element) => {
  if (!container.isConnected) return false
  for (let node = container; node; node = node.parentElement as Element) {
    if (suspendedSections.has(node)) return false
  }
  return true
}
window.LiquidifyMount = (container: Element, name = container.getAttribute('component')) => {
  clearTimeout(container._unmountTimeout as ReturnType<typeof setTimeout>)
  container._unmountTimeout = null
  container._liquidifyReadyCleanup?.()
  if (!name || !window.LiquidifyCanMount(container)) return
  const mount = () => {
    if (!window.LiquidifyCanMount(container) || !window.LiquidifyHydrate?.[name]) return
    container._liquidifyReadyCleanup?.()
    window.LiquidifyHydrate[name](container)
  }
  if (window.LiquidifyHydrate?.[name]) mount()
  else {
    container._liquidifyReadyCleanup = () => {
      document.removeEventListener('liquidify:ready:' + name, mount)
      document.removeEventListener('liquidx:ready:' + name, mount)
      delete container._liquidifyReadyCleanup
    }
    document.addEventListener('liquidify:ready:' + name, mount)
    document.addEventListener('liquidx:ready:' + name, mount)
  }
}
window.LiquidifyUnmount = (container: Element) => {
  clearTimeout(container._unmountTimeout as ReturnType<typeof setTimeout>)
  container._unmountTimeout = null
  container._liquidifyReadyCleanup?.()
  container._liquidifyObserver?.disconnect()
  delete container._liquidifyObserver
  if (container._reactRoot) {
    const root = container._reactRoot
    const result = _try.sync(() => root.unmount())
    if (result.isLeft()) console.error('[Liquidify] Root unmount failed. Check effect cleanup functions.', container, result.value)
    delete container._reactRoot
  }
  container.removeAttribute('data-react-hydrated')
}

const registeredRoots = new Map()
const activeRoots = new Map()
let rootObserver
const updateRoots = () => {
  for (const [container, id] of activeRoots) {
    if (!container.isConnected || container.id !== id) {
      if (!container._unmountTimeout) {
        container._unmountTimeout = setTimeout(() => {
          container._unmountTimeout = null
          if (!container.isConnected || container.id !== id) {
            window.LiquidifyUnmount(container)
            activeRoots.delete(container)
          }
        }, 100)
      }
    } else if (container._unmountTimeout) {
      clearTimeout(container._unmountTimeout)
      container._unmountTimeout = null
    }
  }
  for (const [id, componentName] of registeredRoots) {
    const container = document.getElementById(id)
    if (!container) continue
    activeRoots.set(container, id)
    window.LiquidifyMount(container, componentName)
  }
}
window.LiquidifyRegisterRoot = (id: string, componentName: string) => {
  registeredRoots.set(id, componentName)
  if (!rootObserver) {
    rootObserver = new MutationObserver(updateRoots)
    rootObserver.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['id'] })
  }
  updateRoots()
}

const sectionRoots = (section) => {
  return [section, ...section.querySelectorAll('react-island, [id]')].filter(
    (node) => node.tagName === 'REACT-ISLAND' || registeredRoots.has(node.id) || node._reactRoot,
  )
}
if (typeof document !== 'undefined') {
  document.addEventListener('shopify:section:unload', (event) => {
    const section = event.target as Element | null
    if (!section || section.nodeType !== 1) return
    suspendedSections.add(section)
    for (const container of sectionRoots(section)) {
      window.LiquidifyUnmount(container)
      delete container._liquidifyInitialProps
      activeRoots.delete(container)
    }
  })
  document.addEventListener('shopify:section:load', (event) => {
    const section = event.target as Element | null
    if (!section || section.nodeType !== 1) return
    suspendedSections.delete(section)
    for (const container of sectionRoots(section)) {
      const componentName = registeredRoots.get(container.id) || container.getAttribute('component')
      if (registeredRoots.has(container.id)) activeRoots.set(container, container.id)
      window.LiquidifyMount(container, componentName)
    }
  })
}
