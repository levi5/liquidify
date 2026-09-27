'use snippets'

import { t } from 'liquidify'

import './styles.css'

export const Breadcrumb = ({ className = '' }: { className?: string }) => {
	const Collection = () => {
		return (
			<li>
				<span className='separator' aria-hidden='true'>
					/
				</span>
				{current_tags && (
					<>
						<a href={collection.url}>{collection.title}</a>
						<span className='separator' aria-hidden='true'>
							/
						</span>
						<span className='current' aria-current='page'>
							{current_tags.join(' + ')}
						</span>
					</>
				)}
				{!current_tags && (
					<span className='current' aria-current='page'>
						{collection.title}
					</span>
				)}
			</li>
		)
	}

	const Product = () => (
		<li>
			<span className='separator' aria-hidden='true'>
				/
			</span>
			{collection.url ? (
				<a href={collection.url}>{collection.title}</a>
			) : product.collections && product.collections.length > 0 ? (
				<a href={product.collections[0].url}>{product.collections[0].title}</a>
			) : (
				<a href={routes.all_products_collection_url}>{t('general.shop')}</a>
			)}
			<span className='separator' aria-hidden='true'>
				/
			</span>
			<span className='current' aria-current='page'>
				{product.title}
			</span>
		</li>
	)

	return (
		<nav className={`breadcrumbs ${className}`} aria-label={t('products.product.breadcrumbs')}>
			<ol>
				<li>
					<a href={routes.root_url} title={t('general.home')}>
						{t('general.home')}
					</a>
				</li>
				{template.name === 'collection' && collection.handle && <Collection />}
				{template.name === 'product' && <Product />}
				{template.name === 'page' && (
					<li>
						<span className='separator' aria-hidden='true'>
							/
						</span>
						<span className='current' aria-current='page'>
							{page.title}
						</span>
					</li>
				)}
			</ol>
		</nav>
	)
}
