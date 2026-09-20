import React, { useState, useContext } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { createRoot as preactRoot } from 'preact/compat/client'
import { jsx, jsxs, Fragment } from 'react/jsx-runtime'
import { jsxDEV } from 'react/jsx-dev-runtime'
import { jsx as preactJsx } from 'preact/jsx-runtime'
import { jsxDEV as preactJsxDev } from 'preact/jsx-dev-runtime'
import { registerLiquidifyAction } from 'liquidify/runtime'

window.importChecks = {
  react: React === window.React,
  root: createRoot === window.ReactDOM.createRoot && createRoot === preactRoot,
  hydrate: hydrateRoot === window.ReactDOMClient.hydrateRoot,
  jsx: jsx === preactJsx && jsx === window.LiquidifyJSXRuntime.jsx,
  jsxDev: jsxDEV === preactJsxDev && jsxDEV === window.LiquidifyJSXDevRuntime.jsxDEV,
  fragment: Fragment === window.React.Fragment,
}
window.testContext = window.testContext || React.createContext('default')
registerLiquidifyAction('increment', function () {
  window.actionTarget = this.id
  window.actionCount = (window.actionCount || 0) + 1
})
function ContextConsumer() {
  return jsx('span', { id: 'context-value', children: useContext(window.testContext) })
}
export function ImportProbe() {
  const [count, setCount] = useState(0)
  return jsxs(window.testContext.Provider, {
    value: 'shared-context',
    children: [
      jsx('button', { id: 'probe-counter', onClick: () => setCount(count + 1), children: count }),
      jsxDEV(ContextConsumer, {}, undefined, false, undefined, undefined),
    ],
  })
}
