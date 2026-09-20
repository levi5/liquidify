window.scenarios.push({
  name: 'runtime-sharing',
  run: async () => {
    check(Object.values(window.importChecks).every(Boolean), 'Imports must share the runtime')
    check(document.getElementById('context-value').textContent === 'shared-context', 'Context must be shared')
  },
})
