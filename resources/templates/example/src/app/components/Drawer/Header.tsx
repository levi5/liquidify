'use react'

import { DrawerAction } from './Action'

import { translate } from '../../i18n/translate'

import './styles.css'
import styles from './styles.css'

export const DrawerHeader = ({ title, count, onClose }: { title: string; count?: number; onClose?: () => void }) => {
	return (
		<div className={'drawerHeader'}>
			<div>
				<p className={'drawerEyebrow'}>{translate('cart.dialog_eyebrow', 'LIQUIDIFY / SUA SELEÇÃO')}</p>
				<h2 className={'drawerTitle'}>
					{title}
					{count !== undefined && ` (${count})`}
				</h2>
			</div>

			<DrawerAction action='close' className={'drawerClose'} onClick={onClose} aria-label={translate('general.close', 'Fechar')}>
				<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' aria-hidden='true'>
					<path d='m6 6 12 12M6 18 18 6' />
				</svg>
			</DrawerAction>
		</div>
	)
}
