'use react'

import { useEffect } from 'preact/hooks'
import { rootUrl } from '../../lib/shopify'

export const RecommendationLoader = ({
  productId,
  sectionId,
}: {
  productId: number
  sectionId: string
  eager?: boolean
}) => {
  useEffect(() => {
    const container = document.getElementById(`RelatedProducts-${sectionId}`)
    const target = container?.querySelector('[data-related-grid]')
    if (!container || !target || !productId) return
    const controller = new AbortController()
    const load = async () => {
      const params = new URLSearchParams({
        section_id: sectionId,
        product_id: String(productId),
        limit: '4',
        intent: 'related',
      })
      try {
        const response = await fetch(`${rootUrl()}recommendations/products?${params}`, {
          signal: controller.signal,
        })
        if (!response.ok) return
        const html = new DOMParser().parseFromString(await response.text(), 'text/html')
        const incoming = html.querySelector('[data-related-grid]')
        if (
          incoming?.getAttribute('data-recommendations-state') === 'loaded' &&
          incoming.querySelector('.product-card') &&
          !controller.signal.aborted
        ) {
          target.replaceChildren(...Array.from(incoming.childNodes))
          target.setAttribute('data-recommendations-state', 'loaded')
        }
      } catch {
        // The collection-based recommendations remain available if the request fails.
      }
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          void load()
        }
      },
      { rootMargin: '400px' },
    )
    if (target.querySelector('.product-card')) observer.observe(container)
    else void load()
    return () => {
      observer.disconnect()
      controller.abort()
    }
  }, [productId, sectionId])
  return null
}
