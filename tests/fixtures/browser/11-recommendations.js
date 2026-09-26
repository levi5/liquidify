window.scenarios.push({
  name: 'recommendation-swiper',
  run: async () => {
    await wait()
    await wait()
    const section = document.querySelector('#RelatedProducts-recommendation-test')
    const target = section?.querySelector('[data-related-grid]')
    const island = target?.querySelector('react-island')
    const swiper = target?.querySelector('.swiper')
    const slides = target?.querySelectorAll('.swiper-slide') || []
    const request = window.requests.find((entry) => entry.url.includes('/recommendations/products'))

    check(target?.getAttribute('data-recommendations-state') === 'loaded', 'RecommendationLoader must apply the loaded section')
    check(island?.getAttribute('data-react-hydrated') === 'true', 'Recommendation ProductShelf must hydrate after replacement')
    check(swiper?.classList.contains('swiper-initialized'), 'Recommendation ProductShelf must initialize Swiper')
    check(slides.length === 8, 'RecommendationLoader must request and render more than four products')
    check(
      target?.querySelector('.swiper-button-next') && target?.querySelector('.swiper-pagination'),
      'Recommendation slider must render controls',
    )
    check(request?.url.includes('limit=8'), 'RecommendationLoader must request eight products')
  },
})
