'use snippets'

import { t, escape } from 'liquidify'
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
				<BaseEmptyState heading={t('collection.empty_heading')} text={t('collection.empty_text')} actionLabel={t('collection.view_all')} />
			)}

			{paginate.pages > 1 && (
				<div className={classNames(styles['pagination-footer'])}>
					<p className={classNames(styles['pagination-caption'])}>
						{t('pagination.page_of', {current_page: paginate.current_page, pages: paginate.pages})}
					</p>

					<nav className={classNames(styles.pagination)} aria-label={t('pagination.label')}>
						{paginate.previous && (
							<a className={classNames(styles['pagination-direction'])} href={paginate.previous.url} aria-label={t('pagination.prev')} rel='prev'>
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
							<a className={classNames(styles['pagination-direction'])} href={paginate.next.url} aria-label={t('pagination.next')} rel='next'>
								<span>{t('pagination.next_short')}</span> →
							</a>
						)}
					</nav>
				</div>
			)}
		</PaginateByLiquid>
	)
}
