'use sections'

import { RenderSnippet } from 'liquidex'
import classNames from 'classnames'

import { TopBar } from '../../components/Bar/Top'
import { MenuDesktop } from '../../components/Menu/Desktop'
import { HeaderUserOptions } from './User'
import { MenuMobile } from '../../components/Menu/Mobile'

import styles from './styles.css'

export const Header = () => {
	return (
		<div className={classNames(styles['header-shell'])}>
			<RenderSnippet slot={TopBar} blocks={section.blocks} />

			<header className={classNames(styles['site-header'], 'container')}>
				<div className={classNames(styles['header-leading'])}>
					<RenderSnippet slot={MenuMobile} options={linklists['main-menu'].links} />
				</div>

				<a className='wordmark' href={routes.root_url} aria-label={"'header.home_page' | t"}>
					{'settings.brand_name | default: shop.name | escape'}
				</a>

				<nav className={classNames(styles['desktop-nav'])} aria-label={"'header.main_menu' | t"}>
					<RenderSnippet slot={MenuDesktop} options={linklists['main-menu'].links} />
				</nav>

				<RenderSnippet slot={HeaderUserOptions} />
			</header>
		</div>
	)
}

export default (Header.schema = {
	name: 'Header',
	blocks: [
		{
			type: 'message',
			name: 'Mensagem',
			settings: [
				{
					type: 'text',
					id: 'text',
					label: 'Texto',
					default: 'Escolha seus favoritos. Compre com segurança.',
				},
			],
		},
	],
})
