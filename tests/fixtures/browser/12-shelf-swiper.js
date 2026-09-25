window.scenarios.push({
  name: 'attr-probe',
  run: async () => {
    await wait()
    const target = document.querySelector('#shelf-test-slide')
    check(!!target, 'island host must exist')
    check(!target.hasAttribute('settings'), 'island host must not receive component props as attributes: ' + target.outerHTML.slice(0, 300))
  },
})
