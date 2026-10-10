console.warn(
  '[Liquidify] Dropped inline event handler for "' +
    key +
    '" — react.strictCsp is enabled and the runtime never builds functions from attribute text. This attribute came from Liquid markup, so it bypassed the compile-time check. Register the behaviour with registerLiquidifyAction() and data-liquidify-on-<event>.',
  node,
  finalVal,
)