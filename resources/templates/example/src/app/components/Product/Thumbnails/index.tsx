'use react'

import { useContext } from 'preact/hooks'
import classNames from 'classnames'

import { SwiperCarousel } from '../../../components/Swiper/Slide'
import { SwiperContext, SwiperSliderRoot } from '../../../components/Swiper/Root'

import { SwiperOptions } from 'swiper/types'
import { PRODUCT_THUMBNAILS_SLIDER_SETTINGS } from '../../../../settings/slider/product.settings'

import styles from './styles.css'

export const Thumbnails = ({
	width,
	height,
	images,
	title,
	id = 'carousel-product',
}: {
	id?: string
	width?: string | number
	height?: string | number
	images: string[]
	title: string
}) => {
	const { index: activeIndex, swiper } = useContext(SwiperContext)

	const name = `${id}-thumbnails`

	const onSlideChange = (index: number) => {
		if (!swiper) return
		swiper.slideTo(index)
	}

	return (
		<div className={'thumbnails'}>
			<SwiperSliderRoot elementId={name}>
				<SwiperCarousel id={name} elementId={`${name}-slide`} settings={PRODUCT_THUMBNAILS_SLIDER_SETTINGS as SwiperOptions} activeIndex={activeIndex}>
					{images.slice(0, 5).map((src, index) => {
						return (
							<div
								key={src}
								className={classNames('thumbnail', {
									['active']: index === activeIndex,
								})}
							>
								<img
									onClick={() => onSlideChange(index)}
									width={width}
									height={height}
									id='product-thumbnail'
									alt={title}
									src={`${src}&width=${width}&height=${height}&crop=center`}
								/>
							</div>
						)
					})}
				</SwiperCarousel>
			</SwiperSliderRoot>
		</div>
	)
}
