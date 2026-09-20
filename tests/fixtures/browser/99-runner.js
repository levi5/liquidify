async function run() {
  const ctx = {}

  for (const scenario of window.scenarios) await scenario.run(ctx)

  check(window.testErrors.length === 0, window.testErrors.join('; '))
  check(window.testViolations.length === 0, window.testViolations.join('; '))
  document.getElementById('result').textContent =
    'PASS: example interactions, Shopify sections, CSP, imports, ID roots, mixed text, context, hooks, actions and unmount'
}

run().catch((error) => {
  document.getElementById('result').textContent = `FAIL: ${error.stack}`
})
