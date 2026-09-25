'use snippets'

import classNames from 'classnames'

import type { ProductPreviewType } from '../../../../types/components/product'

import styles from './styles.css'

export const ProductPreview = ({ title, images }: ProductPreviewType) => {
	return (
		<>
			{images && images.length > 0 ? (
				<a className={classNames(styles['main-product-image'])} href={'{{ product.featured_image | image_url: width: 2000 }}'} target='_blank' rel='noopener'>
					<img
						id='ProductMainImage'
						src={'{{ product.featured_image | image_url: width: 1200 }}'}
						alt={'{{ product.featured_image.alt | default: product.title | escape }}'}
						width='1000'
						height='1200'
						fetchpriority='high'
					/>
				</a>
			) : (
				<div className='product-placeholder'>✳</div>
			)}

			{images && images.length > 1 && (
				<div className={classNames(styles['product-thumbnails'])}>
					{images.map((photo) => (
						<a href={'{{ photo | image_url: width: 2000 }}'} data-product-thumbnail={'{{ photo | image_url: width: 1200 }}'}>
							<img src={'{{ photo | image_url: width: 200 }}'} alt={'{{ photo.alt | default: product.title | escape }}'} width='120' height='144' loading='lazy' />
						</a>
					))}
				</div>
			)}
		</>
	)
}
