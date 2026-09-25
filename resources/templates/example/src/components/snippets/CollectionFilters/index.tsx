'use snippets'

import type { Filter } from 'liquidify'
import classNames from 'classnames'
import { FilterDrawer } from '../../islands/FilterDrawer'

import styles from './styles.css'

export const CollectionFilters = ({
  collection_filters,
  section_id,
  heading,
}: {
  collection_filters: Filter[]
  section_id: string
  heading: string
}) => {
  return (
    <aside className={classNames(styles['catalog-sidebar'])} aria-label={"'filters.label' | t"}>
      <FilterDrawer sectionId={section_id} eager />
      <div data-filter-source>
        <details className={classNames(styles['sidebar-sections'])} open>
          <summary className={classNames(styles['sidebar-toggle'])}>
            {heading ? 'heading | escape' : "'filters.title' | t"} <span aria-hidden="true">+</span>
          </summary>
          <form id="CollectionFilters-{{ section_id }}" method="get" action="{{ request.path }}">
            {collection_filters.map((filter) => (
              <details className={classNames(styles['sidebar-filter-group'])} open>
                <summary>
                  {'filter.label | escape'} <span aria-hidden="true">+</span>
                </summary>
                {filter.type === 'price_range' ? (
                  <div className={classNames(styles['sidebar-price-fields'])}>
                    <label>
                      {"'filters.from' | t"}
                      <input
                        type="number"
                        name={filter.min_value.param_name}
                        min="0"
                        step="0.01"
                        value="{% if filter.min_value.value %}{{ filter.min_value.value | divided_by: 100.0 }}{% endif %}"
                        placeholder="0"
                      />
                    </label>
                    <label>
                      {"'filters.to' | t"}
                      <input
                        type="number"
                        name={filter.max_value.param_name}
                        min="0"
                        step="0.01"
                        value="{% if filter.max_value.value %}{{ filter.max_value.value | divided_by: 100.0 }}{% endif %}"
                        placeholder="{{ filter.range_max | divided_by: 100.0 }}"
                      />
                    </label>
                  </div>
                ) : (
                  <div className={classNames(styles['sidebar-filter-values'])}>
                    {filter.values.map((value) => (
                      <label className={classNames(styles['sidebar-option'])}>
                        <input
                          type="checkbox"
                          name={value.param_name}
                          value={value.value}
                          checked={value.active === true}
                        />
                        <span>
                          {'value.label | escape'} <small>({value.count})</small>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </details>
            ))}
            {collection_filters.length === 0 && (
              <p className={classNames(styles['sidebar-empty'])}>{"'filters.empty' | t"}</p>
            )}
            <div className={classNames(styles['sidebar-filter-actions'])}>
              <button className="button button-dark" type="submit">
                {"'filters.apply' | t"}
              </button>
              <a
                className="text-link"
                href="{{ request.path }}?sort_by={{ collection.sort_by | default: collection.default_sort_by | url_encode }}"
              >
                {"'filters.clear' | t"}
              </a>
            </div>
          </form>
        </details>
      </div>
    </aside>
  )
}

