'use snippets'

import { t, escape, defaultValue, urlEncode } from 'liquidify'
import type { Filter } from 'liquidify'
import classNames from 'classnames'

import styles from './styles.css'

export const ActiveFilters = ({ filters }: { filters: Filter[] }) => {
	const hasActiveFilters = filters.some(
		(filter) =>
			filter.active_values.length > 0 ||
			filter.min_value?.value != null ||
			filter.max_value?.value != null,
	)

	if (!hasActiveFilters) return null

	const clearSort = urlEncode(defaultValue(collection.sort_by, collection.default_sort_by))

	return (
		<div className={classNames(styles['active-filters'])} aria-label={t('filters.active')}>
			{filters.map((filter) => (
				<>
					{filter.active_values.map((value) => (
						<a
							className={classNames(styles['active-filter'])}
							href={value.url_to_remove}
							aria-label={t('filters.remove', { filter: filter.label, value: value.label })}
						>
							<span>{`${escape(filter.label)}: ${escape(value.label)}`}</span>
							<span aria-hidden='true'>×</span>
						</a>
					))}

					{filter.type === 'price_range' && (filter.min_value?.value != null || filter.max_value?.value != null) && (
						<a className={classNames(styles['active-filter'])} href={filter.url_to_remove} aria-label={t('filters.remove_price')}>
							<span>
								{filter.min_value?.value != null ? `${t('filters.price')}: ${filter.min_value.value}` : `${t('filters.price')}: 0`}
								{filter.max_value?.value != null ? ` — ${filter.max_value.value}` : ''}
							</span>
							<span aria-hidden='true'>×</span>
						</a>
					)}
				</>
			))}

			<a className='text-link' href={request.path + '?sort_by=' + clearSort}>
				{t('filters.clear_all')}
			</a>
		</div>
	)
}
