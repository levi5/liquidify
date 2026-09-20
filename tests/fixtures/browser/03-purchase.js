window.scenarios.push({
  name: 'purchase-flow',
  run: async () => {
    document.getElementById('probe-counter').click()
    await wait()
    check(document.getElementById('probe-counter').textContent === '1', 'JSX runtime hooks must update')

    document.querySelector('[aria-label="Aumentar quantidade"]').click()
    await wait()
    check(document.getElementById('ProductQuantity').value === '2', 'Example quantity click must update')

    const quantity = document.getElementById('ProductQuantity')
    quantity.value = '3'
    quantity.dispatchEvent(new Event('input', { bubbles: true }))
    await wait()
    document.querySelector('.purchase-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await wait()
    check(
      JSON.parse(window.requests.find((request) => request.url.endsWith('cart/add.js')).body).items[0].quantity === 3,
      'Example form must submit selected quantity',
    )
    check(document.body.textContent.includes('Adicionado à sua sacola.'), 'Example purchase success must render')
  },
})
