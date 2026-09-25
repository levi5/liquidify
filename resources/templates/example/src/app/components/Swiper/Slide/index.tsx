'use react'

import { _Maybe } from 'funcio'
import { Autoplay, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { type FC, type ReactNode, Children } from 'preact/compat'
import { useContext, useEffect } from 'preact/hooks'

import { SwiperContext } from '../Root'

import type { SwiperComponentType } from '../../../../types/swiper'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/autoplay'
import '../styles.css'

export const SwiperCarousel: FC<{ elementId: string; children: ReactNode; variation?: string; activeIndex?: number } & SwiperComponentType.Wrapper> = ({
	id,
	direction = 'horizontal',
	children,
	activeIndex = undefined,
	settings,
	className,
	elementId,
	...props
}) => {
	// A liquid section renders its children with newlines/indentation between them, and
	// those whitespace text nodes reach us as string children. Every child becomes a
	// slide, so leaving them in produces blank slides that break the layout — Swiper
	// then sizes `slidesPerView` against mostly-empty slides.
	const slides = (Children.toArray(children) as unknown[]).filter(
		(child) => typeof child !== 'string' || child.trim() !== '',
	) as ReactNode[]
	const { setSwiper, swiper, setSwiperIndex } = useContext(SwiperContext) || {}

	useEffect(() => {
		if (swiper) {
			swiper.update()
		}
	}, [swiper, slides.length])

	useEffect(() => {
		if (activeIndex !== undefined && swiper) {
			;(swiper as typeof Swiper).slideTo(activeIndex)
		}
	}, [activeIndex, swiper])

	return (
		<Swiper
			{...settings}
			{...props}
			id={elementId ?? id}
			className={className}
			modules={[Autoplay, Pagination]}
			direction={direction}
			onSwiper={(swiperInstance: typeof Swiper | null) => {
				if (setSwiper) {
					setSwiper(swiperInstance)
				}
			}}
			onSlideChange={(swiper: typeof Swiper | null) => {
				const realIndex = _Maybe
					.of(swiper)
					.map((swiper) => swiper.realIndex)
					.map((realIndex) => realIndex)
					.getOrElse(0)

				setSwiperIndex(realIndex)
			}}
		>
			{slides.map((child: ReactNode, index: number) => (
				<SwiperSlide key={index}>{child}</SwiperSlide>
			))}
		</Swiper>
	)
}
