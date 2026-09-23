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
          <h2>{'section.settings.heading | default: "No seu radar." | escape'}</h2>
          <p className="section-subtitle">A próxima peça favorita do seu guarda-roupa está aqui.</p>
        </div>
        <a className="text-link" href="{{ featured.url | default: routes.all_products_collection_url }}">
          Ver tudo <span aria-hidden="true">↗</span>
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
          <h3>Novas peças estão chegando.</h3>
          <p>Acompanhe os próximos lançamentos da Liquidify.</p>
        </div>
      )}
    </section>
  )
}
export const schema = {
  name: 'Produtos em destaque',
  settings: [
    { type: 'text', id: 'heading', label: 'Título', default: 'No seu radar.' },
    { type: 'collection', id: 'collection', label: 'Coleção' },
  ],
  presets: [{ name: 'Produtos em destaque' }],
}
