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
          <p className="eyebrow">THE EVERYDAY EDIT</p>
          <h2>{'section.settings.heading | default: "On your radar." | escape'}</h2>
          <p className="section-subtitle">Your next wardrobe favorite is here.</p>
        </div>
        <a className="text-link" href="{{ featured.url | default: routes.all_products_collection_url }}">
          View all <span aria-hidden="true">↗</span>
        </a>
      </div>
      {featured.products.length > 0 ? (
        <div className={classNames(styles['product-grid'])}>
          {featured.products.slice(0, 8).map((item) => (
            <RenderSnippet slot={ProductCard} item={item} />
          ))}
        </div>
      ) : (
        <div className={classNames(styles['empty-state'])}>
          <h3>New pieces are coming.</h3>
          <p>Follow Liquidify's upcoming drops.</p>
        </div>
      )}
    </section>
  )
}
export const schema = {
  name: 'Featured Products',
  settings: [
    { type: 'text', id: 'heading', label: 'Heading', default: 'On your radar.' },
    { type: 'collection', id: 'collection', label: 'Collection' },
  ],
  presets: [{ name: 'Featured Products' }],
}
