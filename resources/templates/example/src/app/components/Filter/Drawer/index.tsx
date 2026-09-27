'use react'

import { useLayoutEffect, useRef, useState } from 'preact/hooks'

import { translate } from '../../../i18n/translate'

import './styles.css'

const MOBILE_QUERY = '(max-width: 1024px)'

export const FilterDrawer = ({ sectionId }: { sectionId: string }) => {
	const dialog = useRef<HTMLDialogElement>(null)
	const contents = useRef<HTMLDivElement>(null)
	const trigger = useRef<HTMLButtonElement>(null)
	const [open, setOpen] = useState(false)

	const handleClose = () => {
		dialog.current?.close()
		setOpen(false)

		if (window.matchMedia(MOBILE_QUERY).matches) trigger.current?.focus()
	}

	useLayoutEffect(() => {
		const form = document.getElementById(`CollectionFilters-${sectionId}`) as HTMLFormElement | null
		const sidebar = form?.closest<HTMLElement>('.catalog-sidebar')
		const source = sidebar?.querySelector<HTMLElement>('[data-filter-source]')
		const sections = source?.querySelector<HTMLDetailsElement>('.sidebar-sections')
		const modal = dialog.current
		const body = contents.current

		if (!form || !sidebar || !source || !sections || !modal || !body) return

		const mobile = window.matchMedia(MOBILE_QUERY)

		const moveSections = () => {
			if (mobile.matches) {
				sections.open = true
				body.appendChild(sections)
			} else {
				modal.close()
				source.appendChild(sections)
			}
		}

		const sort = form.elements.namedItem('sort_by') as HTMLSelectElement | null
		const applySort = () => form.requestSubmit()

		sort?.addEventListener('change', applySort)
		mobile.addEventListener('change', moveSections)
		moveSections()
		sidebar.setAttribute('data-drawer-ready', '')

		return () => {
			modal.close()
			source.appendChild(sections)
			sidebar.removeAttribute('data-drawer-ready')
			mobile.removeEventListener('change', moveSections)
			sort?.removeEventListener('change', applySort)
		}
	}, [sectionId])

	useLayoutEffect(() => {
		const modal = dialog.current

		if (!modal) return

		modal.addEventListener('close', handleClose)

		return () => modal.removeEventListener('close', handleClose)
	}, [])

	useLayoutEffect(() => {
		if (!open) return

		const previous = document.body.style.overflow
		document.body.style.overflow = 'hidden'

		return () => {
			document.body.style.overflow = previous
		}
	}, [open])

	return (
		<>
			<button
				ref={trigger}
				type='button'
				className='button button-outline mobile-filter-trigger'
				aria-haspopup='dialog'
				aria-controls={`FilterDrawer-${sectionId}`}
				aria-expanded={open}
				onClick={() => {
					dialog.current?.showModal()
					setOpen(true)
				}}
			>
				<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' aria-hidden='true'>
					<path d='M3 7h4m4 0h10M3 17h10m4 0h4M7 4v6m6 4v6' />
				</svg>
				{translate('filters.filter_products', 'Filtrar produtos')}
			</button>

			<dialog
				ref={dialog}
				id={`FilterDrawer-${sectionId}`}
				className='collection-filter-dialog'
				aria-labelledby={`FilterTitle-${sectionId}`}
				onClick={(event) => {
					if (!dialog.current || event.target !== dialog.current) return

					const rect = dialog.current.getBoundingClientRect()
					const outside =
						event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom

					if (outside) handleClose()
				}}
			>
				<div className='dialog-header'>
					<div>
						<p className='eyebrow'>{translate('filters.refine', 'REFINE SUA SELEÇÃO')}</p>
						<h2 id={`FilterTitle-${sectionId}`}>{translate('filters.title', 'Filtros')}</h2>
					</div>

					<button type='button' className='icon-button' aria-label={translate('filters.close', 'Fechar filtros')} onClick={handleClose}>
						<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' aria-hidden='true'>
							<path d='m6 6 12 12M6 18 18 6' />
						</svg>
					</button>
				</div>

				<div className='filter-drawer-body' ref={contents} />
			</dialog>
		</>
	)
}
