'use snippets'

import { PaginateByLiquid, RenderSnippet } from 'liquidex'
import classNames from 'classnames'

import { Card } from '../Card'
import { BaseEmptyState } from '../Base/EmptyState'

import styles from './styles.css'

export const Catalog = ({ by = 12 }: { by?: number }) => {
	return (
		<PaginateByLiquid by={by} collection={collection.products}>
			{collection.products.length > 0 ? (
				<div className={classNames(styles['product-grid'])}>
					{collection.products.map((item: any) => (
						<RenderSnippet key={item.id} slot={Card} item={item} />
					))}
				</div>
			) : (
				<BaseEmptyState heading={"'collection.empty_heading' | t"} text={"'collection.empty_text' | t"} actionLabel={"'collection.view_all' | t"} />
			)}

			{paginate.pages > 1 && (
				<div className={classNames(styles['pagination-footer'])}>
					<p className={classNames(styles['pagination-caption'])}>
						{"'pagination.page_of' | t: current_page: paginate.current_page, pages: paginate.pages"}
					</p>

					<nav className={classNames(styles.pagination)} aria-label={"'pagination.label' | t"}>
						{paginate.previous && (
							<a className={classNames(styles['pagination-direction'])} href={paginate.previous.url} aria-label={"'pagination.prev' | t"} rel='prev'>
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
							<a className={classNames(styles['pagination-direction'])} href={paginate.next.url} aria-label={"'pagination.next' | t"} rel='next'>
								<span>{"'pagination.next_short' | t"}</span> →
							</a>
						)}
					</nav>
				</div>
			)}
		</PaginateByLiquid>
	)
}
