'use sections'

import classNames from 'classnames'
import { ProductPurchase } from '../../islands/ProductPurchase'

import styles from './styles.css'

export const MainProduct = () => {
  return (
    <section className={classNames(styles['product-detail'], 'container', 'section-space')}>
      <nav className="breadcrumbs" aria-label={"'products.product.breadcrumbs' | t"}>
        <a href={routes.root_url}>{"'general.home' | t"}</a>
        <span>/</span>
        <a href={routes.all_products_collection_url}>{"'general.shop' | t"}</a>
        <span>/</span>
        <span>{'product.title | escape'}</span>
      </nav>
      <div className={classNames(styles['product-detail-grid'])}>
        <div className="product-gallery">
          {product.featured_image ? (
            <a
              className={classNames(styles['main-product-image'])}
              href="{{ product.featured_image | image_url: width: 2000 }}"
              target="_blank"
              rel="noopener"
            >
              <img
                id="ProductMainImage"
                src="{{ product.featured_image | image_url: width: 1200 }}"
                alt="{{ product.featured_image.alt | default: product.title | escape }}"
                width="1000"
                height="1200"
                fetchPriority="high"
              />
            </a>
          ) : (
            <div className="product-placeholder">✳</div>
          )}
          {product.images.length > 1 && (
            <div className={classNames(styles['product-thumbnails'])}>
              {product.images.map((photo) => (
                <a
                  href="{{ photo | image_url: width: 2000 }}"
                  data-product-thumbnail="{{ photo | image_url: width: 1200 }}"
                >
                  <img
                    src="{{ photo | image_url: width: 200 }}"
                    alt="{{ photo.alt | default: product.title | escape }}"
                    width="120"
                    height="144"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          )}
          {product.media?.filter((media) => media.media_type !== 'image').map((media) => (
            <div key={media.id} className={classNames(styles['product-media'])}>
              {'{{ media.media_tag }}'}
            </div>
          ))}
        </div>
        <div className={classNames(styles['product-detail-copy'])}>
          <p className="eyebrow">{'product.vendor | escape'}</p>
          <h1>{'product.title | escape'}</h1>
          <p className={classNames(styles['product-intro'])}>{"'products.product.intro' | t"}</p>
          <div
            className="island-bridge"
            data-liquid-store="{{ product | json | escape }}"
            data-liquid-selected="{{ product.selected_or_first_available_variant.id | json | escape }}"
          >
            <ProductPurchase eager>
              <form action={routes.cart_add_url} method="post" className="purchase-form">
                <p className={classNames(styles['detail-price'])}>{money(product.price)}</p>
                <label htmlFor="FallbackVariant">{"'products.product.choose_option' | t"}</label>
                <select id="FallbackVariant" name="id">
                  {product.variants.map((variant) => (
                    <option
                      value={variant.id}
                      disabled={!variant.available}
                      selected={variant.id === product.selected_or_first_available_variant.id}
                    >
                      {'variant.title | escape'} — {money(variant.price)}
                    </option>
                  ))}
                </select>
                <label htmlFor="FallbackQuantity">{"'products.product.quantity' | t"}</label>
                <input id="FallbackQuantity" name="quantity" type="number" min="1" value="1" />
                <fieldset
                  disabled={product.requires_selling_plan === true}
                  style={{ border: '0', margin: '0', padding: '0' }}
                >
                  <button
                    className="button button-dark product-add-button"
                    style={{ width: '100%', maxWidth: '320px' }}
                    type="submit"
                    disabled={!product.available}
                  >
                    {"'products.product.add_to_bag' | t"} ↗
                  </button>
                </fieldset>
              </form>
            </ProductPurchase>
            {product.requires_selling_plan && (
              <noscript>
                {"'products.product.selling_plan' | t"}
              </noscript>
            )}
          </div>
          <div className={classNames(styles['purchase-note'])}>
            <span aria-hidden="true">↗</span>
            <span>
              {"'products.product.shipping_note' | t"}
              <br />
              {"'products.product.secure_note' | t"}
            </span>
          </div>
          <details className={classNames(styles['product-accordion'])} open>
            <summary>
              {"'products.product.about' | t"} <span>+</span>
            </summary>
            <div className="rich-text">{'{{ product.description }}'}</div>
          </details>
          <details className={classNames(styles['product-accordion'])}>
            <summary>
              {"'products.product.shipping_returns' | t"} <span>+</span>
            </summary>
            <div className="rich-text">
              <p>
                {"'products.product.shipping_text' | t"}
              </p>
              {shop.shipping_policy && (
                <a href={shop.shipping_policy.url}>{"'products.product.shipping_policy' | t"}</a>
              )}
              {shop.refund_policy && (
                <a href={shop.refund_policy.url}>{"'products.product.refund_policy' | t"}</a>
              )}
            </div>
          </details>
        </div>
      </div>
      <script type="application/ld+json">{'product | structured_data'}</script>
    </section>
  )
}
export const schema = {
  name: 't:sections.main_product.name',
  settings: [],
}
