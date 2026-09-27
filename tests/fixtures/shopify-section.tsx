import { useLayoutEffect, useState } from 'preact/hooks'
import { LiquidifyEvents, registerLiquidifyAction } from 'liquidify/runtime'

export function ShopifyProbe({ label }) {
  const [clicks, setClicks] = useState(0)
  useLayoutEffect(() => {
    window.sectionMounts = (window.sectionMounts || 0) + 1
    const unsubscribe = LiquidifyEvents.on('section:ping', () => {
      window.sectionPings = (window.sectionPings || 0) + 1
    })
    const unregister = registerLiquidifyAction('section-action', () => {})
    const timer = setInterval(() => {
      window.sectionTicks = (window.sectionTicks || 0) + 1
    }, 20)
    return () => {
      unsubscribe()
      unregister()
      clearInterval(timer)
      window.sectionCleanups = (window.sectionCleanups || 0) + 1
    }
  }, [])
  return (
    <button className='section-counter' onClick={() => setClicks(clicks + 1)}>
      {label}: {clicks}
    </button>
  )
}
