window.scenarios.push({
  name: 'readiness',
  run: async () => {
    const originalAdd = document.addEventListener
    const originalRemove = document.removeEventListener
    const readyListeners = new Map()
    const countReadyListeners = () => [...readyListeners.values()].reduce((total, listeners) => total + listeners.size, 0)
    const trackedEvents = ['liquidify:ready:DetachedProbe', 'liquidx:ready:DetachedProbe']
    document.addEventListener = function (type, listener, options) {
      if (trackedEvents.includes(type)) {
        if (!readyListeners.has(type)) readyListeners.set(type, new Set())
        readyListeners.get(type).add(listener)
      }
      return originalAdd.call(this, type, listener, options)
    }
    document.removeEventListener = function (type, listener, options) {
      if (trackedEvents.includes(type)) readyListeners.get(type)?.delete(listener)
      return originalRemove.call(this, type, listener, options)
    }

    const detachedProbe = document.createElement('react-island')
    detachedProbe.setAttribute('component', 'DetachedProbe')
    for (let index = 0; index < 3; index++) {
      document.body.appendChild(detachedProbe)
      check(countReadyListeners() === 2, 'Connection must install both readiness listeners')
      detachedProbe.remove()
      check(countReadyListeners() === 0 && !detachedProbe._liquidifyReadyCleanup, 'Detachment must remove readiness listeners immediately')
    }

    let detachedMounts = 0
    window.LiquidifyHydrate.DetachedProbe = () => {
      detachedMounts++
    }
    for (const type of trackedEvents) document.dispatchEvent(new CustomEvent(type))
    check(detachedMounts === 0, 'Detached islands must not mount on readiness')

    document.body.appendChild(detachedProbe)
    check(detachedMounts === 1 && countReadyListeners() === 0, 'Reconnected island must mount once with no stale listeners')
    detachedProbe.remove()

    document.addEventListener = originalAdd
    document.removeEventListener = originalRemove
  },
})
