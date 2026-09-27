window.scenarios.push({
  name: 'liquid-data',
  run: async () => {
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
      check(
        JSON.stringify(window.LiquidifyGetProps(dataNode).value) === JSON.stringify(value),
        'Inherited Liquid values must preserve type',
      )
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
  },
})
