'use snippets'

import { t, escape, defaultValue, urlEncode } from 'liquidify'
import { RenderSnippet } from 'liquidex'
import classNames from 'classnames'

import { FilterListLayout } from '../Layout/List'
import { FilterRangeLayout } from '../Layout/Range'

import styles from './styles.css'

export const CollectionFilter = ({ heading = '', sectionId }: { heading?: string; sectionId: string }) => {
	const formId = `CollectionFilters-${sectionId}`

	return (
		<aside className={classNames(styles['catalog-sidebar'])} aria-label={t('filters.label')}>
			<div data-filter-source>
				<details className={classNames(styles['sidebar-sections'])} open>
					<summary className={classNames(styles['sidebar-toggle'])}>
						{heading && heading !== 'blank' ? escape(heading) : t('filters.title')} <span aria-hidden='true'>+</span>
					</summary>

					<form id={formId} method='get' action='{{ request.path }}'>
						{collection.filters.map((filter: any) => (
							<>
								{filter.type === 'price_range' ? <RenderSnippet slot={FilterRangeLayout} filter={filter} /> : <RenderSnippet slot={FilterListLayout} filter={filter} />}
							</>
						))}

						{collection.filters.length === 0 && <p className={classNames(styles['sidebar-empty'])}>{t('filters.empty')}</p>}

						<div className={classNames(styles['sidebar-filter-actions'])}>
							<button className='button button-dark' type='submit'>
								{t('filters.apply')}
							</button>
							<a className='text-link' href={`${request.path}?sort_by=${urlEncode(defaultValue(collection.sort_by, collection.default_sort_by))}`}>
								{t('filters.clear')}
							</a>
						</div>
					</form>
				</details>
			</div>
		</aside>
	)
}
