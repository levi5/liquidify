'use react'

import { _Maybe } from 'funcio'
import { Autoplay, EffectFade, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperInstance } from 'swiper/types'
import { type FC, type ReactNode, Children } from 'preact/compat'
import { useContext, useEffect, useMemo, useState } from 'preact/hooks'

import { SwiperContext } from '../Root'

import type { SwiperComponentType } from '../../../../types/swiper'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/autoplay'
import 'swiper/css/effect-fade'
import '../styles.css'

type SlideChild = Exclude<Parameters<typeof SwiperSlide>[0]['children'], (...args: never[]) => unknown>

const toCount = (value: string | number | undefined, fallback: number) => {
	const parsed = Number(value)

	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const toSlidesPerView = (value: string | number | undefined, fallback: number | 'auto'): number | 'auto' => {
	if (value === 'auto') return 'auto'
	const parsed = Number(value)

	if (Number.isFinite(parsed) && parsed > 0) return parsed
	return fallback
}

const baseSlidesPerView = (value: unknown, fallback: number | 'auto'): number | 'auto' => {
	if (value === 'auto') return 'auto'
	const parsed = Number(value)

	if (Number.isFinite(parsed) && (parsed as number) > 0) return parsed as number
	return fallback
}

export const SwiperCarousel: FC<
	{
		elementId: string
		children: ReactNode
		variation?: string
		activeIndex?: number
		register?: boolean
		loop?: boolean
	} & SwiperComponentType.Wrapper
> = ({
	id,
	direction,
	children,
	activeIndex = undefined,
	register = true,
	loop = undefined,
	settings,
	className,
	elementId,
	slidesPerView,
	slidesPerViewTablet,
	slidesPerViewMobile,
	autoplay,
	autoplayDelay,
	effect,
	pagination,
	...props
}) => {
	const slides = (Children.toArray(children) as unknown[]).filter(
		(child) => typeof child !== 'string' || child.trim() !== '',
	) as ReactNode[]
	const { setSwiper } = useContext(SwiperContext) || {}
	const [localSwiper, setLocalSwiper] = useState<SwiperInstance | null>(null)

	const isFade = effect === 'fade'
	const delay = toCount(autoplayDelay, 4000)
	const loopMode = loop ?? Boolean((settings as { loop?: unknown })?.loop)

	const params = useMemo(() => {
		const base = (settings || {}) as Record<string, any>
		const baseBreakpoints = (base.breakpoints || {}) as Record<number, Record<string, any>>
		const fallbackDesktop = baseSlidesPerView(baseBreakpoints?.[1024]?.slidesPerView ?? base.slidesPerView, 1)
		const desktop = isFade ? 1 : toSlidesPerView(slidesPerView, fallbackDesktop)
		const tablet = isFade ? 1 : toSlidesPerView(slidesPerViewTablet, baseSlidesPerView(baseBreakpoints?.[680]?.slidesPerView, desktop))
		const mobile = isFade ? 1 : toSlidesPerView(slidesPerViewMobile, baseSlidesPerView(base.slidesPerView, tablet))

		const breakpoint = (key: 680 | 1024, columns: number | 'auto') => {
			const current = { ...baseBreakpoints?.[key] }
			if (slidesPerView !== undefined || current.slidesPerView === undefined) {
				current.slidesPerView = columns
			}
			if (key === 680 && slidesPerViewTablet !== undefined) current.slidesPerView = toSlidesPerView(slidesPerViewTablet, columns)
			if (key === 1024 && slidesPerView !== undefined) current.slidesPerView = toSlidesPerView(slidesPerView, columns)
			return isFade ? { ...current, spaceBetween: 0 } : current
		}

		return {
			...base,
			...(effect ? { effect } : {}),
			direction: direction ?? base.direction ?? 'horizontal',
			slidesPerView: mobile,
			spaceBetween: isFade ? 0 : base.spaceBetween,
			breakpoints: {
				...baseBreakpoints,
				680: breakpoint(680, tablet),
				1024: breakpoint(1024, desktop),
			},
		}
	}, [settings, effect, direction, slidesPerView, slidesPerViewTablet, slidesPerViewMobile, isFade])

	const autoplayParams: Record<string, unknown> = useMemo(() => {
		const base = settings || {}
		if (autoplay === undefined) return {}
		return {
			autoplay: autoplay === false ? false : { delay: toCount(autoplay === true ? undefined : autoplay, delay), disableOnInteraction: false },
			speed: base.speed ?? 420,
		}
	}, [autoplay, autoplayDelay, delay, settings])

	const paginationParams: Record<string, unknown> = useMemo(() => {
		if (pagination === undefined) return {}
		return { pagination: pagination === true ? { clickable: true } : pagination }
	}, [pagination])

	useEffect(() => {
		if (localSwiper) {
			localSwiper.update()
		}
		const handleResize = () => localSwiper?.update()
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [localSwiper, slides.length])

	useEffect(() => {
		if (activeIndex === undefined || !localSwiper) return
		const instance = localSwiper as unknown as { realIndex: number; animating: boolean; slideTo: (i: number) => void; slideToLoop?: (i: number) => void }
		if (instance.realIndex === activeIndex || instance.animating) return
		if (loopMode && instance.slideToLoop) instance.slideToLoop(activeIndex)
		else instance.slideTo(activeIndex)
	}, [activeIndex, localSwiper, loopMode])

	return (
		<Swiper
			{...params}
			{...autoplayParams}
			{...paginationParams}
			{...props}
			id={elementId ?? id}
			className={className}
			modules={[Autoplay, Pagination, EffectFade]}
			direction={(params as { direction?: 'horizontal' | 'vertical' }).direction ?? 'horizontal'}
			loop={loopMode}
			onSwiper={(swiperInstance: SwiperInstance) => {
				setLocalSwiper(swiperInstance)
				if (register && setSwiper) {
					setSwiper(swiperInstance)
				}
			}}
		>
			{slides.map((child: ReactNode, index: number) => (
				<SwiperSlide key={index}>{child as unknown as SlideChild}</SwiperSlide>
			)) as unknown as SlideChild}
		</Swiper>
	)
}
