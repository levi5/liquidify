window.testErrors = []
window.testViolations = []
window.requests = []
window.addEventListener('error', (event) => window.testErrors.push(event.message))
window.addEventListener('unhandledrejection', (event) => window.testErrors.push(String(event.reason)))
document.addEventListener('securitypolicyviolation', (event) => window.testViolations.push(event.violatedDirective))
window.fetch = async (url, options) => {
  window.requests.push({ url: String(url), body: options?.body })
  return { ok: true, json: async () => ({ items: [], item_count: 0, total_price: 0, total_discount: 0, currency: 'BRL' }) }
}
