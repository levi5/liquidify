const wait = () => new Promise((resolve) => setTimeout(resolve, 100))
const check = (condition, message) => { if (!condition) throw new Error(message) }
async function run() {
  await wait()
  check(window.testErrors.length === 0, window.testErrors.join('; '))
  const idRoot = document.getElementById('legacy:root')
  check(idRoot._reactRoot && idRoot.querySelector('.root-probe'), 'Explicit ID root must mount')
  check(idRoot.textContent === 'Olá mundo! Dentro da ilha!', 'Mixed text must survive conversion and nested islands')
  check(!idRoot.querySelector('script'), 'Props scripts must not render as children')
  const firstRoot = idRoot._reactRoot
  const mountsBeforeMove = window.rootMounts
  idRoot.remove()
  await new Promise((resolve) => setTimeout(resolve, 20))
  document.body.appendChild(idRoot)
  await wait()
  check(idRoot._reactRoot === firstRoot && window.rootMounts === mountsBeforeMove, 'DOM moves must preserve roots')
  idRoot.remove()
  await wait()
  await wait()
  check(!idRoot._reactRoot && window.rootCleanups === 1, 'ID root removal must clean up effects')
  document.body.appendChild(idRoot)
  await wait()
  check(idRoot._reactRoot && idRoot._reactRoot !== firstRoot, 'ID roots must remount on reinsertion')
  check(idRoot.textContent === 'Olá mundo! Dentro da ilha!', 'Remount must preserve original children')
  idRoot.remove()
  await wait()
  await wait()
  const replacementRoot = document.createElement('div')
  replacementRoot.id = 'legacy:root'
  replacementRoot.setAttribute('data-hydrate', 'eager')
  replacementRoot.textContent = 'Novo conteúdo'
  document.body.appendChild(replacementRoot)
  await wait()
  check(replacementRoot.querySelector('.root-probe') && replacementRoot.textContent === 'Novo conteúdo', 'Dynamically inserted ID root must mount')
  check(Object.values(window.importChecks).every(Boolean), 'Imports must share the runtime')
  check(document.getElementById('context-value').textContent === 'shared-context', 'Context must be shared')
  document.getElementById('probe-counter').click()
  await wait()
  check(document.getElementById('probe-counter').textContent === '1', 'JSX runtime hooks must update')
  document.querySelector('[aria-label="Aumentar quantidade"]').click()
  await wait()
  check(document.getElementById('ProductQuantity').value === '2', 'Example quantity click must update')
  const quantity = document.getElementById('ProductQuantity')
  quantity.value = '3'
  quantity.dispatchEvent(new Event('input', { bubbles: true }))
  await wait()
  document.querySelector('.purchase-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await wait()
  check(JSON.parse(window.requests.find((request) => request.url.endsWith('cart/add.js')).body).items[0].quantity === 3, 'Example form must submit selected quantity')
  check(document.body.textContent.includes('Adicionado à sua sacola.'), 'Example purchase success must render')
  document.querySelector('.mobile-filter-trigger').click()
  await wait()
  check(document.querySelector('#FilterDrawer-test').open, 'Example filters must open')
  document.querySelector('[aria-label="Fechar filtros"]').click()
  await wait()
  check(!document.querySelector('#FilterDrawer-test').open, 'Example filters must close')
  check(document.querySelector('.cart-contents .empty-state'), 'Example cart must render')
  const node = document.createElement('button')
  node.id = 'registered-action'
  node.setAttribute('data-liquidify-on-click', 'increment')
  const root = window.ReactDOM.createRoot(document.getElementById('actions'))
  root.render(window.LiquidifyCreateReactElement(node, 0))
  document.getElementById('registered-action').click()
  check(window.actionCount === 1 && window.actionTarget === 'registered-action', 'Registered action must receive the element')
  const legacy = document.createElement('button')
  legacy.setAttribute('onclick', 'window.legacyCount = (window.legacyCount || 0) + 1')
  const props = window.LiquidifyParseProps(legacy)
  if (document.querySelector('meta[http-equiv]').content.includes('unsafe-eval')) {
    props.onclick({ currentTarget: legacy })
    check(window.legacyCount === 1, 'Legacy inline handlers must remain compatible')
  } else {
    check(props.onclick === undefined, 'Strict mode must omit inline code')
  }
  const section = document.createElement('section')
  section.id = 'shopify-section-test'
  const editorIsland = document.createElement('react-island')
  editorIsland.setAttribute('component', 'ShopifyProbe')
  editorIsland.setAttribute('data-hydrate', 'eager')
  const setSectionProps = (label) => {
    const data = document.createElement('script')
    data.type = 'application/json'
    data.setAttribute('data-react-props', '')
    data.textContent = JSON.stringify({ label })
    editorIsland.replaceChildren(data)
  }
  setSectionProps('Antes')
  section.append(editorIsland, replacementRoot)
  document.body.appendChild(section)
  await wait()
  const unaffectedRoot = document.querySelector('react-island[component="ImportProbe"]')._reactRoot
  const mountedRoot = editorIsland._reactRoot
  const emitSection = (type) => section.dispatchEvent(new CustomEvent('shopify:section:' + type, { bubbles: true, detail: { sectionId: 'test' } }))
  emitSection('load')
  emitSection('load')
  check(editorIsland._reactRoot === mountedRoot && window.sectionMounts === 1, 'Repeated section load must not duplicate roots')
  window.LiquidifyEvents.emit('section:ping')
  check(window.sectionPings === 1, 'Section event must have one subscription')
  const lateIsland = document.createElement('react-island')
  lateIsland.setAttribute('component', 'LateEditor')
  section.appendChild(lateIsland)
  check(lateIsland._liquidifyReadyCleanup, 'Unloaded component must wait for readiness')
  const pendingIsland = document.createElement('react-island')
  pendingIsland.setAttribute('component', 'ShopifyProbe')
  section.appendChild(pendingIsland)
  check(pendingIsland._liquidifyObserver, 'Lazy island must wait for visibility')
  emitSection('unload')
  emitSection('unload')
  check(!editorIsland._reactRoot && !replacementRoot._reactRoot, 'Section unload must immediately unmount islands and ID roots')
  check(!lateIsland._liquidifyReadyCleanup && !pendingIsland._liquidifyObserver, 'Section unload must cancel pending listeners and observers')
  check(window.sectionCleanups === 1 && !window.LiquidifyActions.has('section-action'), 'Effects and registered actions must clean up exactly once')
  const stoppedTicks = window.sectionTicks
  window.LiquidifyEvents.emit('section:ping')
  section.appendChild(document.createElement('span'))
  await wait()
  check(window.sectionPings === 1 && window.sectionTicks === stoppedTicks, 'Unloaded sections must release subscriptions and timers')
  check(!editorIsland._reactRoot && !replacementRoot._reactRoot, 'DOM mutations must not remount an unloaded section')
  check(document.querySelector('react-island[component="ImportProbe"]')._reactRoot === unaffectedRoot, 'Other sections must remain mounted')
  pendingIsland.remove()
  setSectionProps('Depois')
  replacementRoot.textContent = 'Dados atualizados'
  emitSection('load')
  await wait()
  check(editorIsland.textContent === 'Depois: 0' && replacementRoot.textContent === 'Dados atualizados', 'Section reload must use fresh props and ID root content')
  check(window.sectionMounts === 2, 'Section must remount once after unload')
  editorIsland.querySelector('button').click()
  await wait()
  check(editorIsland.textContent === 'Depois: 1', 'React events must work after section reload under CSP')
  let lateMounts = 0
  window.LiquidifyHydrate.LateEditor = () => { lateMounts++ }
  document.dispatchEvent(new CustomEvent('liquidify:ready:LateEditor'))
  document.dispatchEvent(new CustomEvent('liquidx:ready:LateEditor'))
  check(lateMounts === 1 && !lateIsland._liquidifyReadyCleanup, 'Late components must mount once and release readiness listeners')
  emitSection('unload')
  section.remove()
  await wait()
  check(window.sectionCleanups === 2, 'Removing an unloaded section must not repeat cleanup')
  const dataParent = document.createElement('div')
  const dataNode = document.createElement('div')
  dataParent.appendChild(dataNode)
  const cases = ['texto', '', true, false, 0, 12.5, null, [], ['a', 2, false], { local: 2 }]
  for (const value of cases) {
    dataParent.setAttribute('data-liquid-value', JSON.stringify({ inherited: 1 }))
    dataNode.setAttribute('data-liquid-value', JSON.stringify(value))
    const actual = window.LiquidifyGetProps(dataNode).value
    const expected = value && typeof value === 'object' && !Array.isArray(value) ? { inherited: 1, ...value } : value
    check(JSON.stringify(actual) === JSON.stringify(expected), 'Local Liquid values must preserve type: ' + JSON.stringify(value))
  }
  dataNode.removeAttribute('data-liquid-value')
  for (const value of cases) {
    dataParent.setAttribute('data-liquid-value', JSON.stringify(value))
    check(JSON.stringify(window.LiquidifyGetProps(dataNode).value) === JSON.stringify(value), 'Inherited Liquid values must preserve type')
  }
  dataParent.setAttribute('data-liquid-value', '[1,2]')
  dataNode.setAttribute('data-liquid-value', '{"local":3}')
  check(JSON.stringify(window.LiquidifyGetProps(dataNode).value) === '{"local":3}', 'Objects must not inherit array indexes')
  dataNode.setAttribute('data-liquid-value', 'texto sem aspas')
  check(window.LiquidifyGetProps(dataNode).value === 'texto sem aspas', 'Plain text fallback must survive')
  dataNode.setAttribute('data-liquid-value', '')
  check(window.LiquidifyGetProps(dataNode).value === '', 'Empty attributes must preserve empty strings')
  dataNode.setAttribute('data-liquid', 'false')
  check(window.LiquidifyGetProps(dataNode).store === false, 'data-liquid alias must preserve false')
  dataNode.removeAttribute('data-liquid')
  dataNode.setAttribute('data-liquid-store', '[1,2]')
  check(Array.isArray(window.LiquidifyGetProps(dataNode).store), 'data-liquid-store must preserve arrays')
  const originalAdd = document.addEventListener
  const originalRemove = document.removeEventListener
  const readyListeners = new Map()
  const countReadyListeners = () => [...readyListeners.values()].reduce((total, listeners) => total + listeners.size, 0)
  const trackedEvents = ['liquidify:ready:DetachedProbe', 'liquidx:ready:DetachedProbe']
  document.addEventListener = function (type, listener, options) {
    if (trackedEvents.includes(type)) {
      if (!readyListeners.has(type)) readyListeners.set(type, new Set())
      readyListeners.get(type).add(listener)
    }
    return originalAdd.call(this, type, listener, options)
  }
  document.removeEventListener = function (type, listener, options) {
    if (trackedEvents.includes(type)) readyListeners.get(type)?.delete(listener)
    return originalRemove.call(this, type, listener, options)
  }
  const detachedProbe = document.createElement('react-island')
  detachedProbe.setAttribute('component', 'DetachedProbe')
  for (let index = 0; index < 3; index++) {
    document.body.appendChild(detachedProbe)
    check(countReadyListeners() === 2, 'Connection must install both readiness listeners')
    detachedProbe.remove()
    check(countReadyListeners() === 0 && !detachedProbe._liquidifyReadyCleanup, 'Detachment must remove readiness listeners immediately')
  }
  let detachedMounts = 0
  window.LiquidifyHydrate.DetachedProbe = () => { detachedMounts++ }
  for (const type of trackedEvents) document.dispatchEvent(new CustomEvent(type))
  check(detachedMounts === 0, 'Detached islands must not mount on readiness')
  document.body.appendChild(detachedProbe)
  check(detachedMounts === 1 && countReadyListeners() === 0, 'Reconnected island must mount once with no stale listeners')
  detachedProbe.remove()
  document.addEventListener = originalAdd
  document.removeEventListener = originalRemove
  const serverRoot = document.createElement('div')
  serverRoot.innerHTML = '<span>server</span>'
  document.body.appendChild(serverRoot)
  const serverSpan = serverRoot.firstChild
  const hydratedRoot = window.ReactDOMClient.hydrateRoot(serverRoot, window.LiquidifyJSXRuntime.jsx('span', { children: 'server' }))
  check(serverRoot.firstChild === serverSpan, 'hydrateRoot must reuse server markup')
  hydratedRoot.unmount()
  check(!serverRoot.firstChild, 'hydrateRoot must support unmount')
  const hydrated = document.querySelector('react-island[component="ImportProbe"]')
  const reactRoot = hydrated._reactRoot
  hydrated.remove()
  await wait()
  await wait()
  check(!hydrated._reactRoot && !hydrated.hasAttribute('data-react-hydrated'), 'Island removal must clean up')
  check(typeof reactRoot.unmount === 'function', 'Roots must support unmount')
  check(window.testErrors.length === 0, window.testErrors.join('; '))
  check(window.testViolations.length === 0, window.testViolations.join('; '))
  document.getElementById('result').textContent = 'PASS: example interactions, Shopify sections, CSP, imports, ID roots, mixed text, context, hooks, actions and unmount'
}
run().catch((error) => { document.getElementById('result').textContent = `FAIL: ${error.stack}` })
