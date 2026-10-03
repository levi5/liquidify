'use sections'

import { t, escape } from 'liquidify'
import { PaginateByLiquid, RenderSnippet } from 'liquidex'
import classNames from 'classnames'

import { Card } from '../../components/Card'

import styles from './styles.css'

export const MainSearch = () => {
	const perPage = section.settings.products_per_page ?? 12

	return (
		<section className={classNames(styles.search, 'container', 'section-space')}>
			<div className={classNames(styles['page-heading'])}>
			<p className='eyebrow'>{t('search.eyebrow')}</p>
			<h1>
				{search.performed ? (
					search.results_count === 1 ? (
						<span>{t('search.results.one', {terms: search.terms})}</span>
					) : (
						<span>{t('search.results.other', {count: search.results_count, terms: search.terms})}</span>
					)
				) : (
					<span>{t('search.title')}</span>
				)}
			</h1>
			</div>

			<form action={routes.search_url} method='get' role='search' className={classNames(styles['search-form'])}>
				<input type='hidden' name='type' value='product' />
				<input type='hidden' name='options[prefix]' value='last' />
				<label htmlFor='SearchInput' className='visually-hidden'>
					{t('search.placeholder')}
				</label>
				<input
					id='SearchInput'
					type='search'
					name='q'
					value={escape(search.terms)}
					placeholder={t('search.placeholder')}
					className={classNames(styles['search-input'])}
				/>
				<button type='submit' className={classNames(styles['search-submit'])}>
					{t('general.search')}
				</button>
			</form>

			{search.performed && search.results.length > 0 ? (
				<PaginateByLiquid by={perPage} collection={search.results}>
					<div className='product-grid'>
						{search.results.map(
							(item: any) => item.object_type === 'product' && <RenderSnippet key={item.id} slot={Card} item={item} />,
						)}
					</div>

					{paginate.pages > 1 && (
						<div className={classNames(styles['pagination-footer'])}>
						<p className={classNames(styles['pagination-caption'])}>
							{t('pagination.page_of', {current_page: paginate.current_page, pages: paginate.pages})}
						</p>

						<nav className={classNames(styles.pagination)} aria-label={t('pagination.label')}>
							{paginate.previous && (
								<a
									className={classNames(styles['pagination-direction'])}
									href={paginate.previous.url}
									aria-label={t('pagination.prev')}
									rel='prev'
								>
									← <span>{t('pagination.previous')}</span>
								</a>
							)}

							{paginate.parts.map((part: any) => {
								const page_number = Number(part.title)

								return part.is_link ? (
									<a href={part.url} aria-label={t('pagination.go_to', {page: part.title})}>
										{escape(part.title)}
									</a>
								) : page_number == paginate.current_page ? (
									<span aria-current='page' aria-label={t('pagination.current', {page: part.title})}>
										{escape(part.title)}
									</span>
								) : (
									<span className={classNames(styles['pagination-ellipsis'])} aria-hidden='true'>
										{escape(part.title)}
									</span>
								)
							})}

							{paginate.next && (
								<a
									className={classNames(styles['pagination-direction'])}
									href={paginate.next.url}
									aria-label={t('pagination.next')}
									rel='next'
								>
									<span>{t('pagination.next_short')}</span> →
								</a>
							)}
							</nav>
						</div>
					)}
				</PaginateByLiquid>
			) : (
				search.performed && (
					<div className='empty-state'>
						<span className='empty-spark' aria-hidden='true'>
							✳
						</span>
					<h2>{t('search.empty_title')}</h2>
					<p>{t('search.empty_text')}</p>
					<a className='text-link' href={routes.all_products_collection_url}>
						{t('collection.view_all')}
							<span aria-hidden='true'>↗</span>
						</a>
					</div>
				)
			)}
		</section>
	)
}

export default (MainSearch.schema = {
	name: 't:sections.main_search.name',
	settings: [
		{
			type: 'range',
			id: 'products_per_page',
			label: 't:sections.main_search.settings.products_per_page.label',
			min: 6,
			max: 36,
			step: 6,
			default: 12,
		},
	],
})
