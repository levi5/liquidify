'use sections'

import { PaginateByLiquid, RenderSnippet } from 'liquidify'
import { ProductCard } from '../snippets/ProductCard'
import { Pagination } from '../snippets/Pagination'
export const MainSearch = () => {
  return (
    <section className="search-page container section-space">
      <div className="page-heading">
        <p className="eyebrow">ENCONTRE O QUE COMBINA COM VOCÊ</p>
        <h1>Boas descobertas.</h1>
        <form action={routes.search_url} method="get" role="search" className="page-search">
          <input type="hidden" name="type" value="product" />
          <label className="visually-hidden" htmlFor="PageSearch">
            Buscar produtos
          </label>
          <input
            type="search"
            id="PageSearch"
            name="q"
            value="{{ search.terms | escape }}"
            placeholder="O que você está procurando?"
            required
          />
          <button className="button button-dark" type="submit">
            Buscar ↗
          </button>
        </form>
      </div>
      <p className="catalog-meta">
        {search.results_count} resultados para “{'search.terms | escape'}”
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
                    <span>Saiba mais ↗</span>
                  </a>
                </article>
              ),
            )}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-spark">✳</span>
            <h2>Vamos tentar de outro jeito?</h2>
            <p>Experimente outro termo ou descubra todas as peças da loja.</p>
            <a className="button button-dark" href={routes.all_products_collection_url}>
              Explorar a loja ↗
            </a>
          </div>
        )}
        <RenderSnippet slot={Pagination} pager={paginate} />
      </PaginateByLiquid>
    </section>
  )
}
export const schema = {
  name: 'Resultados da busca',
  settings: [
    {
      type: 'range',
      id: 'products_per_page',
      label: 'Resultados por página',
      min: 6,
      max: 36,
      step: 6,
      default: 12,
    },
  ],
}
