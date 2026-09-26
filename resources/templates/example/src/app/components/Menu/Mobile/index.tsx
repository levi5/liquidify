'use snippets'

import { RenderSvg } from 'liquidex'
import type { LinksType } from '../../../../types/components/menu'

import { MenuMobileModal } from './modal'

import styles from './styles.css'

export const MenuMobile = ({ options }: { options: LinksType }) => {
	return (
		<div className={styles.menuMobile}>
			<button
				type='button'
				aria-haspopup='dialog'
				aria-controls='menu-mobile-dialog'
				aria-label={"'header.open_menu' | t"}
				onClick={() => window.LiquidifyEmitEvent('message::menu-mobile', true)}
			>
				<RenderSvg name='menu.svg' />
			</button>
			<MenuMobileModal options={options} />
		</div>
	)
}
