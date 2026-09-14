const code = finalVal
props[key] = (event) => {
  const result = window.LiquidifyTry.sync(() => {
    const fn = new Function('event', 'e', code)
    fn.call(event.currentTarget || node, event, event)
  })
  if (result.isLeft())
    console.error('[Liquidify] Inline event failed. Check the handler or migrate to registerLiquidifyAction.', node, key, result.value)
}
