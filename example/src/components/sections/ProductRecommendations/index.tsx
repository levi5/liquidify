'use sections'

import { RenderSnippet } from 'liquidify'
import classNames from 'classnames'
import { ProductCard } from '../../snippets/ProductCard'
import { RecommendationLoader } from '../../islands/RecommendationLoader'

import styles from './styles.css'

export const ProductRecommendations = () => {
  const related_collection = product.collections[0] || collections.all
  return (
    <section className={classNames(styles['related-products'], 'container', 'section-space')} id="RelatedProducts-{{ section.id }}">
      <div className="section-heading">
        <div>
          <p className="eyebrow">KEEP DISCOVERING</p>
          <h2>{'section.settings.heading | escape'}</h2>
        </div>
        <a className="text-link" href={routes.all_products_collection_url}>
          View collection ↗
        </a>
      </div>
      <div
        className={classNames(styles['product-grid'])}
        data-related-grid
        data-recommendations-state="{% if recommendations.performed and recommendations.products_count > 0 %}loaded{% else %}fallback{% endif %}"
      >
        {recommendations.performed && recommendations.products_count > 0 ? (
          recommendations.products.map(
            (item) => item.id !== product.id && <RenderSnippet slot={ProductCard} item={item} />,
          )
        ) : (
          <>
            {related_collection.products
              .slice(0, 4)
              .map(
                (item) =>
                  item.id !== product.id &&
                  item.available && <RenderSnippet slot={ProductCard} item={item} />,
              )}
          </>
        )}
      </div>
      <RecommendationLoader productId={product.id} sectionId={section.id} eager />
    </section>
  )
}

export const schema = {
  name: 'Related Products',
  settings: [{ type: 'text', id: 'heading', label: 'Heading', default: 'Complete the look.' }],
  presets: [{ name: 'Related Products' }],
}
