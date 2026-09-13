'use snippets'

import type { Paginate } from 'liquidify'

export const Pagination = ({ pager }: { pager: Paginate }) => {
  return (
    <>
      <style>
        {
          '.pagination-footer{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:36px;padding-top:26px;border-top:1px solid var(--line)}.pagination-caption{margin:0;font-size:12px;color:var(--muted)}.pagination-footer .pagination{margin:0;flex-wrap:wrap;gap:6px}.pagination-footer .pagination>a,.pagination-footer .pagination>span{min-width:40px;height:40px;border-radius:4px;font-size:12px}.pagination-footer .pagination>a:hover{background:var(--ink);color:var(--paper)}.pagination-footer .pagination>.pagination-ellipsis{border:0;min-width:20px}.pagination-footer .pagination>.pagination-direction{padding:0 12px;gap:7px}.pagination-footer .pagination>[aria-disabled=true]{color:var(--muted);opacity:.5}@media(max-width:680px){.pagination-footer{flex-direction:column;gap:15px;margin-top:28px}.pagination-footer .pagination>.pagination-direction{padding:0;min-width:40px}.pagination-direction>span{display:none}}'
        }
      </style>
      {pager.pages > 1 && (
        <div className="pagination-footer">
          <p className="pagination-caption">
            {'pager.current_page | prepend: "Página " | append: " de " | append: pager.pages'}
          </p>
          <nav className="pagination" aria-label="Paginação">
            {pager.previous && (
              <a
                className="pagination-direction"
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
                <span className="pagination-ellipsis" aria-hidden="true">
                  {'part.title | escape'}
                </span>
              )
            })}
            {pager.next && (
              <a
                className="pagination-direction"
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
