'use react'

import { Drawer } from '../../Drawer'
import { DrawerHeader } from '../../Drawer/Header'
import { translate } from '../../../i18n/translate'

import type { LinksType } from '../../../../types/components/menu'

import './styles.css'

const FALLBACK_LINKS: LinksType = [
	{
		url: '{{ routes.root_url }}collections/all?sort_by=created-descending',
		title: translate('header.new', 'Novidades'),
		links: [],
	},
	{
		url: '/collections/feminino',
		title: translate('header.women', 'Feminino'),
		links: [
			{ url: '/collections/all/feminino+blusas', title: translate('header.women_tops', 'Blusas e camisetas'), links: [] },
			{ url: '/collections/all/feminino+jaquetas', title: translate('header.women_jackets', 'Jaquetas'), links: [] },
			{ url: '/collections/all/feminino+saias', title: translate('header.women_skirts', 'Saias e conjuntos'), links: [] },
		],
	},
	{
		url: '/collections/masculino',
		title: translate('header.men', 'Masculino'),
		links: [
			{ url: '/collections/all/masculino+camisas', title: translate('header.men_shirts', 'Camisas'), links: [] },
			{ url: '/collections/all/masculino+jaquetas', title: translate('header.men_jackets', 'Jaquetas'), links: [] },
			{ url: '/collections/all/masculino+alfaiataria', title: translate('header.men_tailoring', 'Alfaiataria'), links: [] },
		],
	},
	{
		url: '/collections/all',
		title: translate('header.accessories', 'Acessórios'),
		links: [
			{ url: '/collections/all/bolsas', title: translate('header.bags', 'Bolsas'), links: [] },
			{ url: '/collections/all/calcados', title: translate('header.shoes', 'Calçados'), links: [] },
		],
	},
]

const OVERVIEW_LABEL: Record<string, [string, string]> = {
	'/collections/feminino': ['header.view_women', 'Ver coleção feminina ↗'],
	'/collections/masculino': ['header.view_men', 'Ver coleção masculina ↗'],
	'/collections/all': ['header.view_accessories', 'Ver todos os acessórios ↗'],
}

const overviewFor = (url: string, title: string) => {
	const [key, fallback] = OVERVIEW_LABEL[url] ?? ['header.view_all_in', 'Ver tudo em {{ title }} ↗']

	return translate(key, fallback, { title })
}

export const MenuMobileModal = ({ options }: { options: LinksType }) => {
	const links = options && options.length > 3 ? options : FALLBACK_LINKS

	return (
		<Drawer.Root name='menu-mobile'>
			<Drawer.Content eventName='menu-mobile' orientation='left' overlay={true} width='min(420px, 100vw)'>
				<div className={'menuMobileDrawer'} id='menu-mobile-dialog'>
					<DrawerHeader title={translate('cart.menu_title', 'Explore a Liquidify.')} />

					<nav className={'menuMobileNav'} aria-label={translate('header.main_menu', 'Menu principal')}>
						{links.map((link) =>
							link.links && link.links.length > 0 ? (
								<details className={'menuMobileGroup'} key={link.url}>
									<summary>
										{link.title}
										<span className={'mobileChevron'} aria-hidden='true'></span>
									</summary>
									<div className={'menuMobileSubmenu'}>
										<a className={'menuMobileOverview'} data-menu-overview href={link.url}>
											{overviewFor(link.url, link.title)}
										</a>
										{link.links.map((child) => (
											<div key={child.url}>
												<a className={'menuMobileSubLink'} data-menu-child href={child.url}>
													{child.title}
												</a>
												{(child.links ?? []).map((grandchild) => (
													<a className={'menuMobileGrandchild'} data-menu-grandchild href={grandchild.url}>
														{grandchild.title}
													</a>
												))}
											</div>
										))}
									</div>
								</details>
							) : (
								<a className={'menuMobileTopLink'} data-menu-item key={link.url} href={link.url}>
									{link.title}
								</a>
							),
						)}
					</nav>
				</div>
			</Drawer.Content>
		</Drawer.Root>
	)
}
