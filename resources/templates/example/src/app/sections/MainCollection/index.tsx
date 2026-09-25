'use sections'

import { RenderSnippet } from 'liquidex'
import classNames from 'classnames'

import { CollectionFilter } from '../../components/Filter/Collection'
import { FilterDrawer } from '../../components/Filter/Drawer'
import { Catalog } from '../../components/Catalog'
import { Breadcrumb } from '../../components/Breadcrumb'
import { ThemeIcon } from '../../components/Icon'

import { COLLECTION_SCHEMA } from '../../../schemas/Collection/collection.schema'

import styles from './styles.css'

export const MainCollection = () => {
	const selected_sort = collection.sort_by || collection.default_sort_by
	const filterFormId = `CollectionFilters-${section.id}`

	return (
		<section className={classNames(styles.catalog, 'container', 'section-space')}>
			<RenderSnippet slot={Breadcrumb} className='' />

			<div className={classNames(styles['page-heading'])}>
				<p className='eyebrow'>{"'collection.eyebrow' | t"}</p>
				<h1>{'collection.title | escape'}</h1>
				{collection.description && <div className='rich-text'>{'{{ collection.description }}'}</div>}
			</div>

			<div className='catalog-layout'>
				<RenderSnippet slot={CollectionFilter} heading={section.settings.filter_heading} sectionId={section.id} />

				<div className='catalog-results'>
					<div className={classNames(styles['catalog-toolbar'])}>
						<span className={classNames(styles['catalog-meta'])}>{"'collection.products_count' | t: count: collection.products_count"}</span>

						<div className={classNames(styles['toolbar-actions'])}>
							<FilterDrawer sectionId={section.id} />

							<div className='sort-control'>
								<label htmlFor='SortBy' className={classNames(styles['sort-label'])}>
									{"'collection.sort' | t"}
								</label>
								<RenderSnippet slot={ThemeIcon} name='sort' size={15} />
								<select id='SortBy' name='sort_by' form={filterFormId} data-selected={selected_sort}>
									{collection.sort_options.map((option) => (
										<option key={option.value} value={option.value} selected={option.value === selected_sort}>
											{option.name}
										</option>
									))}
								</select>
							</div>
						</div>
					</div>

					<RenderSnippet slot={Catalog} by={section.settings.products_per_page} />
				</div>
			</div>
		</section>
	)
}

export default (MainCollection.schema = {
	...COLLECTION_SCHEMA,
	settings: [
		{ type: 'text', id: 'filter_heading', label: 't:sections.main_collection.settings.filter_heading.label', default: 'Filtros' },
		{
			type: 'range',
			id: 'products_per_page',
			label: 't:sections.main_collection.settings.products_per_page.label',
			min: 6,
			max: 36,
			step: 6,
			default: 12,
		},
	],
})
