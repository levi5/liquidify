'use sections'

import { t, escape, money, json } from 'liquidify'
import { RenderSnippet, Raw } from 'liquidex'
import classNames from 'classnames'

import { ProductPreview } from '../../components/Product/Preview'
import { BaseBox } from '../../components/Base/Box'
import { QuantitySelector } from '../../components/Quantity/Selector'
import { Selector } from '../../components/Selector'
import { Breadcrumb } from '../../components/Breadcrumb'

import { PRODUCT_INFO_SCHEMA } from '../../../schemas/ProductInfo/product-info.schema'

import { ProductProvider } from '../../context/Product'
import { ToastHost } from '../../components/Toast'

import styles from './styles.css'

export const ProductInfo = () => {
	const blocks = section.blocks

	return (
		<section className={classNames(styles['product-detail'], 'container', 'section-space')}>
			<ToastHost position='bottom-left' />

			<RenderSnippet slot={Breadcrumb} className='' />

			<div className={classNames(styles['product-detail-grid'])}>
				<div className={classNames(styles['product-gallery-wrapper'])}>
					<RenderSnippet slot={ProductPreview} id={product.id} title={product.title} images={product.images} />
				</div>

				<div className={classNames(styles['product-detail-copy'])}>
				<p className='eyebrow'>{escape(product.vendor)}</p>
				<h1>{escape(product.title)}</h1>
				<p className={classNames(styles['product-intro'])}>{t('products.product.intro')}</p>

				<liquid-data data-liquid-store={json(product)}>
					<ProductProvider elementId='product-provider' selectFirstVariant={false} store={product}>
						<p className={classNames(styles['detail-price'])} data-product-price>
							{money(product.selected_or_first_available_variant.price)}
						</p>
						<p className={classNames(styles['detail-compare-price'])} data-product-compare-price hidden>
							{money(product.selected_or_first_available_variant.compare_at_price)}
						</p>

							{blocks?.map((block) => {
								const { variation, mode } = block.settings

								return (
									block.type === 'variation' && (
										<RenderSnippet slot={Selector} mode={mode} variation={variation} options={product.options_with_values} />
									)
								)
							})}

							<div className={classNames(styles['purchase-actions'])}>
								<div className={classNames(styles['quantity-field'])}>
									<label htmlFor='Quantity'>{t('products.product.quantity')}</label>
									<QuantitySelector id='Quantity' name='quantity' />
								</div>

								<button type='button' className={classNames('button', 'button-dark', styles['product-add-button'])} data-product-add-to-cart='true'>
									{t('products.product.add_to_bag')}
									<span aria-hidden='true'>↗</span>
								</button>
							</div>
						</ProductProvider>
					</liquid-data>

					<div className={classNames(styles['purchase-note'])}>
						<span aria-hidden='true'>↗</span>
						<span>
							{t('products.product.shipping_note')}
							<br />
							{t('products.product.secure_note')}
						</span>
					</div>

					{blocks?.map((block) => {
						return (
							block.type === 'benefits' && (
								<RenderSnippet
									slot={BaseBox}
									text={block.settings.text}
									background_color={block.settings.background_color}
									text_color={block.settings.text_color}
									padding_top={block.settings.padding_top}
									padding_right={block.settings.padding_right}
									padding_bottom={block.settings.padding_bottom}
									padding_left={block.settings.padding_left}
									border_radius={block.settings.border_radius}
									className={styles.benefit}
								/>
							)
						)
					})}

					<details className={classNames(styles['product-accordion'])} open>
						<summary>
							{t('products.product.about')} <span>+</span>
						</summary>
						<div className='rich-text'>
							<Raw html={product.description} />
						</div>
					</details>

					<details className={classNames(styles['product-accordion'])}>
						<summary>
							{t('products.product.shipping_returns')} <span>+</span>
						</summary>
						<div className='rich-text'>
						<p>{t('products.product.shipping_text')}</p>
						{shop.shipping_policy && <a href={shop.shipping_policy.url}>{t('products.product.shipping_policy')}</a>}
						{shop.refund_policy && <a href={shop.refund_policy.url}>{t('products.product.refund_policy')}</a>}
						</div>
					</details>

				</div>
			</div>

			<script type='application/ld+json'>{'product | structured_data'}</script>
		</section>
	)
}

export default (ProductInfo.schema = PRODUCT_INFO_SCHEMA)
