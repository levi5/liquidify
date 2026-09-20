window.scenarios.push({
  name: 'id-roots',
  run: async (ctx) => {
    await wait()
    check(window.testErrors.length === 0, window.testErrors.join('; '))

    const idRoot = document.getElementById('legacy:root')
    check(idRoot._reactRoot && idRoot.querySelector('.root-probe'), 'Explicit ID root must mount')
    check(idRoot.textContent === 'Olá mundo! Dentro da ilha!', 'Mixed text must survive conversion and nested islands')
    check(!idRoot.querySelector('script'), 'Props scripts must not render as children')

    const firstRoot = idRoot._reactRoot
    const mountsBeforeMove = window.rootMounts
    idRoot.remove()
    await new Promise((resolve) => setTimeout(resolve, 20))
    document.body.appendChild(idRoot)
    await wait()
    check(idRoot._reactRoot === firstRoot && window.rootMounts === mountsBeforeMove, 'DOM moves must preserve roots')

    idRoot.remove()
    await wait()
    await wait()
    check(!idRoot._reactRoot && window.rootCleanups === 1, 'ID root removal must clean up effects')
    document.body.appendChild(idRoot)
    await wait()
    check(idRoot._reactRoot && idRoot._reactRoot !== firstRoot, 'ID roots must remount on reinsertion')
    check(idRoot.textContent === 'Olá mundo! Dentro da ilha!', 'Remount must preserve original children')

    idRoot.remove()
    await wait()
    await wait()
    const replacementRoot = document.createElement('div')
    replacementRoot.id = 'legacy:root'
    replacementRoot.setAttribute('data-hydrate', 'eager')
    replacementRoot.textContent = 'Novo conteúdo'
    document.body.appendChild(replacementRoot)
    await wait()
    check(
      replacementRoot.querySelector('.root-probe') && replacementRoot.textContent === 'Novo conteúdo',
      'Dynamically inserted ID root must mount',
    )

    ctx.replacementRoot = replacementRoot
  },
})
