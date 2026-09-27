'use snippets'

import { RenderSnippet } from 'liquidex'
import classNames from 'classnames'

import { ThemeIcon } from '../Icon'
import { Badges } from '../Badges'

import styles from './styles.css'

export const Card = ({ item }: { item: any }) => {

	const variantCount = item.variants ? item.variants.size : 0

	return (
		<article className={classNames(styles['product-card'])}>
			<a className={classNames(styles['product-image-link'])} href={item.url}>
				{item.featured_image ? (
					<img
						className={classNames(styles['product-primary-image'])}
						src='{{ item.featured_image | image_url: width: 700 }}'
						srcSet='{{ item.featured_image | image_url: width: 350 }} 350w, {{ item.featured_image | image_url: width: 550 }} 550w, {{ item.featured_image | image_url: width: 700 }} 700w'
						sizes='(max-width: 740px) 50vw, 25vw'
						alt='{{ item.featured_image.alt | default: item.title | escape }}'
						loading='lazy'
						decoding='async'
						width='700'
						height='880'
					/>
				) : (
					<div className='product-placeholder' aria-hidden='true'>
						LQ.
					</div>
				)}

				{item.images && item.images.size > 1 && (
					<img
						className={classNames(styles['product-secondary-image'])}
						src='{{ item.images[1] | image_url: width: 700 }}'
						srcSet='{{ item.images[1] | image_url: width: 350 }} 350w, {{ item.images[1] | image_url: width: 550 }} 550w, {{ item.images[1] | image_url: width: 700 }} 700w'
						sizes='(max-width: 740px) 50vw, 25vw'
						alt=''
						aria-hidden='true'
						width='700'
						height='880'
						loading='lazy'
						decoding='async'
					/>
				)}

				<RenderSnippet slot={Badges} badges={item.metafields.custom.product_badges.value} />

				{item.available ? (
					item.compare_at_price > item.price && <span className={classNames(styles['product-tag'])}>{"'products.product.sale' | t"}</span>
				) : (
					<span className={classNames(styles['product-tag'], styles['sold-out'])}>{"'products.product.sold_out' | t"}</span>
				)}

				<span className={classNames(styles['product-image-arrow'])} aria-hidden='true'>
					↗
				</span>
			</a>

			<div className={classNames(styles['product-info'])}>
				<div className={classNames(styles['product-info-top'])}>
					<span className={classNames(styles['product-type'])}>{"'products.product.essentials' | t"}</span>
					<span className={classNames(styles['product-options-note'])}>
						{"'products.product.options_count' | t: count: variantCount"}
					</span>
				</div>

				<h3>
					<a href={item.url}>{'item.title | escape'}</a>
				</h3>

				<div className={classNames(styles['product-prices'])}>
					<strong>
						{item.price_min !== item.price_max && <small>{"'products.product.from_price' | t"}</small>}
						{'item.price | money'}
					</strong>
					{item.compare_at_price > item.price && <s>{'item.compare_at_price | money'}</s>}
				</div>

				{item.available ? (
					item.variants.size === 1 && item.requires_selling_plan !== true ? (
						<form action={routes.cart_add_url} method='post' data-quick-add>
							<input type='hidden' name='id' value='{{ item.variants.first.id }}' />
							<input type='hidden' name='quantity' value='1' />
							<button className={classNames(styles['card-buy-button'])} type='submit'>
								<RenderSnippet slot={ThemeIcon} name='bag' />
								<span>{"'products.product.add_to_bag' | t"}</span>
								<span aria-hidden='true'>+</span>
							</button>
							<p className='quick-add-message' role='status'></p>
						</form>
					) : (
						<a className={classNames(styles['card-buy-button'])} href={item.url}>
							<RenderSnippet slot={ThemeIcon} name='bag' />
							<span>{"'products.product.choose_options' | t"}</span>
							<span aria-hidden='true'>+</span>
						</a>
					)
				) : (
					<span className={classNames(styles['card-buy-button'], styles.unavailable)}>{"'products.product.unavailable' | t"}</span>
				)}
			</div>
		</article>
	)
}
