'use snippets'

import { t, money, escape, imageUrl, defaultValue } from 'liquidify'
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
						src={imageUrl(item.featured_image, {width: 700})}
						srcSet={`${imageUrl(item.featured_image, {width: 350})} 350w, ${imageUrl(item.featured_image, {width: 550})} 550w, ${imageUrl(item.featured_image, {width: 700})} 700w`}
						sizes='(max-width: 740px) 50vw, 25vw'
						alt={escape(defaultValue(item.featured_image.alt, item.title))}
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
						src={imageUrl(item.images[1], {width: 700})}
						srcSet={`${imageUrl(item.images[1], {width: 350})} 350w, ${imageUrl(item.images[1], {width: 550})} 550w, ${imageUrl(item.images[1], {width: 700})} 700w`}
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
					item.compare_at_price > item.price && <span className={classNames(styles['product-tag'])}>{t('products.product.sale')}</span>
				) : (
					<span className={classNames(styles['product-tag'], styles['sold-out'])}>{t('products.product.sold_out')}</span>
				)}

				<span className={classNames(styles['product-image-arrow'])} aria-hidden='true'>
					↗
				</span>
			</a>

			<div className={classNames(styles['product-info'])}>
				<div className={classNames(styles['product-info-top'])}>
				<span className={classNames(styles['product-type'])}>{t('products.product.essentials')}</span>
				<span className={classNames(styles['product-options-note'])}>
					{t('products.product.options_count', {count: variantCount})}
				</span>
				</div>

				<h3>
					<a href={item.url}>{escape(item.title)}</a>
				</h3>

				<div className={classNames(styles['product-prices'])}>
					<strong>
						{item.price_min !== item.price_max && <small>{t('products.product.from_price')}</small>}
						{money(item.price)}
					</strong>
					{item.compare_at_price > item.price && <s>{money(item.compare_at_price)}</s>}
				</div>

				{item.available ? (
					item.variants.size === 1 && item.requires_selling_plan !== true ? (
						<form action={routes.cart_add_url} method='post' data-quick-add>
							<input type='hidden' name='id' value='{{ item.variants.first.id }}' />
							<input type='hidden' name='quantity' value='1' />
							<button className={classNames(styles['card-buy-button'])} type='submit'>
								<RenderSnippet slot={ThemeIcon} name='bag' />
								<span>{t('products.product.add_to_bag')}</span>
								<span aria-hidden='true'>+</span>
							</button>
							<p className='quick-add-message' role='status'></p>
						</form>
					) : (
						<a className={classNames(styles['card-buy-button'])} href={item.url}>
							<RenderSnippet slot={ThemeIcon} name='bag' />
							<span>{t('products.product.choose_options')}</span>
							<span aria-hidden='true'>+</span>
						</a>
					)
				) : (
					<span className={classNames(styles['card-buy-button'], styles.unavailable)}>{t('products.product.unavailable')}</span>
				)}
			</div>
		</article>
	)
}
