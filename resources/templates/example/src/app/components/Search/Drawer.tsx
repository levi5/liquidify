'use react'

import { useCallback, useRef } from 'preact/hooks'

import { Drawer } from '../Drawer'
import { DrawerHeader } from '../Drawer/Header'
import { translate } from '../../i18n/translate'

import './Drawer.css'

export const SearchDrawer = () => {
	const inputRef = useRef<HTMLInputElement>(null)
	const focusInput = useCallback(() => inputRef.current?.focus(), [])

	return (
		<Drawer.Root name='search-drawer'>
			<Drawer.Trigger>
				<button type='button' className={'searchTrigger'} aria-label={translate('header.search_products', 'Buscar produtos')}>
					<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' aria-hidden='true'>
						<circle cx='10.5' cy='10.5' r='6.5' />
						<path d='m16 16 4.5 4.5' />
					</svg>
				</button>
			</Drawer.Trigger>

			<Drawer.Content eventName='search-drawer' orientation='right' overlay={true} width='min(560px, 100vw)' onOpen={focusInput}>
				<div className={'searchDrawer'}>
					<DrawerHeader title={translate('cart.search_title', 'Encontre seu próximo look.')} />

					<form className={'searchBody'} action='{{ routes.search_url }}' method='get'>
						<label className={'searchLabel'} htmlFor='SearchDrawerInput'>
							{translate('cart.search_label', 'Busque por um produto, categoria ou estilo')}
						</label>

						<div className={'searchField'}>
							<input
								ref={inputRef}
								id='SearchDrawerInput'
								type='search'
								name='q'
								placeholder={translate('cart.search_placeholder', 'O seu próximo favorito…')}
								autoComplete='off'
							/>
							<button type='submit' aria-label={translate('cart.search_button', 'Buscar')}>
								→
							</button>
						</div>
					</form>

					<div className={'searchStart'}>
						<p className={'searchStartLabel'}>{translate('cart.start_here', 'COMECE POR AQUI')}</p>
						<a className='button button-outline' href='{{ routes.all_products_collection_url }}'>
							{translate('cart.explore_all', 'Explore todos os produtos ↗')}
						</a>
					</div>
				</div>
			</Drawer.Content>
		</Drawer.Root>
	)
}
