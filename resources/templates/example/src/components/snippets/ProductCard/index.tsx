'use snippets'

import { RenderSnippet, type Product } from 'liquidify'
import classNames from 'classnames'
import { ThemeIcon } from '../ThemeIcon'

import styles from './styles.css'

export const ProductCard = ({ item }: { item: Product }) => {
  return (
    <article className={classNames(styles['product-card'])}>
      <a className={classNames(styles['product-image-link'])} href={item.url} aria-label="{{ item.title | escape }}">
        {item.featured_image ? (
          <img
            className={classNames(styles['product-primary-image'])}
            src="{{ item.featured_image | image_url: width: 700 }}"
            alt="{{ item.featured_image.alt | default: item.title | escape }}"
            loading="lazy"
            width="700"
            height="880"
          />
        ) : (
          <div className="product-placeholder" aria-hidden="true">
            LQ.
          </div>
        )}
        {item.images.length > 1 && (
          <img
            className={classNames(styles['product-secondary-image'])}
            src="{{ item.images[1] | image_url: width: 700 }}"
            alt="{{ item.title | escape }}"
            width="700"
            height="880"
            loading="lazy"
          />
        )}
        {item.available ? (
          item.compare_at_price > item.price && <span className={classNames(styles['product-tag'])}>SALE</span>
        ) : (
          <span className={classNames(styles['product-tag'], styles['sold-out'])}>ESGOTADO</span>
        )}
        <span className={classNames(styles['product-image-arrow'])} aria-hidden="true">
          ↗
        </span>
      </a>
      <div className={classNames(styles['product-info'])}>
        <div className={classNames(styles['product-info-top'])}>
          <span className={classNames(styles['product-type'])}>LIQUIDIFY ESSENTIALS</span>
          <span className={classNames(styles['product-options-note'])}>
            {item.variants.length === 1 ? '1 opção' : "item.variants.size | append: ' opções'"}
          </span>
        </div>
        <h3>
          <a href={item.url}>{'item.title | escape'}</a>
        </h3>
        <div className={classNames(styles['product-prices'])}>
          <strong>
            {item.price_min !== item.price_max && <small>A partir de </small>}
            {money(item.price)}
          </strong>
          {item.compare_at_price > item.price && <s>{money(item.compare_at_price)}</s>}
        </div>
        {item.available ? (
          item.variants.length === 1 && item.requires_selling_plan !== true ? (
            <form action={routes.cart_add_url} method="post" data-quick-add>
              <input type="hidden" name="id" value="{{ item.variants.first.id }}" />
              <input type="hidden" name="quantity" value="1" />
              <button className={classNames(styles['card-buy-button'])} type="submit">
                <RenderSnippet slot={ThemeIcon} name="bag" />
                <span>Adicionar à sacola</span>
                <span aria-hidden="true">+</span>
              </button>
              <p className="quick-add-message" role="status"></p>
            </form>
          ) : (
            <a className={classNames(styles['card-buy-button'])} href={item.url}>
              <RenderSnippet slot={ThemeIcon} name="bag" />
              <span>Escolher opções</span>
              <span aria-hidden="true">+</span>
            </a>
          )
        ) : (
          <span className={classNames(styles['card-buy-button'], styles.unavailable)}>Indisponível</span>
        )}
      </div>
    </article>
  )
}

