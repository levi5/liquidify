'use sections'

import { PaginateByLiquid, RenderSnippet } from 'liquidify'
import classNames from 'classnames'
import { Pagination } from '../../snippets/Pagination'

import styles from './styles.css'

export const CollectionList = () => {
  return (
    <section className="container section-space">
      <div className="page-heading">
        <p className="eyebrow">{"'collections.eyebrow' | t"}</p>
        <h1>{"'collections.heading' | t"}</h1>
      </div>
      <PaginateByLiquid collection={collections} by={24}>
        <div className="category-grid">
          {collections.map((item) => (
            <a className="category-card" href={item.url}>
              {item.image ? (
                <img
                  src="{{ item.image | image_url: width: 900 }}"
                  alt="{{ item.title | escape }}"
                  width="900"
                  height="1000"
                  loading="lazy"
                />
              ) : (
                <div className={classNames(styles['product-placeholder'])}>✳</div>
              )}
              <span className="category-label">
                <strong>{'item.title | escape'}</strong>
                <span className="circle-arrow">↗</span>
              </span>
            </a>
          ))}
        </div>
        <RenderSnippet slot={Pagination} pager={paginate} />
      </PaginateByLiquid>
    </section>
  )
}
export const schema = {
  name: 't:sections.collection_list.name',
  settings: [],
}
