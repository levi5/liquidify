'use react'

import { Drawer } from '../../Drawer'
import { DrawerHeader } from '../../Drawer/Header'
import { translate } from '../../../i18n/translate'

import type { LinksType } from '../../../../types/components/menu'

import './styles.css'

const OVERVIEW_LABEL: Record<string, [string, string]> = {
	'/collections/feminino': ['header.view_women', 'Ver coleção feminina ↗'],
	'/collections/masculino': ['header.view_men', 'Ver coleção masculina ↗'],
	'/collections/all': ['header.view_accessories', 'Ver todos os acessórios ↗'],
}

const overviewFor = (url: string, title: string) => {
	const [key, fallback] = OVERVIEW_LABEL[url] ?? ['header.view_all_in', 'Ver tudo em {{ title }} ↗']

	return translate(key, fallback, { title })
}

type MenuLink = { title?: string; handle?: string; url?: string; links?: MenuLink[] }

// Merchant data is not guaranteed: a missing/renamed link list arrives as
// null, and link drops may omit `links` or `title`. Normalizing here keeps a
// single odd entry from rendering an empty anchor or killing the island.
const toMenuLinks = (value: unknown): MenuLink[] => {
	if (Array.isArray(value)) return value as MenuLink[]

	const nested = (value as { links?: unknown } | null | undefined)?.links

	return Array.isArray(nested) ? (nested as MenuLink[]) : []
}

const childrenOf = (link: MenuLink): MenuLink[] => (Array.isArray(link.links) ? link.links : [])

const labelOf = (link: MenuLink): string => link.title || link.handle || link.url || ''

export const MenuMobileModal = ({ options }: { options: LinksType }) => {
	const links = toMenuLinks(options)

	return (
		<Drawer.Root name='menu-mobile'>
			<Drawer.Content eventName='menu-mobile' orientation='left' overlay={true} width='min(420px, 100vw)'>
				<div className={'menuMobileDrawer'} id='menu-mobile-dialog'>
					<DrawerHeader title={translate('cart.menu_title', 'Explore a Liquidify.')} />

					<nav className={'menuMobileNav'} aria-label={translate('header.main_menu', 'Menu principal')}>
					{links.map((link) => {
							const children = childrenOf(link)
							const label = labelOf(link)

							return children.length > 0 ? (
								<details className={'menuMobileGroup'} key={link.url} name='menu-mobile-nav'>
									<summary>
										{label}
										<span className={'mobileChevron'} aria-hidden='true'></span>
									</summary>
									<div className={'menuMobileSubmenu'}>
										<a className={'menuMobileOverview'} data-menu-overview href={link.url}>
											{overviewFor(link.url ?? '', label)}
										</a>
										{children.map((child) => (
											<div className={'menuMobileChildGroup'} key={child.url}>
												<a className={'menuMobileSubLink'} data-menu-child href={child.url}>
													{labelOf(child)}
												</a>
												{childrenOf(child).map((grandchild) => (
													<a className={'menuMobileGrandchild'} data-menu-grandchild href={grandchild.url}>
														{labelOf(grandchild)}
													</a>
												))}
											</div>
										))}
									</div>
								</details>
							) : (
								<a className={'menuMobileTopLink'} data-menu-item key={link.url} href={link.url}>
									{label}
								</a>
							)
						})}
					</nav>
				</div>
			</Drawer.Content>
		</Drawer.Root>
	)
}
