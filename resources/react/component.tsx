window.LiquidifyComponents = window.LiquidifyComponents || window.LiquidxComponents || {}

window.LiquidifyParseProps = (node: Element) => {
  const props: Record<string, unknown> = {}
  Array.from(node.attributes || []).forEach((attr) => {
    const val = attr.value
    let finalVal: unknown = val
    if (val === 'true') finalVal = true
    else if (val === 'false') finalVal = false
    else if (!Number.isNaN(Number(val)) && val.trim() !== '') finalVal = Number(val)

    let key = attr.name
    if (key === 'class') key = 'className'
    else if (key === 'for') key = 'htmlFor'

    if (key.startsWith('data-liquidify-on-')) {
      const eventName = key.slice('data-liquidify-on-'.length)
      const eventProp = {
        click: 'onClick',
        change: 'onChange',
        input: 'onInput',
        submit: 'onSubmit',
        keydown: 'onKeyDown',
        keyup: 'onKeyUp',
        focus: 'onFocus',
        blur: 'onBlur',
        dblclick: 'onDoubleClick',
        pointerdown: 'onPointerDown',
        pointerup: 'onPointerUp',
      }[eventName]
      if (!eventProp) {
        console.warn('[Liquidify] Unsupported action event:', eventName, node)
        return
      }
      props[eventProp] = (event) => {
        const action = window.LiquidifyActions?.get(val)
        if (action) action.call(event.currentTarget || node, event)
        else console.warn('[Liquidify] Action is not registered. Call registerLiquidifyAction before interaction:', val, node)
      }
    } else if (key.startsWith('on') && typeof finalVal === 'string') {
      __LIQUIDIFY_INLINE_HANDLER__
    } else {
      props[key] = finalVal
    }
  })
  const propsScript = Array.from(node.children).find((c) => (c as any).tagName === 'SCRIPT' && (c as any).hasAttribute('data-react-props'))
  if (propsScript) {
    Object.assign(props, window.LiquidifyParseJSON(propsScript.textContent, propsScript, 'data-react-props', {}))
  }
  return props
}

const getComponent = (tagName: string, islandComp: string | null) => {
  let C: any = islandComp ? window.LiquidifyComponents[islandComp] : null
  if (!C) {
    const k = Object.keys(window.LiquidifyComponents).find((k) => k.toLowerCase() === tagName.toLowerCase())
    if (k) C = window.LiquidifyComponents[k]
  }
  return C && C.default ? C.default : C
}

window.LiquidifyCreateReactElement = (node: Node, index: number) => {
  if (!node) return null
  if (node.nodeType === 3) return node.textContent
  if (node.nodeType !== 1 || (node as Element).tagName === 'SCRIPT') return null
  const element = node as Element
  const nodeName = element.tagName
  const islandComp = element.getAttribute('component')
  const Comp = getComponent(nodeName, islandComp)

  if (islandComp || Comp) {
    return window.React.createElement(LazyIsland, {
      ...window.LiquidifyParseProps(element),
      key: index,
      componentName: islandComp || nodeName,
      node: element,
    })
  }

  const props = window.LiquidifyParseProps(element)
  const childNodes = Array.from(element.childNodes || [])
  return window.React.createElement(
    nodeName.toLowerCase(),
    { key: index, ...props },
    childNodes.map((c, i) => window.LiquidifyCreateReactElement(c, i)),
  )
}

function LazyIsland({ componentName, node, ...props }: { componentName: string; node: Element; [key: string]: any }) {
  const [Comp, setComp] = window.React.useState(() => getComponent(node.tagName, componentName))
  window.React.useEffect(() => {
    if (Comp) return
    const onReady = () => {
      const found = getComponent(node.tagName, componentName)
      if (found) setComp(() => found)
    }
    document.addEventListener('liquidify:ready:' + componentName, onReady)
    document.addEventListener('liquidx:ready:' + componentName, onReady)

    onReady()
    return () => {
      document.removeEventListener('liquidify:ready:' + componentName, onReady)
      document.removeEventListener('liquidx:ready:' + componentName, onReady)
    }
  }, [Comp, componentName])

  if (!Comp) {
    return window.React.createElement(node.tagName.toLowerCase(), {
      dangerouslySetInnerHTML: { __html: node.innerHTML },
      ...window.LiquidifyParseProps(node),
    })
  }

  node.setAttribute('data-react-hydrated', 'true')
  const childNodes = Array.from(node.childNodes || []).filter((c) => c.nodeType !== 8 && c.nodeName !== 'SCRIPT')
  const children =
    props.children ?? node._liquidifyInitialProps?.children ?? childNodes.map((c, i) => window.LiquidifyCreateReactElement(c, i))
  return window.React.createElement(Comp, { ...props, children })
}

const mergeLiquidValue = (previous: unknown, value: unknown): unknown => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value
  const base = previous !== null && typeof previous === 'object' && !Array.isArray(previous) ? previous : {}
  return { ...base, ...value }
}

window.LiquidifyGetProps = (node: Element, propName = 'store') => {
  const props: Record<string, unknown> = { elementId: node.id || node.tagName.toLowerCase() }
  let parent = node.parentElement
  while (parent) {
    const script = Array.from(parent.children).find(
      (c) =>
        (c as any).tagName === 'SCRIPT' &&
        (c as any).type === 'application/json' &&
        ((c as any).hasAttribute('data-liquid') || (c as any).hasAttribute('data-liquid-store')),
    )
    if (script) {
      const val = window.LiquidifyParseJSON(script.textContent, script, 'data-liquid store script', {})
      props[propName] = mergeLiquidValue(props[propName], val)
    }

    for (const attr of Array.from(parent.attributes)) {
      if (/^data-liquid(?:-|$)/.test(attr.name)) {
        const key =
          attr.name === 'data-liquid' || attr.name === 'data-liquid-store'
            ? propName
            : attr.name.replace('data-liquid-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase())
        const val = window.LiquidifyParseJSON(attr.value, parent, attr.name, attr.value, true)
        props[key] = mergeLiquidValue(props[key], val)
      }
    }
    parent = parent.parentElement
  }
  for (const attr of Array.from(node.attributes)) {
    let val: unknown = attr.value
    if (/^data-liquid(?:-|$)/.test(attr.name)) {
      const key =
        attr.name === 'data-liquid' || attr.name === 'data-liquid-store'
          ? propName
          : attr.name.replace('data-liquid-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase())
      val = window.LiquidifyParseJSON(attr.value, node, attr.name, attr.value, true)
      props[key] = mergeLiquidValue(props[key], val)
      continue
    }
    const raw = attr.value
    if (raw === 'true') val = true
    else if (raw === 'false') val = false
    else if (!Number.isNaN(Number(raw)) && raw.trim() !== '') val = Number(raw)
    props[attr.name.replace(/-([a-z])/g, (g) => g[1].toUpperCase())] = val
  }
  const propsScript = Array.from(node.children).find((c) => (c as any).tagName === 'SCRIPT' && (c as any).hasAttribute('data-react-props'))
  if (propsScript) {
    Object.assign(props, window.LiquidifyParseJSON(propsScript.textContent, propsScript, 'data-react-props', {}))
  }
  props.children = Array.from(node.childNodes)
    .filter((c) => c.nodeType !== 8 && c.nodeName !== 'SCRIPT')
    .map((c, i) => window.LiquidifyCreateReactElement(c, i))
  return props
}

if (!customElements.get('liquid-data')) {
  class LiquidData extends HTMLElement {
    connectedCallback() {
      this.style.display = 'contents'
    }
  }
  customElements.define('liquid-data', LiquidData)
}

__LIQUIDIFY_INJECTOR__
__LIQUIDIFY_SOURCE__
const __liquidifyRegistration = window.LiquidifyTry.sync(() => {
  window.LiquidifyComponents['__LIQUIDIFY_COMPONENT__'] = typeof __LIQUIDIFY_COMPONENT__ !== 'undefined' ? __LIQUIDIFY_COMPONENT__ : null
  window.LiquidxComponents = window.LiquidifyComponents
})
if (__liquidifyRegistration.isLeft())
  console.error(
    '[Liquidify] Failed to register __LIQUIDIFY_COMPONENT__. Check the component export and runtime load order.',
    __liquidifyRegistration.value,
  )

if (!window.LiquidifyHydrate) window.LiquidifyHydrate = window.LiquidxHydrate || {}
window.LiquidxHydrate = window.LiquidifyHydrate

const hasLayoutBox = (container: Element) => getComputedStyle(container).display !== 'contents'

window.LiquidifyHydrate['__LIQUIDIFY_COMPONENT__'] = (container) => {
  if (!window.LiquidifyCanMount(container)) return
  if (container._liquidifyObserver) return
  if (container.hasAttribute('data-react-hydrated') && container._reactRoot) return
  if (container.hasAttribute('data-react-hydrated')) {
    container.removeAttribute('data-react-hydrated')
  }
  if (container.parentElement && container.parentElement.closest('react-island')) return

  const hydrate = () => {
    container._liquidifyObserver?.disconnect()
    delete container._liquidifyObserver
    if (!window.LiquidifyCanMount(container)) return
    if (container.hasAttribute('data-react-hydrated') && container._reactRoot) return
    if (container.hasAttribute('data-react-hydrated')) {
      container.removeAttribute('data-react-hydrated')
    }
    container.setAttribute('data-react-hydrated', 'true')
    const props = container._liquidifyInitialProps || window.LiquidifyGetProps(container, 'store')
    container._liquidifyInitialProps = props
    container.replaceChildren()
    const root = window.ReactDOM.createRoot(container)
    container._reactRoot = root
    root.render(window.React.createElement(__LIQUIDIFY_COMPONENT__, props))
  }
  if (container.getAttribute('data-hydrate') === 'eager') hydrate()
  else if ('IntersectionObserver' in window && hasLayoutBox(container)) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          hydrate()
          observer.unobserve(container)
        }
      },
      { rootMargin: '200px' },
    )
    container._liquidifyObserver = observer
    observer.observe(container)
  } else hydrate()
}

document.dispatchEvent(new CustomEvent('liquidify:ready:__LIQUIDIFY_COMPONENT__'))
document.dispatchEvent(new CustomEvent('liquidx:ready:__LIQUIDIFY_COMPONENT__'))

if (!customElements.get('react-island')) {
  class ReactIsland extends HTMLElement {
    connectedCallback() {
      window.LiquidifyMount(this)
    }

    disconnectedCallback() {
      this._liquidifyReadyCleanup?.()
      this._liquidifyObserver?.disconnect()
      delete this._liquidifyObserver
      clearTimeout(this._unmountTimeout as ReturnType<typeof setTimeout>)
      this._unmountTimeout = setTimeout(() => {
        if (!this.isConnected) window.LiquidifyUnmount(this)
      }, 100)
    }
  }
  customElements.define('react-island', ReactIsland)
}
document.querySelectorAll('react-island[component="__LIQUIDIFY_COMPONENT__"]:not([data-react-hydrated])').forEach((island) => {
  if (!island.parentElement || !island.parentElement.closest('react-island')) window.LiquidifyHydrate['__LIQUIDIFY_COMPONENT__'](island)
})

if (__LIQUIDIFY_ROOT_ID__) window.LiquidifyRegisterRoot(__LIQUIDIFY_ROOT_ID__, '__LIQUIDIFY_COMPONENT__')
