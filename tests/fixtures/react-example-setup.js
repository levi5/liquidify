window.testErrors = []
window.testViolations = []
window.requests = []
window.addEventListener('error', (event) => window.testErrors.push(event.message))
window.addEventListener('unhandledrejection', (event) => window.testErrors.push(String(event.reason)))
document.addEventListener('securitypolicyviolation', (event) => window.testViolations.push(event.violatedDirective))
const recommendationCards = Array.from(
  { length: 8 },
  (_, index) => `<article class="product-card">Recommendation ${index + 1}</article>`,
).join('')
const recommendationResponse = `<section><div data-related-grid data-recommendations-state="loaded"><react-island component="ProductShelf" data-hydrate="eager">${recommendationCards}</react-island></div></section>`
window.fetch = async (url, options) => {
  window.requests.push({ url: String(url), body: options?.body })
  if (String(url).includes('/recommendations/products')) return { ok: true, text: async () => recommendationResponse }
  return { ok: true, json: async () => ({ items: [], item_count: 0, total_price: 0, total_discount: 0, currency: 'BRL' }) }
}
