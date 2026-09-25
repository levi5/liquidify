'use snippets'

import type { Paginate } from 'liquidify'
import classNames from 'classnames'

import styles from './styles.css'

export const Pagination = ({ pager }: { pager: Paginate }) => {
  return (
    <>
      {pager.pages > 1 && (
        <div className={classNames(styles['pagination-footer'])}>
          <p className={classNames(styles['pagination-caption'])}>
            {"'pagination.page_of' | t: current_page: pager.current_page, pages: pager.pages"}
          </p>
          <nav className={classNames(styles.pagination)} aria-label={"'pagination.label' | t"}>
            {pager.previous && (
              <a
                className={classNames(styles['pagination-direction'])}
                href={pager.previous.url}
                aria-label={"'pagination.prev' | t"}
                rel="prev"
              >
                ← <span>{"'pagination.previous' | t"}</span>
              </a>
            )}
            {pager.parts.map((part) => {
              const page_number = Number(part.title)
              return part.is_link ? (
                <a href={part.url} aria-label={"'pagination.go_to' | t: page: part.title"}>
                  {'part.title | escape'}
                </a>
              ) : page_number == pager.current_page ? (
                <span aria-current="page" aria-label={"'pagination.current' | t: page: part.title"}>
                  {'part.title | escape'}
                </span>
              ) : (
                <span className={classNames(styles['pagination-ellipsis'])} aria-hidden="true">
                  {'part.title | escape'}
                </span>
              )
            })}
            {pager.next && (
              <a
                className={classNames(styles['pagination-direction'])}
                href={pager.next.url}
                aria-label={"'pagination.next' | t"}
                rel="next"
              >
                <span>{"'pagination.next_short' | t"}</span> →
              </a>
            )}
          </nav>
        </div>
      )}
    </>
  )
}

