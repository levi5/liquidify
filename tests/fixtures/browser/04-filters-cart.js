window.scenarios.push({
  name: 'filters-cart',
  run: async () => {
    document.querySelector('.mobile-filter-trigger').click()
    await wait()
    check(document.querySelector('#FilterDrawer-test').open, 'Example filters must open')

    document.querySelector('[aria-label="Fechar filtros"]').click()
    await wait()
    check(!document.querySelector('#FilterDrawer-test').open, 'Example filters must close')

    check(document.querySelector('.cart-contents .empty-state'), 'Example cart must render')
  },
})
