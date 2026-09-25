'use react'

import { cloneElement } from 'preact'
import { FC, ReactElement } from 'preact/compat'
import { useDrawerContext } from '../../../../global/context/Drawer/drawer.context'

export const DrawerTrigger: FC<{ children: ReactElement }> = ({ children }) => {
	const { handleOpen } = useDrawerContext()

	if (Array.isArray(children)) return null

	const { props = {} } = children
	const newChildren = cloneElement(children, { ...props, onClick: handleOpen })

	return (
		<div onClick={handleOpen} style={{ width: '100%', height: 'inherit' }}>
			{newChildren}
		</div>
	)
}
