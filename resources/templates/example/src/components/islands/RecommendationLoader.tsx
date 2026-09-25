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
        limit: '8',
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

      }
    }
    void load()
    return () => controller.abort()
  }, [productId, sectionId])
  return null
}
