'use react'

import { _Maybe, _match } from 'funcio'
import { useCallback, useContext, useEffect, useState } from 'preact/hooks'
import { memo } from 'preact/compat'
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
		isEnd: true,
		isStart: true,
		isInfinite: false,
		slidesPerView: 0,
	})

	const swiperRef = _Maybe
		.of(sliderRef)
		.map((sliderRef) => sliderRef.swiper)
		.map((swiper) => swiper)
		.getOrElse(null)

	const size = _Maybe
		.of(swiperRef)
		.map((swiperRef) => swiperRef.slides)
		.map((slides) => slides.length)
		.getOrElse(null)

	useEffect(() => {
		const data = getSliderDetails(sliderRef)

		setState((prevState) => ({ ...prevState, ...data }))
	}, [sliderRef, swiperRef, size])

	const handleClick = useCallback(
		(event: MouseEvent, type: string) => {
			event.preventDefault()
			event.stopPropagation()

			if (!swiperRef) return

			_match(type)
				.with('left', () => swiperRef.slidePrev())
				.with('right', () => swiperRef.slideNext())
				._(() => null)
				.exec()

			click?.()
			setState(getSliderDetails(sliderRef))
		},
		[sliderRef],
	)

	if (!enable || size <= 1) return null

	const isSizeWithinLimit = size !== null && state.slidesPerView > 0 && size <= state.slidesPerView
	const disabled = (type === 'right' && state.isEnd) || (type === 'left' && state.isStart) || isSizeWithinLimit

	return (
		<div style={{ pointerEvents }} className={classNames('arrows', className, {})} aria-hidden={disabled}>
			<button
				type='button'
				style={{ pointerEvents }}
				className={classNames(
					'arrow',
					{
						['disabled']: !rewind && disabled && !state.isInfinite,
					},
					'arrow-button',
				)}
				disabled={!rewind && disabled && !state.isInfinite}
				aria-label={type === 'left' ? 'Anterior' : 'Próximo'}
				onClick={(event) => handleClick(event, type)}
			>
				{children}
			</button>
		</div>
	)
}

export const SwiperSliderArrow = memo(SwiperSliderArrowComponent)
