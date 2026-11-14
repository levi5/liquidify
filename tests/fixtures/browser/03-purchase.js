window.scenarios.push({
  name: 'purchase-flow',
  run: async () => {
    document.getElementById('probe-counter').click()
    await wait()
    check(document.getElementById('probe-counter').textContent === '1', 'JSX runtime hooks must update')

    const root = document.getElementById('product-provider')
    const increase = root.querySelector('[data-product-quantity] button:last-child')
    const add = root.querySelector('[data-product-add-to-cart]')
    check(increase && add, 'Current product purchase controls must render')
    check(!add.disabled, 'Available variant must enable purchase')
    document.querySelector('.miniCartIcon').click()
    await wait()
    check(document.querySelector('.miniCartEmpty'), 'MiniCart must initially render an empty cart')
    document.querySelector('.drawerOverlay').click()
    await wait()
    increase.click()
    await wait()
    check(root.querySelector('#Quantity').value === '2', 'Example quantity click must update')

    const quantity = root.querySelector('#Quantity')
    quantity.value = '3'
    quantity.dispatchEvent(new Event('input', { bubbles: true }))
    await wait()
    let success
    window.addEventListener(
      'product:add-to-cart:success',
      (event) => {
        success = event.detail
      },
      { once: true },
    )
    add.click()
    await wait()
    const requests = window.requests.filter((request) => request.url.endsWith('cart/add.js'))
    check(requests.length === 1, 'Purchase click must submit exactly once')
    const payload = JSON.parse(requests[0].body)
    check(payload.id === 1 && payload.quantity === 3, 'Purchase must submit the selected variant and quantity')
    check(success?.variant.id === 1, 'Purchase must emit success for the selected variant')
    check(document.querySelector('dialog.drawerContent')?.open, 'Successful purchase must open MiniCart')
    check(document.querySelector('.miniCartProductName')?.textContent === 'Test product', 'MiniCart must render the purchased item')
    check(document.querySelector('.miniCartCount')?.textContent === '3', 'MiniCart must display the purchased quantity')
    check(
      Boolean(document.querySelector('.toastAlert.success .toastMessage')?.textContent?.trim()),
      'Purchase success feedback must render',
    )
  },
})
