'use react'

import { cloneElement } from 'preact'
import { FC, ReactElement } from 'preact/compat'
import { useDrawerContext } from '../../../../global/context/Drawer/drawer.context'

export const DrawerTrigger: FC<{ children: ReactElement }> = ({ children }) => {
	const { handleOpen } = useDrawerContext()

	if (Array.isArray(children)) return null

	const { props = {}, type } = children as { props?: Record<string, unknown>; type?: unknown }
	const originalOnClick = (props as { onClick?: (e: Event) => void }).onClick
	const newChildren = cloneElement(children, {
		...props,
		onClick: (e: Event) => {
			originalOnClick?.(e)
			if (!e.defaultPrevented) handleOpen()
		},
	} as Partial<typeof props>)

	void type
	return <>{newChildren}</>
}
