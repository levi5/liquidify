'use sections'

import { RenderSnippet } from 'liquidify'
import classNames from 'classnames'
import { ProductCard } from '../../snippets/ProductCard'
import { ProductShelf } from '../../islands/ProductShelf'
import { RecommendationLoader } from '../../islands/RecommendationLoader'

import styles from './styles.css'

export const ProductRecommendations = () => {
  const related_collection = product.collections[0] || collections.all
  return (
    <section className={classNames(styles['related-products'], 'container', 'section-space')} id="RelatedProducts-{{ section.id }}">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{"'recommendations.eyebrow' | t"}</p>
          <h2>{section.settings.heading ? 'section.settings.heading | escape' : "'recommendations.heading' | t"}</h2>
        </div>
        <a className="text-link" href={routes.all_products_collection_url}>
          {"'recommendations.view_collection' | t"}
        </a>
      </div>
      <div
        role="region"
        aria-label={"'recommendations.eyebrow' | t"}
        data-related-grid
        data-recommendations-state="{% if recommendations.performed and recommendations.products_count > 0 %}loaded{% else %}fallback{% endif %}"
      >
        <ProductShelf eager>
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
        </ProductShelf>
      </div>
      <RecommendationLoader productId={product.id} sectionId={section.id} eager />
    </section>
  )
}

export const schema = {
  name: 't:sections.product_recommendations.name',
  settings: [{ type: 'text', id: 'heading', label: 't:sections.product_recommendations.settings.heading.label', default: '' }],
  presets: [{ name: 't:sections.product_recommendations.presets.default' }],
}
