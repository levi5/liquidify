'use react'

import { useEffect, useRef, useState } from 'preact/hooks'
import { _Maybe } from 'funcio'
import classNames from 'classnames'

import { useClickOutside } from '../../../../hooks/useClickOutside'

import styles from './styles.css'

export const SearchResult = ({ elementId, id, listId }: { id: string; elementId: string; listId?: string }) => {
	const [open, setOpen] = useState(false)
	const [term, setTerm] = useState('')
	const [products, setProducts] = useState<any[]>([])
	const ref = useRef<HTMLDivElement | null>(null)



	useClickOutside(ref, () => setOpen(false), [id])
	useEffect(() => {
		const input = document.getElementById(id) as HTMLInputElement | null

		if (!input) return

		const handleInput = (e: Event) => {
			setTerm((e.target as HTMLInputElement).value)
		}

		const handleClick = () => setOpen(true)

		input.addEventListener('input', handleInput)
		input.addEventListener('click', handleClick)

		return () => {
			input.removeEventListener('input', handleInput)
			input.removeEventListener('click', handleClick)
		}
	}, [id])


	const getSuggestions = async (term: string) => {
		if (!term) {
			setOpen(false)
			setProducts([])
			return
		}

		const response = await fetch(`/search?q=${encodeURIComponent(term)}&view=products&type=product`)
		const data = await response.json()

		const products = _Maybe
			.of(data)
			.map((data) => data.products)
			.map((products) => products)
			.getOrElse([])

		setProducts(products)
		setOpen(true)
	}

	useEffect(() => {
		getSuggestions(term)
	}, [term])

	const hasProduct = products.length > 0

	return (
		<div
			key={elementId}
			id={listId}
			ref={ref}
			className={classNames('searchResult', {
				['empty']: !hasProduct || !open,
			})}
		>
			<div className={'painel'}>
				<div className={'header'}>
					<span>Produtos Similares</span>
					<span>Ver todos os produtos</span>
				</div>

				<ul className={'items'}>
					{products.slice(0, 3).map(({ id, title, url, featured_image }) => (
						<li key={id} className={'item'}>
							<a href={url}>
								<img src={`${featured_image} | image_url: width: 120`} alt={title} width='60' height='75' loading='lazy' />
								<span className={'itemTitle'}>{title}</span>
							</a>
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}
