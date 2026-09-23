'use snippets'

import type { Filter } from 'liquidify'
import classNames from 'classnames'

import styles from './styles.css'

export const ActiveFilters = ({ filters }: { filters: Filter[] }) => {
  return (
    <>
      {
        '{% assign has_active_filters = false %}{% for filter in filters %}{% if filter.active_values.size > 0 or filter.min_value.value or filter.max_value.value %}{% assign has_active_filters = true %}{% endif %}{% endfor %}'
      }
      {'{% if has_active_filters %}'}
      <div className={classNames(styles['active-filters'])} aria-label="Filtros ativos">
        {filters.map((filter) => (
          <>
            {filter.active_values.map((value) => (
              <>
                <a
                  className={classNames(styles['active-filter'])}
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
                      className={classNames(styles['active-filter'])}
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

