'use snippets'

import './styles.css'

export const Breadcrumb = ({ className = '' }: { className?: string }) => {
	const Collection = () => {
		return (
			<>
				<span className='separator'>/</span>
				{current_tags && (
					<>
						<a href={collection.url}>{collection.title}</a>
						<span className='separator'>/</span>
						<span className='current'>{current_tags.join(' + ')}</span>
					</>
				)}
				{!current_tags && <span className='current'>{collection.title}</span>}
			</>
		)
	}

	const Product = () => (
		<>
			<span className='separator'>/</span>
			{collection.url ? (
				<a href={collection.url}>{collection.title}</a>
			) : product.collections && product.collections.length > 0 ? (
				<a href={product.collections[0].url}>{product.collections[0].title}</a>
			) : (
				<a href={routes.all_products_collection_url}>{"'general.shop' | t"}</a>
			)}
			<span className='separator'>/</span>
			<span className='current'>{product.title}</span>
		</>
	)

	return (
		<nav className={`breadcrumbs ${className}`} aria-label='breadcrumbs'>
			<a href={routes.root_url} title='Voltar para a página inicial'>
				{"'general.home' | t"}
			</a>
			{template.name === 'collection' && collection.handle && <Collection />}
			{template.name === 'product' && <Product />}
			{template.name === 'page' && (
				<>
					<span className='separator'>/</span>
					<span className='current'>{page.title}</span>
				</>
			)}
		</nav>
	)
}
