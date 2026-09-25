'use snippets'

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
				<SwiperSliderArrow className={styles.arrowLeft} type='left' elementId={arrowLeftId} enable>
					<RenderSvg name='left-arrow.svg' />
				</SwiperSliderArrow>

				<SwiperCarousel id={elementId} variation='hero' elementId={slideId} settings={{ slidesPerView: 1, loop: true, autoplay: { delay: 4000 } }}>
					{blocks.map((block: any) => (
						<div className={styles.slide}>
							{block.settings.image ? (
								<img width='2000' height='700' src={'{{ block.settings.image | image_url: width: 2000 }}'} alt={'{{ block.settings.heading | default: "Banner" | escape }}'} />
							) : (
								<img width='2000' height='700' src={"{{ 'liquidify-editorial.jpg' | asset_url }}"} alt='Liquidify Collection' />
							)}
						</div>
					))}
				</SwiperCarousel>

				<SwiperSliderArrow className={styles.arrowRight} type='right' elementId={arrowRightId} enable>
					<RenderSvg name='right-arrow.svg' />
				</SwiperSliderArrow>
			</SwiperSliderRoot>
		</div>
	)
}
