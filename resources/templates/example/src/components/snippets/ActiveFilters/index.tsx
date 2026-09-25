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
    <div className={classNames(styles['active-filters'])} aria-label={"'filters.active' | t"}>
      {filters.map((filter) => (
        <>
          {filter.active_values.map((value) => (
            <>
              <a
                className={classNames(styles['active-filter'])}
                href={value.url_to_remove}
                aria-label={"'filters.remove' | t: filter: filter.label, value: value.label"}
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
                    aria-label={"'filters.remove_price' | t"}
                  >
                    <span>
                      {"'filters.price' | t"}: {filter.min_value?.value != null ? filter.min_value.value : 0}{' '}
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
      <a
        className="text-link"
        href="{{ request.path }}?sort_by={{ collection.sort_by | default: collection.default_sort_by | url_encode }}"
      >
        {"'filters.clear_all' | t"}
      </a>
    </div>
  )
}

