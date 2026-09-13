'use snippets'

import type { Filter } from 'liquidify'

export const ActiveFilters = ({ filters }: { filters: Filter[] }) => {
  return (
    <>
      <style>
        {
          '.active-filters{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 24px}.active-filters:empty{display:none}.active-filter{display:inline-flex;align-items:center;gap:10px;padding:9px 12px;border:1px solid var(--line);border-radius:4px;font-size:11px;line-height:1.5}.active-filter:hover{border-color:var(--ink)}.active-filter>span:last-child{font-size:17px;line-height:1}.active-filters .text-link{font-size:11px;margin-left:5px}'
        }
      </style>
      {
        '{% assign has_active_filters = false %}{% for filter in filters %}{% if filter.active_values.size > 0 or filter.min_value.value or filter.max_value.value %}{% assign has_active_filters = true %}{% endif %}{% endfor %}'
      }
      {'{% if has_active_filters %}'}
      <div className="active-filters" aria-label="Filtros ativos">
        {filters.map((filter) => (
          <>
            {filter.active_values.map((value) => (
              <>
                <a
                  className="active-filter"
                  href={value.url_to_remove}
                  aria-label="Remover filtro {{ filter.label }}: {{ value.label }}"
                >
                  <span>{'filter.label | append: ": " | append: value.label | escape'}</span>
                  <span aria-hidden="true">×</span>
                </a>
              </>
            ))}
            {filter.type === 'price_range' && (
              <>
                {(filter.min_value.value || filter.max_value.value) && (
                  <>
                    <a
                      className="active-filter"
                      href="{{ filter.url_to_remove }}"
                      aria-label="Remover filtro de preço"
                    >
                      <span>
                        {'filter.min_value.value | default: 0 | money | prepend: "Preço: "'}
                        {'filter.max_value.value | default: filter.range_max | money | prepend: " — "'}
                      </span>
                      <span aria-hidden="true">×</span>
                    </a>
                  </>
                )}
              </>
            )}
          </>
        ))}
        <a
          className="text-link"
          href="{{ request.path }}?sort_by={{ collection.sort_by | default: collection.default_sort_by | url_encode }}"
        >
          Limpar todos
        </a>
      </div>
      {'{% endif %}'}
    </>
  )
}
