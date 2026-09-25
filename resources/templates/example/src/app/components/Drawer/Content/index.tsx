'use react'

import { useEffect } from 'preact/hooks'
import { _Maybe } from 'funcio'
import type { FC } from 'preact/compat'
import classNames from 'classnames'

import { Portal } from '../../Portal'

import { useDrawerContext } from '../../../../global/context/Drawer/drawer.context'
import { useEventListener } from '../../../../hooks/useCustomEvent'

import './styles.css'

export const DrawerContent: FC<{
	width?: number | string
	orientation: 'left' | 'right'
	overlay: boolean
	zIndex?: number
	eventName?: string
	onOpen?: () => void
}> = ({ children, overlay = true, eventName = '', orientation, width = '75%', zIndex = 50, onOpen }) => {
	const { open, handleClose, handleOpen } = useDrawerContext()

	useEventListener(`message::${eventName}`, (event: any) => {
		const data = _Maybe
			.of(event)
			.map((event) => event.detail)
			.map((detail) => detail)
			.getOrElse(false)

		data ? handleOpen() : handleClose()
	})

	useEffect(() => {
		if (open) onOpen?.()
	}, [open, onOpen])

	useEffect(() => {
		const body = document.body

		if (!body || !open) return

		body.style.overflow = 'hidden'

		return () => {
			if (!document.querySelector('dialog.drawerContent.open')) body.style.overflow = ''
		}
	}, [open])

	return (
		<Portal containerRef='body'>
			{overlay && (
				<div
					tabIndex={0}
					role='button'
					className={classNames('drawerOverlay', {
						active: open,
					})}
					style={{ zIndex }}
					onClick={handleClose}
				/>
			)}
			<dialog
				className={classNames('drawerContent', orientation, {
					open: open,
				})}
				aria-hidden={!open}
				style={{ width, zIndex: zIndex + 1 }}
			>
				{children}
			</dialog>
		</Portal>
	)
}
