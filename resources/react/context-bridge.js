window.__LIQUIDIFY_CONTEXTS__ = window.__LIQUIDIFY_CONTEXTS__ || window.__LIQUIDX_CONTEXTS__ || {}
if (!window.React || !window.LiquidifyTry) throw new Error('[Liquidify] Load react-runtime.js before component scripts.')
;(function () {
  const result = window.LiquidifyTry.sync(() => {
    var R = window.React
    if (R && !R.__createContext_patched__) {
      var originalCreate = R.createContext
      R.createContext = function (defaultValue, id) {
        if (id && typeof id === 'string') {
          if (!window.__LIQUIDIFY_CONTEXTS__[id]) window.__LIQUIDIFY_CONTEXTS__[id] = originalCreate(defaultValue)
          return window.__LIQUIDIFY_CONTEXTS__[id]
        }
        return originalCreate(defaultValue)
      }
      R.__createContext_patched__ = true
    }
  })
  if (result.isLeft()) {
    console.error(
      '[Liquidify] Context bridge initialization failed. Check that runtime and component assets use the same Liquidify version.',
      result.value,
    )
    throw result.value
  }
})()
