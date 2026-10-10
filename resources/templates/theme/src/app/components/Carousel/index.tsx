'use snippets'

import { imageUrl, assetUrl, escape, defaultValue } from 'liquidify'
import { RenderSvg } from 'liquidex'

import { SwiperSliderArrow } from '../Swiper/Arrow'
import { SwiperCarousel } from '../Swiper/Slide'
import { SwiperSliderRoot } from '../Swiper/Root'

import styles from './styles.css'

export const Carousel = ({ blocks, elementId = 'home-banner-hero' }: { blocks: any; elementId?: string }) => {
	const rootId = `carousel-${elementId}`
	const slideId = `carousel-${elementId}-slide`
	const arrowLeftId = `carousel-${elementId}-arrow-left`
	const arrowRightId = `carousel-${elementId}-arrow-right`

	return (
		<div className={styles.carousel}>
			<SwiperSliderRoot elementId={rootId}>
				<SwiperSliderArrow className={styles.arrowLeft} type='left' elementId={arrowLeftId} enable rewind>
					<RenderSvg name='left-arrow.svg' />
				</SwiperSliderArrow>

				<SwiperCarousel
					id={elementId}
					variation='hero'
					elementId={slideId}
					effect='fade'
					settings={{ slidesPerView: 1, loop: false, rewind: true, speed: 600, autoplay: { delay: 4000 } }}
				>
					{blocks.map((block: any) => (
						<div className={styles.slide}>
						{block.settings.image ? (
							<img width='2000' height='700' loading='lazy' decoding='async' src={imageUrl(block.settings.image, {width: 2000})} alt={escape(defaultValue(block.settings.heading, 'Banner'))} />
						) : (
							<img width='2000' height='700' loading='lazy' decoding='async' src={assetUrl('liquidify-editorial.jpg')} alt={escape(defaultValue(block.settings.heading, 'Banner'))} />
						)}
						</div>
					))}
				</SwiperCarousel>

				<SwiperSliderArrow className={styles.arrowRight} type='right' elementId={arrowRightId} enable rewind>
					<RenderSvg name='right-arrow.svg' />
				</SwiperSliderArrow>
			</SwiperSliderRoot>
		</div>
	)
}
