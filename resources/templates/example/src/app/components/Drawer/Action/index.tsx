'use react'

import { ButtonHTMLAttributes } from 'preact'
import { FC } from 'preact/compat'

import { useDrawerContext } from '../../../../global/context/Drawer/drawer.context'

export const DrawerAction: FC<ButtonHTMLAttributes & { action: 'close' | 'open' }> = ({
	action,
	children,
	onClick,
	...props
}) => {
	const { handleClose, handleOpen } = useDrawerContext()

	const handleClick = action === 'close' ? handleClose : handleOpen

	return (
		<button type='button' {...props} onClick={onClick ?? handleClick}>
			{children}
		</button>
	)
}
