window.scenarios.push({
  name: 'product-shelf-swiper',
  run: async () => {
    await wait()
    const island = document.querySelector('#product-shelf-test')
    const shelf = island?.querySelector('.product-shelf')
    const swiperElement = shelf?.querySelector('.swiper')
    const slides = shelf?.querySelectorAll('.swiper-slide') || []
    const next = swiperElement?.querySelector('.swiper-button-next')
    const pagination = swiperElement?.querySelector('.swiper-pagination')
    const bullet = pagination?.querySelector('.swiper-pagination-bullet')
    const expectedSlidesPerView = window.innerWidth >= 900 ? 4 : 2

    check(island?.hasAttribute('data-react-hydrated'), 'ProductShelf must hydrate')
    check(swiperElement?.classList.contains('swiper-initialized'), 'Swiper must initialize')
    check(slides.length === 5, 'ProductShelf must render every child as a slide')
    check(island?.querySelectorAll(':scope > .product-card').length === 0, 'ProductShelf must replace server children')
    check(next && pagination && bullet, 'Swiper must render navigation and pagination')
    check(swiperElement?.swiper?.params.slidesPerView === expectedSlidesPerView, 'Swiper must use responsive slidesPerView')
    check(getComputedStyle(swiperElement).overflow === 'hidden', 'Swiper base CSS must be global')
    check(getComputedStyle(pagination).position === 'static', 'ProductShelf pagination must stay below the slider')
    check(document.body.scrollWidth <= window.innerWidth + 1, 'ProductShelf must not overflow the mobile viewport')
  },
})
