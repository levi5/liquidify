'use sections'

import { PaginateByLiquid, RenderSnippet } from 'liquidex'
import classNames from 'classnames'

import { Card } from '../../components/Card'

import styles from './styles.css'

export const MainSearch = () => {
	const perPage = section.settings.products_per_page ?? 12

	return (
		<section className={classNames(styles.search, 'container', 'section-space')}>
			<div className={classNames(styles['page-heading'])}>
				<p className='eyebrow'>{"'search.eyebrow' | t"}</p>
				<h1>
					{search.performed ? (
						search.results_count === 1 ? (
							<span>{"'search.results.one' | t: terms: search.terms"}</span>
						) : (
							<span>{"'search.results.other' | t: count: search.results_count, terms: search.terms"}</span>
						)
					) : (
						<span>{"'search.title' | t"}</span>
					)}
				</h1>
			</div>

			<form action={routes.search_url} method='get' role='search' className={classNames(styles['search-form'])}>
				<input type='hidden' name='type' value='product' />
				<input type='hidden' name='options[prefix]' value='last' />
				<label htmlFor='SearchInput' className='visually-hidden'>
					{"'search.placeholder' | t"}
				</label>
				<input
					id='SearchInput'
					type='search'
					name='q'
					value='{{ search.terms | escape }}'
					placeholder={"'search.placeholder' | t"}
					className={classNames(styles['search-input'])}
				/>
				<button type='submit' className={classNames(styles['search-submit'])}>
					{"'general.search' | t"}
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
								{"'pagination.page_of' | t: current_page: paginate.current_page, pages: paginate.pages"}
							</p>

							<nav className={classNames(styles.pagination)} aria-label={"'pagination.label' | t"}>
								{paginate.previous && (
									<a
										className={classNames(styles['pagination-direction'])}
										href={paginate.previous.url}
										aria-label={"'pagination.prev' | t"}
										rel='prev'
									>
										← <span>{"'pagination.previous' | t"}</span>
									</a>
								)}

								{paginate.parts.map((part: any) => {
									const page_number = Number(part.title)

									return part.is_link ? (
										<a href={part.url} aria-label={"'pagination.go_to' | t: page: part.title"}>
											{'part.title | escape'}
										</a>
									) : page_number == paginate.current_page ? (
										<span aria-current='page' aria-label={"'pagination.current' | t: page: part.title"}>
											{'part.title | escape'}
										</span>
									) : (
										<span className={classNames(styles['pagination-ellipsis'])} aria-hidden='true'>
											{'part.title | escape'}
										</span>
									)
								})}

								{paginate.next && (
									<a
										className={classNames(styles['pagination-direction'])}
										href={paginate.next.url}
										aria-label={"'pagination.next' | t"}
										rel='next'
									>
										<span>{"'pagination.next_short' | t"}</span> →
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
						<h2>{"'search.empty_title' | t"}</h2>
						<p>{"'search.empty_text' | t"}</p>
						<a className='text-link' href={routes.all_products_collection_url}>
							{"'collection.view_all' | t"}
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
