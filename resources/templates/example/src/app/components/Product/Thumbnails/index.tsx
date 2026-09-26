'use react'

import { useContext } from 'preact/hooks'
import classNames from 'classnames'

import { SwiperCarousel } from '../../../components/Swiper/Slide'
import { SwiperContext } from '../../../components/Swiper/Root'

import { SwiperOptions } from 'swiper/types'
import { PRODUCT_THUMBNAILS_SLIDER_SETTINGS } from '../../../../settings/slider/product.settings'

import styles from './styles.css'

type ThumbnailImage = string | { src?: string | null; alt?: string | null }

const imageSrc = (image: ThumbnailImage): string => {
	if (typeof image === 'string') return image
	return image.src ?? ''
}

const imageAlt = (image: ThumbnailImage, fallback: string): string => {
	if (typeof image === 'string' || !image.alt) return fallback
	return image.alt
}

const sizedUrl = (src: string, width: number, height: number): string => {
	if (!src) return ''
	const separator = src.includes('?') ? '&' : '?'
	return `${src}${separator}width=${width}&height=${height}&crop=center`
}

export const Thumbnails = ({
	width = 120,
	height = 144,
	images,
	title,
	limit = 5,
	id = 'carousel-product',
}: {
	id?: string
	width?: number
	height?: number
	images: ThumbnailImage[]
	title: string
	limit?: number
}) => {
	const { index: activeIndex, swiper } = useContext(SwiperContext)

	const name = `${id}-thumbnails`
	const visible = images.slice(0, limit)

	const onSelect = (index: number) => {
		const target = swiper as unknown as { slideTo: (index: number) => void; slideToLoop?: (index: number) => void } | null
		if (!target) return
		if (target.slideToLoop) target.slideToLoop(index)
		else target.slideTo(index)
	}

	return (
		<div className={'thumbnails'}>
			<SwiperCarousel
				id={name}
				elementId={`${name}-slide`}
				settings={PRODUCT_THUMBNAILS_SLIDER_SETTINGS as SwiperOptions}
				activeIndex={activeIndex}
				register={false}
			>
				{visible.map((image, index) => {
					const src = sizedUrl(imageSrc(image), width, height)
					const alt = imageAlt(image, title)
					return (
						<button
							key={`${src}-${index}`}
							type='button'
							className={classNames('thumbnail', {
								['active']: index === activeIndex,
							})}
							aria-label={`${alt} ${index + 1}/${visible.length}`}
							aria-current={index === activeIndex}
							onClick={() => onSelect(index)}
						>
							<img width={width} height={height} alt={alt} src={src} loading='lazy' decoding='async' />
						</button>
					)
				})}
			</SwiperCarousel>
		</div>
	)
}
