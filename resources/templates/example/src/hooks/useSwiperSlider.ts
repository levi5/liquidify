import { _Maybe } from 'funcio'
import { RefObject, createRef } from 'preact'
import { ReactNode } from 'preact/compat'
import { useCallback, useRef } from 'preact/hooks'
import type { SwiperRef } from 'swiper/react'
import type { Swiper } from 'swiper/types'
import type { SwiperContextType } from '../app/components/Swiper/Root'

export namespace SwiperSlider {
	export type Datais = {
		size: number
		isEnd: boolean
		isStart: boolean
		isInfinite: boolean
		slidesPerView: number
	}
}

export const useSwiperSlider = () => {
	const getClientSlidesForCarousel = (originalSlides: ReactNode[], slidesPerView: number, normalizeSlider: boolean): ReactNode[] => {
		if (!normalizeSlider) return originalSlides
		const totalSlides = originalSlides.length

		const clonedSlidesToShow = slidesPerView * 2

		const clonedArray = totalSlides % 2 !== 0 ? [...originalSlides, originalSlides[0]] : [...originalSlides]

		while (clonedArray.length < clonedSlidesToShow) {
			const remainingClones = clonedSlidesToShow - clonedArray.length

			clonedArray.push(...clonedArray.slice(0, remainingClones))
		}

		return clonedArray
	}

	const getSliderDetails = useCallback((sliderRef: SwiperContextType | null) => {
		const swiper: Swiper | null = _Maybe.of(sliderRef)
			.map((sliderRef) => sliderRef?.swiper ?? null)
			.getOrElse(null)

		const size: number = _Maybe.of(swiper)
			.map((swiper) => swiper?.slides.length ?? 0)
			.getOrElse(0)

		const isEnd: boolean = _Maybe.of(swiper)
			.map((swiper) => swiper?.isEnd ?? false)
			.getOrElse(false)

		const isStart: boolean = _Maybe.of(swiper)
			.map((swiper) => swiper?.activeIndex === 0)
			.getOrElse(false)

		const isInfinite: boolean = _Maybe.of(swiper)
			.map((swiper) => (swiper?.loopedSlides ?? 0) > 0)
			.getOrElse(false)

		const slidesPerView: number = _Maybe.of(swiper)
			.map((swiper) => Number(swiper?.params.slidesPerView) || 0)
			.getOrElse(0)

		return {
			slidesPerGroup: slidesPerView,
			slidesPerView,
			isStart,
			isEnd,
			isInfinite,
			size,
			swiper,
		}
	}, [])

	return { getClientSlidesForCarousel, getSliderDetails }
}

export const useSwiperSliderRefs = ({ size }: { size: number }) => {
	const sliderRefs = useRef<Array<RefObject<SwiperRef>>>(Array.from({ length: size }, () => createRef<SwiperRef>()))

	const getRef = useCallback((index: number) => {
		if (!sliderRefs.current || index < 0 || index >= size) return null

		return sliderRefs.current[index]
	}, [])

	return {
		sliderRefs,
		getRef,
	}
}
