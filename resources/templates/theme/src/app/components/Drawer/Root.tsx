'use react'

import type { HTMLAttributes } from 'preact'
import type { FC } from 'preact/compat'

import { DrawerProvider } from '../../../global/context/Drawer/drawer.context'

export const Drawer: FC<{ name: string } & HTMLAttributes<HTMLDivElement>> = ({ children, name, ...props }) => {
	return (
		<DrawerProvider name={name}>
			<div {...props}>{children}</div>
		</DrawerProvider>
	)
}
