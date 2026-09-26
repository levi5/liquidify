'use react'

import { _Maybe, _match } from 'funcio'
import { useCallback, useContext, useEffect, useState } from 'preact/hooks'
import { memo } from 'preact/compat'
import type { Swiper } from 'swiper/types'
import classNames from 'classnames'

import { SwiperContext } from '../Root'

import type { SwiperComponentType } from '../../../../types/swiper'
import { type SwiperSlider, useSwiperSlider } from '../../../../hooks/useSwiperSlider'

import styles from '../styles.css'

const SwiperSliderArrowComponent = ({ children, className = '', enable, type, pointerEvents = 'auto', rewind = false, click }: SwiperComponentType.Arrow) => {
	const { getSliderDetails } = useSwiperSlider()
	const sliderRef = useContext(SwiperContext)
	const [state, setState] = useState<SwiperSlider.Datais>({
		size: 0,
		isEnd: false,
		isStart: true,
		isInfinite: false,
		slidesPerView: 0,
	})

	const swiperRef: Swiper | null = _Maybe.of(sliderRef)
		.map((sliderRef) => sliderRef.swiper)
		.getOrElse(null)

	const size: number | null = _Maybe.of(swiperRef)
		.map((swiper) => swiper?.slides.length ?? null)
		.getOrElse(null)

	const swiperReady = swiperRef !== null && size !== null && size > 0

	useEffect(() => {
		const refresh = () => {
			const data = getSliderDetails(sliderRef)
			setState((prevState) =>
				prevState.size === data.size &&
				prevState.isEnd === data.isEnd &&
				prevState.isStart === data.isStart &&
				prevState.isInfinite === data.isInfinite &&
				prevState.slidesPerView === data.slidesPerView
					? prevState
					: { ...prevState, ...data },
			)
		}
		refresh()

		const instance = swiperRef as unknown as {
			on?: (events: string, handler: () => void) => void
			off?: (events: string, handler: () => void) => void
			el?: HTMLElement
		} | null
		if (!instance?.on) return

		const events = [
			'slideChange',
			'slideChangeTransitionEnd',
			'transitionEnd',
			'toEdge',
			'fromEdge',
			'reachBeginning',
			'reachEnd',
			'resize',
			'breakpoint',
			'update',
		]
		events.forEach((event) => instance.on?.(event, refresh))

		const pollTimer = window.setInterval(() => {
			refresh()
			const data = getSliderDetails(sliderRef)
			if (data.size > 0 && data.size > data.slidesPerView && !data.isEnd) {
				window.clearInterval(pollTimer)
			}
		}, 100)
		window.setTimeout(() => window.clearInterval(pollTimer), 3000)

		return () => {
			events.forEach((event) => instance.off?.(event, refresh))
			window.clearInterval(pollTimer)
		}
	}, [sliderRef, swiperRef, size])

	const handleClick = useCallback(
		(event: MouseEvent, type: string) => {
			event.preventDefault()
			event.stopPropagation()

			if (!swiperReady || !swiperRef) return

			_match(type)
				.with('left', () => swiperRef.slidePrev())
				.with('right', () => swiperRef.slideNext())
				._(() => null)
				.exec()

			click?.()
			requestAnimationFrame(() => {
				setState(getSliderDetails(sliderRef))
			})
			window.setTimeout(() => {
				setState(getSliderDetails(sliderRef))
			}, 50)
		},
		[sliderRef, swiperReady, swiperRef],
	)

	if (!enable) return null
	if (!swiperReady) {
		return (
			<div style={{ pointerEvents }} className={classNames('arrows', className, {})}>
				<button
					type='button'
					style={{ pointerEvents }}
					className={classNames(
						'arrow',
						{ ['disabled']: true },
						'arrow-button',
					)}
					disabled
					aria-label={type === 'left' ? 'Anterior' : 'Próximo'}
				>
					{children}
				</button>
			</div>
		)
	}

	const hasMultipleSlides = size !== null && size > 1
	const isSizeWithinLimit = size !== null && state.slidesPerView > 0 && size <= state.slidesPerView
	const disabled = !swiperReady || !hasMultipleSlides || (type === 'right' ? state.isEnd : state.isStart) || isSizeWithinLimit
	const isDisabled = !rewind && !state.isInfinite && disabled

	return (
		<div style={{ pointerEvents }} className={classNames('arrows', className, {})}>
			<button
				type='button'
				style={{ pointerEvents }}
				className={classNames(
					'arrow',
					{
						['disabled']: isDisabled,
					},
					'arrow-button',
				)}
				disabled={isDisabled}
				aria-label={type === 'left' ? 'Anterior' : 'Próximo'}
				onClick={(event) => handleClick(event, type)}
			>
				{children}
			</button>
		</div>
	)
}

export const SwiperSliderArrow = memo(SwiperSliderArrowComponent)
