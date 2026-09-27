'use snippets'

import { RenderSvg } from 'liquidex'
import classNames from 'classnames'

import type { ProductPreviewType } from '../../../../types/components/product'

import { SwiperSliderRoot } from '../../Swiper/Root'
import { SwiperCarousel } from '../../Swiper/Slide'
import { SwiperSliderArrow } from '../../Swiper/Arrow'
import { Thumbnails } from '../Thumbnails'

import { PRODUCT_PREVIEW_SLIDER_SETTINGS } from '../../../../settings/slider/product.settings'

import styles from './styles.css'

export const ProductPreview = ({ id, title, images }: ProductPreviewType) => {
	const galleryId = `product-gallery-${id}`
	const slideId = `${galleryId}-slide`
	const arrowId = `${galleryId}-arrow`
	const arrowLeftId = `${arrowId}-left`
	const arrowRightId = `${arrowId}-right`
	const loopGallery = images.length > 1 ? true : false

	return (
		<>
			{images && images.length > 0 ? (
			<SwiperSliderRoot elementId={galleryId}>
					<div
						className={
							images.length > 1
								? styles['product-gallery']
								: classNames(styles['product-gallery'], styles['product-gallery-single'])
						}
					>
						{images.length > 1 && (
							<div className={classNames(styles['product-thumbs'])}>
								<Thumbnails id={galleryId} images={images} title={title} />
							</div>
						)}

						<div className={classNames(styles['product-main'])}>
							{images.length > 1 && (
								<SwiperSliderArrow
									className={styles.galleryArrowLeft}
									type='left'
									id={arrowId}
									elementId={arrowLeftId}
									enable
									rewind
								>
									<RenderSvg name='left-arrow.svg' />
								</SwiperSliderArrow>
							)}

							<SwiperCarousel elementId={slideId} settings={PRODUCT_PREVIEW_SLIDER_SETTINGS} loop={loopGallery} pagination={true}>
								{images.map((photo, index) => (
									<img
										src='{{ photo | image_url: width: 1200 }}'
										srcSet='{{ photo | image_url: width: 600 }} 600w, {{ photo | image_url: width: 900 }} 900w, {{ photo | image_url: width: 1200 }} 1200w'
										sizes='(max-width: 990px) 100vw, 50vw'
										alt='{{ photo.alt | default: product.title | escape }}'
										width='1000'
										height='1200'
										loading={index === 0 ? 'eager' : 'lazy'}
										fetchpriority={index === 0 ? 'high' : 'auto'}
										decoding='async'
									/>
								))}
							</SwiperCarousel>

							{images.length > 1 && (
								<SwiperSliderArrow
									className={styles.galleryArrowRight}
									type='right'
									id={arrowId}
									elementId={arrowRightId}
									enable
									rewind
								>
									<RenderSvg name='right-arrow.svg' />
								</SwiperSliderArrow>
							)}
						</div>
					</div>
				</SwiperSliderRoot>
			) : (
				<div className='product-placeholder'>✳</div>
			)}
		</>
	)
}
