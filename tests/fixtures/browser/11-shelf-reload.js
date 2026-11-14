window.scenarios.push({
  name: 'shelf-section-replacement',
  run: async () => {
    const section = document.createElement('section')
    section.id = 'shopify-section-shelf-reload'
    const markup = (label) => `
      <react-island component="SwiperSliderRoot" data-hydrate="eager">
        <react-island component="SwiperCarousel" data-hydrate="eager">
          <script type="application/json" data-react-props>{"pagination":true,"settings":{"slidesPerView":2,"loop":false}}</script>
          ${Array.from({ length: 8 }, (_, index) => `<article class="product-card">${label} ${index + 1}</article>`).join('')}
        </react-island>
      </react-island>`
    section.innerHTML = markup('Before')
    document.body.appendChild(section)
    await wait()
    const previous = section.querySelector('.swiper')?.swiper
    check(previous?.slides.length === 8, 'Inserted shelf must initialize all eight slides')

    const emit = (type) => section.dispatchEvent(new CustomEvent(`shopify:section:${type}`, { bubbles: true }))
    emit('unload')
    check(previous.destroyed, 'Section unload must destroy the old Swiper instance')
    section.innerHTML = markup('After')
    emit('load')
    await wait()
    const island = section.querySelector('react-island')
    const swiper = section.querySelector('.swiper')
    check(island?.getAttribute('data-react-hydrated') === 'true', 'Replacement shelf must hydrate')
    check(swiper?.classList.contains('swiper-initialized'), 'Replacement shelf must initialize Swiper')
    check(
      swiper?.swiper !== previous && swiper?.swiper?.slides.length === 8,
      'Replacement must create a fresh slider with all eight products',
    )
    check(section.querySelector('.product-card')?.textContent === 'After 1', 'Replacement must use fresh section content')
    check(section.querySelector('.swiper-pagination-bullet'), 'Replacement slider must render pagination')
    emit('unload')
    section.remove()
  },
})
