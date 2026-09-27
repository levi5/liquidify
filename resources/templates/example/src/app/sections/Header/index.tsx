'use sections'

import { t, escape, defaultValue } from 'liquidify'
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
					<RenderSnippet slot={MenuMobile} options={linklists['menu'].links} />
				</div>

			<a className='wordmark' href={routes.root_url} aria-label={t('header.home_page')}>
				{escape(defaultValue(settings.brand_name, shop.name))}
			</a>

			<nav className={classNames(styles['desktop-nav'])} aria-label={t('header.main_menu')}>
					<RenderSnippet slot={MenuDesktop} options={linklists['menu'].links} />
				</nav>

				<RenderSnippet slot={HeaderUserOptions} />
			</header>
		</div>
	)
}

export default (Header.schema = {
	name: 't:sections.header.name',
	tag: 'header',
	class: 'header-section',
	limit: 1,
	max_blocks: 3,
	blocks: [
		{
			type: 'message',
			name: 't:sections.header.blocks.message.name',
			settings: [
				{
					type: 'text',
					id: 'text',
					label: 't:sections.header.blocks.message.settings.text.label',
					default: 'Escolha seus favoritos. Compre com segurança.',
				},
			],
		},
	],
})
