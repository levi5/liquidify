'use sections'

import { RenderSnippet } from 'liquidify'
import classNames from 'classnames'
import { ProductCard } from '../../snippets/ProductCard'

import styles from './styles.css'

export const FeaturedCollection = () => {
  const featured = section.settings.collection || collections.all
  return (
    <section className={classNames(styles.featured, 'section-space', 'container')} id="favoritos">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{"'featured.eyebrow' | t"}</p>
          <h2>{section.settings.heading ? 'section.settings.heading | escape' : "'featured.heading' | t"}</h2>
          <p className="section-subtitle">{"'featured.subtitle' | t"}</p>
        </div>
        <a className="text-link" href="{{ featured.url | default: routes.all_products_collection_url }}">
          {"'featured.view_all' | t"} <span aria-hidden="true">↗</span>
        </a>
      </div>
      {featured.products.length > 0 ? (
        <div
          className={classNames(styles['product-shelf'])}
          role="region"
          aria-label={"'featured.eyebrow' | t"}
          tabIndex={0}
        >
          {featured.products.slice(0, 8).map((item) => (
            <RenderSnippet slot={ProductCard} item={item} />
          ))}
        </div>
      ) : (
        <div className={classNames(styles['empty-state'])}>
          <h3>{"'featured.empty_title' | t"}</h3>
          <p>{"'featured.empty_text' | t"}</p>
        </div>
      )}
    </section>
  )
}
export const schema = {
  name: 't:sections.featured_collection.name',
  settings: [
    { type: 'text', id: 'heading', label: 't:sections.featured_collection.settings.heading.label', default: '' },
    { type: 'collection', id: 'collection', label: 't:sections.featured_collection.settings.collection.label' },
  ],
  presets: [{ name: 't:sections.featured_collection.presets.default' }],
}
