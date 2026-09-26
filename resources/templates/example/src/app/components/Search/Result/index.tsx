'use react'

import { useEffect, useRef, useState } from 'preact/hooks'
import { _Maybe } from 'funcio'
import classNames from 'classnames'

import { useClickOutside } from '../../../../hooks/useClickOutside'
import { translate } from '../../../i18n/translate'
import { ResultSkeleton } from './Skeleton'

import styles from './styles.css'

type PredictiveProduct = {
	id: string | number
	title: string
	url: string
	featured_image?: string | { url?: string; src?: string } | null
	image?: string | { url?: string; src?: string } | null
}

const resolveImageUrl = (product: PredictiveProduct): string | null => {
	const raw = product.featured_image ?? product.image ?? null
	if (!raw) return null
	if (typeof raw === 'string') return raw
	return raw.url ?? raw.src ?? null
}

export const SearchResult = ({ elementId, id, listId }: { id: string; elementId: string; listId?: string }) => {
	const [open, setOpen] = useState(false)
	const [term, setTerm] = useState('')
	const [products, setProducts] = useState<PredictiveProduct[]>([])
	const [loading, setLoading] = useState(false)
	const ref = useRef<HTMLDivElement | null>(null)
	const abortRef = useRef<AbortController | null>(null)
	const debounceRef = useRef<number | null>(null)

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

	const getSuggestions = async (term: string, signal: AbortSignal) => {
		if (!term) {
			setOpen(false)
			setProducts([])
			setLoading(false)
			return
		}

		setLoading(true)
		try {
			const response = await fetch(`/search/suggest?q=${encodeURIComponent(term)}&resources[type]=product&resources[limit]=4`, {
				signal,
				headers: { Accept: 'application/json' },
			})
			if (!response.ok) {
				setProducts([])
				setOpen(false)
				return
			}
			const data = await response.json()

			const products = _Maybe
				.of(data)
				.map((data) => data.resources?.results?.products ?? data.products)
				.map((products) => (Array.isArray(products) ? products : []))
				.getOrElse([] as PredictiveProduct[])

			if (signal.aborted) return
			setProducts(products)
			setOpen(true)
		} catch (error) {
			if ((error as Error)?.name === 'AbortError') return
			setProducts([])
			setOpen(false)
		} finally {
			if (!signal.aborted) setLoading(false)
		}
	}

	useEffect(() => {
		if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
		abortRef.current?.abort()

		if (!term.trim()) {
			setOpen(false)
			setProducts([])
			setLoading(false)
			return
		}

		const controller = new AbortController()
		abortRef.current = controller
		debounceRef.current = window.setTimeout(() => {
			getSuggestions(term.trim(), controller.signal)
		}, 300)

		return () => {
			if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
			controller.abort()
		}
	}, [term])

	useEffect(() => {
		const input = document.getElementById(id) as HTMLInputElement | null
		if (!input) return
		input.setAttribute('aria-expanded', String(open && products.length > 0))
	}, [open, products.length, id])

	useEffect(() => {
		const handleKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpen(false)
		}
		document.addEventListener('keydown', handleKey)
		return () => document.removeEventListener('keydown', handleKey)
	}, [])

	const hasProduct = products.length > 0
	const isLoading = loading && !hasProduct
	const isOpen = open && (hasProduct || loading)
	const statusText =
		term.trim() && isOpen
			? translate('search.results.other', '{{ count }} resultados para “{{ terms }}”', {
					count: products.length,
					terms: term.trim(),
				})
			: ''

	return (
		<div
			key={elementId}
			id={listId}
			ref={ref}
			aria-busy={loading}
			className={classNames('searchResult', {
				['empty']: !isOpen,
			})}
		>
			<div className={'painel'}>
				<div className={'header'}>
					<span>{translate('search.eyebrow', 'Produtos similares')}</span>
					<a href={`/search?q=${encodeURIComponent(term.trim())}&type=product`}>
						{translate('collection.view_all', 'Ver todos os produtos ↗')}
					</a>
				</div>

				<p className={'visually-hidden'} role='status' aria-live='polite'>
					{statusText}
				</p>

				{isLoading ? (
					<ResultSkeleton />
				) : (
					<ul className={'items'} role='listbox' aria-label={translate('general.search', 'Buscar')}>
						{products.slice(0, 3).map((product) => {
							const imageUrl = resolveImageUrl(product)
							return (
								<li key={product.id} className={'item'} role='option' aria-selected='false'>
									<a href={product.url}>
										{imageUrl && <img src={imageUrl} alt='' width='60' height='75' loading='lazy' decoding='async' />}
										<span className={'itemTitle'}>{product.title}</span>
									</a>
								</li>
							)
						})}
					</ul>
				)}
			</div>
		</div>
	)
}
