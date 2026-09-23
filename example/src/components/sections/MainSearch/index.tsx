'use sections'

import { PaginateByLiquid, RenderSnippet } from 'liquidify'
import { ProductCard } from '../../snippets/ProductCard'
import { Pagination } from '../../snippets/Pagination'

import styles from './styles.css'

export const MainSearch = () => {
  return (
    <section className="search-page container section-space">
      <div className="page-heading">
        <p className="eyebrow">FIND WHAT MATCHES YOU</p>
        <h1>Great finds.</h1>
        <form action={routes.search_url} method="get" role="search" className="page-search">
          <input type="hidden" name="type" value="product" />
          <label className="visually-hidden" htmlFor="PageSearch">
            Search products
          </label>
          <input
            type="search"
            id="PageSearch"
            name="q"
            value="{{ search.terms | escape }}"
            placeholder="What are you looking for?"
            required
          />
          <button className="button button-dark" type="submit">
            Search ↗
          </button>
        </form>
      </div>
      <p className="catalog-meta">
        {search.results_count} results for “{'search.terms | escape'}”
      </p>
      <PaginateByLiquid collection={search.results} by="section.settings.products_per_page">
        {search.results.length > 0 ? (
          <div className="product-grid">
            {search.results.map((item) =>
              item.object_type === 'product' ? (
                <RenderSnippet slot={ProductCard} item={item} />
              ) : (
                <article className="search-text-result">
                  <a href={item.url}>
                    <h2>{'item.title | escape'}</h2>
                    <span>Learn more ↗</span>
                  </a>
                </article>
              ),
            )}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-spark">✳</span>
            <h2>Let's try another way?</h2>
            <p>Try another term or discover all pieces in the store.</p>
            <a className="button button-dark" href={routes.all_products_collection_url}>
              Explore the store ↗
            </a>
          </div>
        )}
        <RenderSnippet slot={Pagination} pager={paginate} />
      </PaginateByLiquid>
    </section>
  )
}
export const schema = {
  name: 'Search Results',
  settings: [
    {
      type: 'range',
      id: 'products_per_page',
      label: 'Results per page',
      min: 6,
      max: 36,
      step: 6,
      default: 12,
    },
  ],
}
