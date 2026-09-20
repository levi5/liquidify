window.scenarios.push({
  name: 'shopify-sections',
  run: async (ctx) => {
    const { replacementRoot } = ctx
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
    window.LiquidifyHydrate.LateEditor = () => {
      lateMounts++
    }
    document.dispatchEvent(new CustomEvent('liquidify:ready:LateEditor'))
    document.dispatchEvent(new CustomEvent('liquidx:ready:LateEditor'))
    check(lateMounts === 1 && !lateIsland._liquidifyReadyCleanup, 'Late components must mount once and release readiness listeners')

    emitSection('unload')
    section.remove()
    await wait()
    check(window.sectionCleanups === 2, 'Removing an unloaded section must not repeat cleanup')
  },
})
