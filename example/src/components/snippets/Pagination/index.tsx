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
            {'pager.current_page | prepend: "Página " | append: " de " | append: pager.pages'}
          </p>
          <nav className={classNames(styles.pagination)} aria-label="Paginação">
            {pager.previous && (
              <a
                className={classNames(styles['pagination-direction'])}
                href={pager.previous.url}
                aria-label="Página anterior"
                rel="prev"
              >
                ← <span>Anterior</span>
              </a>
            )}
            {pager.parts.map((part) => {
              const page_number = Number(part.title)
              return part.is_link ? (
                <a href={part.url} aria-label="Ir para a página {{ part.title }}">
                  {'part.title | escape'}
                </a>
              ) : page_number == pager.current_page ? (
                <span aria-current="page" aria-label="Página {{ part.title }}, atual">
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
                aria-label="Próxima página"
                rel="next"
              >
                <span>Próxima</span> →
              </a>
            )}
          </nav>
        </div>
      )}
    </>
  )
}

