'use react'

import { _Maybe } from 'funcio'
import { Autoplay, EffectFade, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { type FC, type ReactNode, Children } from 'preact/compat'
import { useContext, useEffect } from 'preact/hooks'

import { SwiperContext } from '../Root'

import type { SwiperComponentType } from '../../../../types/swiper'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/autoplay'
import 'swiper/css/effect-fade'
import '../styles.css'

const toCount = (value: string | number | undefined, fallback: number) => {
	const parsed = Number(value)

	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const SwiperCarousel: FC<
	{ elementId: string; children: ReactNode; variation?: string; activeIndex?: number; register?: boolean } & SwiperComponentType.Wrapper
> = ({
	id,
	direction = 'horizontal',
	children,
	activeIndex = undefined,
	register = true,
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
	const { setSwiper, swiper, setSwiperIndex } = useContext(SwiperContext) || {}

	const base = settings || {}
	const isFade = effect === 'fade'
	const desktop = isFade ? 1 : toCount(slidesPerView, Number(base.breakpoints?.[1024]?.slidesPerView) || Number(base.slidesPerView) || 1)
	const tablet = isFade ? 1 : toCount(slidesPerViewTablet, Number(base.breakpoints?.[680]?.slidesPerView) || desktop)
	const mobile = isFade ? 1 : toCount(slidesPerViewMobile, Number(base.slidesPerView) || tablet)
	const delay = toCount(autoplayDelay, 4000)
	const loop = Boolean((base as { loop?: unknown }).loop)

	const goTo = (target: { slideTo: (index: number) => void; slideToLoop?: (index: number) => void }, index: number) => {
		if (loop && target.slideToLoop) target.slideToLoop(index)
		else target.slideTo(index)
	}

	const breakpoint = (key: 680 | 1024, columns: number) => {
		const current = { ...base.breakpoints?.[key], slidesPerView: columns }

		return isFade ? { ...current, spaceBetween: 0 } : current
	}

	const params = {
		...base,
		...(effect ? { effect } : {}),
		slidesPerView: mobile,
		spaceBetween: isFade ? 0 : base.spaceBetween,
		breakpoints: {
			...base.breakpoints,
			680: breakpoint(680, tablet),
			1024: breakpoint(1024, desktop),
		},
	}

	const autoplayParams: Record<string, unknown> =
		autoplay === undefined
			? {}
			: {
					autoplay:
						autoplay === false ? false : { delay: toCount(autoplay === true ? undefined : autoplay, delay), disableOnInteraction: false },
					speed: base.speed ?? 420,
				}

	const paginationParams: Record<string, unknown> =
		pagination === undefined ? {} : { pagination: pagination === true ? { clickable: true } : pagination }

	useEffect(() => {
		if (swiper) {
			swiper.update()
		}
	}, [swiper, slides.length])

	useEffect(() => {
		if (activeIndex !== undefined && swiper) {
			goTo(swiper as unknown as Parameters<typeof goTo>[0], activeIndex)
		}
	}, [activeIndex, swiper, loop])

	return (
		<Swiper
			{...params}
			{...autoplayParams}
			{...paginationParams}
			{...props}
			id={elementId ?? id}
			className={className}
			modules={[Autoplay, Pagination, EffectFade]}
			direction={direction}
			onSwiper={(swiperInstance: typeof Swiper | null) => {
				if (register && setSwiper) {
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
