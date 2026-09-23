'use sections'

import classNames from 'classnames'
import { ProductPurchase } from '../../islands/ProductPurchase'

import styles from './styles.css'

export const MainProduct = () => {
  return (
    <section className={classNames(styles['product-detail'], 'container', 'section-space')}>
      <nav className="breadcrumbs" aria-label="Navegação estrutural">
        <a href={routes.root_url}>Início</a>
        <span>/</span>
        <a href={routes.all_products_collection_url}>Loja</a>
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
          {'{% for media in product.media %}{% unless media.media_type == "image" %}'}
          <div className={classNames(styles['product-media'])}>{'media | media_tag: image_size: "1000x", controls: true'}</div>
          {'{% endunless %}{% endfor %}'}
        </div>
        <div className={classNames(styles['product-detail-copy'])}>
          <p className="eyebrow">{'product.vendor | escape'}</p>
          <h1>{'product.title | escape'}</h1>
          <p className={classNames(styles['product-intro'])}>Estilo para acompanhar o seu ritmo. Escolha sua combinação.</p>
          <div
            className="island-bridge"
            data-liquid-store="{{ product | json | escape }}"
            data-liquid-selected="{{ product.selected_or_first_available_variant.id | json | escape }}"
          >
            <ProductPurchase eager>
              <form action={routes.cart_add_url} method="post" className="purchase-form">
                <p className={classNames(styles['detail-price'])}>{money(product.price)}</p>
                <label htmlFor="FallbackVariant">Escolha uma opção</label>
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
                <label htmlFor="FallbackQuantity">Quantidade</label>
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
                    Adicionar à sacola ↗
                  </button>
                </fieldset>
              </form>
            </ProductPurchase>
            {product.requires_selling_plan && (
              <noscript>
                Este produto exige um plano de assinatura. Entre em contato com a loja para escolher seu
                plano.
              </noscript>
            )}
          </div>
          <div className={classNames(styles['purchase-note'])}>
            <span aria-hidden="true">↗</span>
            <span>
              Frete calculado no checkout.
              <br />
              Seus dados protegidos em cada etapa.
            </span>
          </div>
          <details className={classNames(styles['product-accordion'])} open>
            <summary>
              Sobre a peça <span>+</span>
            </summary>
            <div className="rich-text">{product.description}</div>
          </details>
          <details className={classNames(styles['product-accordion'])}>
            <summary>
              Entrega e devolução <span>+</span>
            </summary>
            <div className="rich-text">
              <p>
                Informe seu endereço no checkout para consultar os prazos e as opções de entrega disponíveis.
              </p>
              {'{% if shop.shipping_policy != blank %}'}
              <a href="{{ shop.shipping_policy.url }}">Política de envio ↗</a>
              {'{% endif %}'}
              {'{% if shop.refund_policy != blank %}'}
              <a href="{{ shop.refund_policy.url }}">Política de devolução ↗</a>
              {'{% endif %}'}
            </div>
          </details>
        </div>
      </div>
      <script type="application/ld+json">{'product | structured_data'}</script>
    </section>
  )
}
export const schema = {
  name: 'Detalhes do produto',
  settings: [],
}
