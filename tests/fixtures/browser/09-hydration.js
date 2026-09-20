window.scenarios.push({
  name: 'hydration-unmount',
  run: async () => {
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
  },
})
