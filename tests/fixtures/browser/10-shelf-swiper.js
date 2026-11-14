window.scenarios.push({
  name: 'shelf-swiper',
  run: async () => {
    await wait()
    const shelf = document.querySelector('#product-shelf-test')
    const island = shelf?.querySelector('[component="SwiperSliderRoot"]')
    const swiperElement = shelf?.querySelector('.swiper')
    const slides = shelf?.querySelectorAll('.swiper-slide') || []
    const next = shelf?.querySelector('.arrow-right button')
    const pagination = swiperElement?.querySelector('.swiper-pagination')
    const bullet = pagination?.querySelector('.swiper-pagination-bullet')
    const expectedSlidesPerView = window.innerWidth >= 1024 ? 4 : window.innerWidth >= 680 ? 3 : 2

    check(island?.hasAttribute('data-react-hydrated'), 'Shelf slider root must hydrate')
    check(swiperElement?.classList.contains('swiper-initialized'), 'Swiper must initialize')
    check(slides.length === 8, 'Shelf must render every child as a slide')
    check(shelf?.querySelectorAll('[component="SwiperCarousel"] > .product-card').length === 0, 'Carousel must replace server children')
    check(next && pagination && bullet, 'Swiper must render navigation and pagination')
    check(swiperElement?.swiper?.params.slidesPerView === expectedSlidesPerView, 'Swiper must use responsive slidesPerView')
    check(getComputedStyle(swiperElement).overflow === 'hidden', 'Swiper base CSS must be global')
    check(document.body.scrollWidth <= window.innerWidth + 1, 'Shelf must not overflow the viewport')
    check(!next.disabled, 'Shelf next arrow must be enabled')
    next.click()
    await wait()
    check(swiperElement.swiper.activeIndex === 1, 'Shelf next arrow must advance the carousel')
  },
})
