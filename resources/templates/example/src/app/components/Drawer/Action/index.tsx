'use react'

import { HTMLAttributes } from 'preact'
import { FC } from 'preact/compat'

import { useDrawerContext } from '../../../../global/context/Drawer/drawer.context'

export const DrawerAction: FC<HTMLAttributes<HTMLDivElement> & { action: 'close' | 'open' }> = ({
	action,
	children,
	onClick,
	...props
}) => {
	const { handleClose, handleOpen } = useDrawerContext()

	const handleClick = action === 'close' ? handleClose : handleOpen

	return (
		<div {...props} onClick={onClick ?? handleClick} role='button' tabIndex={0}
			onKeyDown={(event) => {
				if (event.key !== 'Enter' && event.key !== ' ') return
				event.preventDefault()
				if (onClick) onClick(event as unknown as Parameters<NonNullable<typeof onClick>>[0])
				else handleClick()
			}}
		>
			{children}
		</div>
	)
}
