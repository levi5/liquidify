window.scenarios.push({
  name: 'actions',
  run: async () => {
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
  },
})
