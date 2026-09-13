'use sections'

import { PaginateByLiquid, RenderSnippet } from 'liquidify'
import { ProductCard } from '../snippets/ProductCard'
import { Pagination } from '../snippets/Pagination'
import { CollectionFilters } from '../snippets/CollectionFilters'
import { ActiveFilters } from '../snippets/ActiveFilters'
export const MainCollection = () => {
  const selected_sort = collection.sort_by || collection.default_sort_by
  return (
    <section className="catalog container section-space">
      <nav className="breadcrumbs" aria-label="Navegação estrutural">
        <a href={routes.root_url}>Início</a>
        <span>/</span>
        <span>{'collection.title | escape'}</span>
      </nav>
      <div className="page-heading">
        <p className="eyebrow">ESCOLHAS QUE TRANSFORMAM</p>
        <h1>
          {current_tags.length > 0 ? "current_tags | join: ' + ' | escape" : 'collection.title | escape'}
        </h1>
        {collection.description && <div className="rich-text">{collection.description}</div>}
      </div>
      <div className="catalog-layout">
        <RenderSnippet
          slot={CollectionFilters}
          collection_filters={collection.filters}
          section_id={section.id}
          heading={section.settings.filter_heading}
        />
        <div className="catalog-results">
          <div className="catalog-toolbar">
            <span className="catalog-meta">{'collection.products_count | append: " produtos"'}</span>
            <div className="sort-control">
              <label htmlFor="SortBy">Ordenar</label>
              <select
                id="SortBy"
                name="sort_by"
                form="CollectionFilters-{{ section.id }}"
                data-selected="{{ collection.sort_by | default: collection.default_sort_by }}"
              >
                {'{% for option in collection.sort_options %}'}
                {'{% if option.value == selected_sort %}'}
                <option value="{{ option.value }}" selected>
                  {'option.name | escape'}
                </option>
                {'{% else %}'}
                <option value="{{ option.value }}">{'option.name | escape'}</option>
                {'{% endif %}{% endfor %}'}
              </select>
            </div>
          </div>
          <RenderSnippet slot={ActiveFilters} filters={collection.filters} />
          <PaginateByLiquid collection={collection.products} by="section.settings.products_per_page">
            {collection.products.length > 0 ? (
              <div className="product-grid">
                {collection.products.map((item) => (
                  <RenderSnippet slot={ProductCard} item={item} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-spark">✳</span>
                <h2>Nenhuma peça por aqui.</h2>
                <p>Tente ajustar os filtros ou explorar toda a coleção.</p>
                <a className="button button-dark" href={routes.all_products_collection_url}>
                  Ver todos os produtos ↗
                </a>
              </div>
            )}
            <RenderSnippet slot={Pagination} pager={paginate} />
          </PaginateByLiquid>
        </div>
      </div>
    </section>
  )
}
export const schema = {
  name: 'Catálogo',
  settings: [
    { type: 'text', id: 'filter_heading', label: 'Título dos filtros', default: 'Filtros' },
    {
      type: 'range',
      id: 'products_per_page',
      label: 'Produtos por página',
      min: 6,
      max: 36,
      step: 6,
      default: 12,
    },
  ],
}
