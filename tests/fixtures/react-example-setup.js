window.testErrors = []
window.testViolations = []
window.requests = []
window.addEventListener('error', (event) => window.testErrors.push(event.message))
window.addEventListener('unhandledrejection', (event) => window.testErrors.push(String(event.reason)))
document.addEventListener('securitypolicyviolation', (event) => {
  window.testViolations.push(`${event.violatedDirective} at ${event.sourceFile}:${event.lineNumber}`)
})
window.fetch = async (url, options) => {
  window.requests.push({ url: String(url), body: options?.body })
  if (String(url).endsWith('cart/add.js')) {
    const { id, quantity } = JSON.parse(options.body)
    const item = { key: String(id), variant_id: id, title: 'Test product', url: '/products/test', price: 1000, quantity }
    window.testCart = { items: [item], item_count: quantity, total_price: quantity * item.price }
    return { ok: true, json: async () => item }
  }
  if (String(url).endsWith('cart.js') && window.testCart) return { ok: true, json: async () => window.testCart }
  return { ok: true, json: async () => ({ items: [], item_count: 0, total_price: 0, total_discount: 0, currency: 'BRL' }) }
}
