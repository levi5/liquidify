'use sections'

import { RenderSnippet } from 'liquidify'
import { ProductCard } from '../snippets/ProductCard'
import { RecommendationLoader } from '../islands/RecommendationLoader'

export const ProductRecommendations = () => {
  const related_collection = product.collections[0] || collections.all
  return (
    <section className="related-products container section-space" id="RelatedProducts-{{ section.id }}">
      <style>
        {
          '.related-products:not(:has(.product-card)){display:none}.related-products .product-grid{grid-template-columns:repeat(4,minmax(0,1fr))}@media(max-width:900px){.related-products .product-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}'
        }
      </style>
      <div className="section-heading">
        <div>
          <p className="eyebrow">CONTINUE DESCOBRINDO</p>
          <h2>{'section.settings.heading | escape'}</h2>
        </div>
        <a className="text-link" href={routes.all_products_collection_url}>
          Ver coleção ↗
        </a>
      </div>
      <div
        className="product-grid"
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
  name: 'Produtos relacionados',
  settings: [{ type: 'text', id: 'heading', label: 'Título', default: 'Complete o look.' }],
  presets: [{ name: 'Produtos relacionados' }],
}
