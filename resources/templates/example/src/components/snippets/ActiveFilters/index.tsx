'use snippets'

import type { Filter } from 'liquidify'
import classNames from 'classnames'

import styles from './styles.css'

export const ActiveFilters = ({ filters }: { filters: Filter[] }) => {
  const hasActiveFilters = filters.some(
    (filter) =>
      filter.active_values.length > 0 ||
      filter.min_value?.value != null ||
      filter.max_value?.value != null
  )

  if (!hasActiveFilters) return null

  return (
    <div className={classNames(styles['active-filters'])} aria-label="Filtros ativos">
      {filters.map((filter) => (
        <>
          {filter.active_values.map((value) => (
            <>
              <a
                className={classNames(styles['active-filter'])}
                href={value.url_to_remove}
                aria-label={`Remover filtro ${filter.label}: ${value.label}`}
              >
                <span>{`${filter.label}: ${value.label}`}</span>
                <span aria-hidden="true">×</span>
              </a>
            </>
          ))}
          {filter.type === 'price_range' && (
            <>
              {(filter.min_value?.value != null || filter.max_value?.value != null) && (
                <>
                  <a
                    className={classNames(styles['active-filter'])}
                    href={filter.url_to_remove}
                    aria-label="Remover filtro de preço"
                  >
                    <span>
                      Preço: {filter.min_value?.value != null ? filter.min_value.value : 0}{' '}
                      {filter.max_value?.value != null
                        ? `— ${filter.max_value.value}`
                        : filter.range_max != null
                          ? `— ${filter.range_max}`
                          : ''}
                    </span>
                    <span aria-hidden="true">×</span>
                  </a>
                </>
              )}
            </>
          )}
        </>
      ))}
      <a className="text-link" href={window.location.pathname + '?sort_by=' + (collection.sort_by || collection.default_sort_by)}>
        Limpar todos
      </a>
    </div>
  )
}

