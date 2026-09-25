'use sections'

import { PaginateByLiquid, RenderSnippet } from 'liquidify'
import { ProductCard } from '../../snippets/ProductCard'
import { Pagination } from '../../snippets/Pagination'

import styles from './styles.css'

export const MainSearch = () => {
  return (
    <section className="search-page container section-space">
      <div className="page-heading">
        <p className="eyebrow">{"'search.eyebrow' | t"}</p>
        <h1>{"'search.title' | t"}</h1>
        <form action={routes.search_url} method="get" role="search" className="page-search">
          <input type="hidden" name="type" value="product" />
          <label className="visually-hidden" htmlFor="PageSearch">
            {"'header.search_products' | t"}
          </label>
          <input
            type="search"
            id="PageSearch"
            name="q"
            value="{{ search.terms | escape }}"
            placeholder={"'search.placeholder' | t"}
            required
          />
          <button className="button button-dark" type="submit">
            {"'general.search' | t"} ↗
          </button>
        </form>
      </div>
      <p className="catalog-meta">
        {"'search.results' | t: count: search.results_count, terms: search.terms"}
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
                    <span>{"'search.learn_more' | t"}</span>
                  </a>
                </article>
              ),
            )}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-spark">✳</span>
            <h2>{"'search.empty_title' | t"}</h2>
            <p>{"'search.empty_text' | t"}</p>
            <a className="button button-dark" href={routes.all_products_collection_url}>
              {"'cart.explore_store' | t"}
            </a>
          </div>
        )}
        <RenderSnippet slot={Pagination} pager={paginate} />
      </PaginateByLiquid>
    </section>
  )
}
export const schema = {
  name: 't:sections.main_search.name',
  settings: [
    {
      type: 'range',
      id: 'products_per_page',
      label: 't:sections.main_search.settings.products_per_page.label',
      min: 6,
      max: 36,
      step: 6,
      default: 12,
    },
  ],
}
