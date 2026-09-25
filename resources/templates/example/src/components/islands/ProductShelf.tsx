'use react'

import { Children, isValidElement } from 'preact/compat'
import type { ComponentChildren } from 'preact'
import { A11y, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import './ProductShelf.css'

export const ProductShelf = ({ children }: { children?: ComponentChildren; eager?: boolean }) => {
  const slides = Children.toArray(children).filter(isValidElement)

  return (
    <div className="product-shelf">
      <Swiper
        modules={[Navigation, Pagination, A11y]}
        slidesPerView={2}
        spaceBetween={14}
        navigation
        pagination={{ clickable: true }}
        breakpoints={{ 900: { slidesPerView: 4, spaceBetween: 22 } }}
        watchOverflow
        grabCursor
        loop={false}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>{slide}</SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
