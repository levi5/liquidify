'use sections'

import { RenderSnippet, Raw } from 'liquidex'
import classNames from 'classnames'

import { ProductPreview } from './Preview'
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
				<div className='product-gallery'>
					<RenderSnippet slot={ProductPreview} id={product.id} title={product.title} images={product.images} />
				</div>

				<div className={classNames(styles['product-detail-copy'])}>
					<p className='eyebrow'>{'product.vendor | escape'}</p>
					<h1>{'product.title | escape'}</h1>
					<p className={classNames(styles['product-intro'])}>{"'products.product.intro' | t"}</p>

					<liquid-data data-liquid-store='{{ product | json }}'>
						<ProductProvider elementId='product-provider' selectFirstVariant={false} store={product}>
							<p className={classNames(styles['detail-price'])} data-product-price>
								{'product.selected_or_first_available_variant.price | money'}
							</p>
							<p className={classNames(styles['detail-compare-price'])} data-product-compare-price hidden>
								{'product.selected_or_first_available_variant.compare_at_price | money'}
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
									<label htmlFor='Quantity'>{"'products.product.quantity' | t"}</label>
									<QuantitySelector id='Quantity' name='quantity' />
								</div>

								<button type='button' className={classNames('button', 'button-dark', styles['product-add-button'])} data-product-add-to-cart='true'>
									{"'products.product.add_to_bag' | t"}
									<span aria-hidden='true'>↗</span>
								</button>
							</div>
						</ProductProvider>
					</liquid-data>

					<div className={classNames(styles['purchase-note'])}>
						<span aria-hidden='true'>↗</span>
						<span>
							{"'products.product.shipping_note' | t"}
							<br />
							{"'products.product.secure_note' | t"}
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
							{"'products.product.about' | t"} <span>+</span>
						</summary>
						<div className='rich-text'>
							<Raw html={product.description} />
						</div>
					</details>

					<details className={classNames(styles['product-accordion'])}>
						<summary>
							{"'products.product.shipping_returns' | t"} <span>+</span>
						</summary>
						<div className='rich-text'>
							<p>{"'products.product.shipping_text' | t"}</p>
							{shop.shipping_policy && <a href={shop.shipping_policy.url}>{"'products.product.shipping_policy' | t"}</a>}
							{shop.refund_policy && <a href={shop.refund_policy.url}>{"'products.product.refund_policy' | t"}</a>}
						</div>
					</details>

				</div>
			</div>

			<script type='application/ld+json'>{'product | structured_data'}</script>
		</section>
	)
}

export default (ProductInfo.schema = PRODUCT_INFO_SCHEMA)
