window.scenarios.push({
  name: 'filters-cart',
  run: async () => {
    document.querySelector('.mobile-filter-trigger').click()
    await wait()
    check(document.querySelector('#FilterDrawer-test').open, 'Example filters must open')

    document.querySelector('#FilterDrawer-test .dialog-header .icon-button').click()
    await wait()
    check(!document.querySelector('#FilterDrawer-test').open, 'Example filters must close')

    check(document.querySelector('.miniCartProduct'), 'Example cart must retain the purchased item')
  },
})
