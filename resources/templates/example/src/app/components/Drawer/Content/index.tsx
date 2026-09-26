'use react'

import { useEffect, useRef } from 'preact/hooks'
import { _Maybe } from 'funcio'
import type { FC } from 'preact/compat'
import classNames from 'classnames'

import { Portal } from '../../Portal'
import { translate } from '../../../i18n/translate'

import { useDrawerContext } from '../../../../global/context/Drawer/drawer.context'
import { useEventListener } from '../../../../hooks/useCustomEvent'

import './styles.css'

export const DrawerContent: FC<{
	width?: number | string
	orientation: 'left' | 'right'
	overlay: boolean
	zIndex?: number
	eventName?: string
	label?: string
	onOpen?: () => void
}> = ({ children, overlay = true, eventName = '', orientation, width = '75%', zIndex = 50, label, onOpen }) => {
	const { open, handleClose, handleOpen } = useDrawerContext()
	const dialogRef = useRef<HTMLDialogElement | null>(null)
	const triggerRef = useRef<HTMLElement | null>(null)
	const receivedRef = useRef(false)
	const eventKey = `message::${eventName}`

	useEventListener(eventKey, (event: any) => {
		receivedRef.current = true

		const data = _Maybe
			.of(event)
			.map((event) => event.detail)
			.map((detail) => detail)
			.getOrElse(false)

		data ? handleOpen() : handleClose()
	})

	// The trigger can fire before this island hydrates; replay what was lost.
	// Always drains, so a remount (theme editor) never replays a stale open.
	useEffect(() => {
		if (!eventName) return

		const pending = window.LiquidifyTakePendingEvents?.(eventKey) ?? []
		if (receivedRef.current) return

		for (const data of pending) {
			data ? handleOpen() : handleClose()
		}
	}, [eventKey, eventName, handleOpen, handleClose])

	useEffect(() => {
		if (open) onOpen?.()
	}, [open, onOpen])

	useEffect(() => {
		const body = document.body

		if (!body || !open) return

		triggerRef.current = document.activeElement as HTMLElement | null
		body.style.overflow = 'hidden'
		dialogRef.current?.focus()

		const handleKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') handleClose()
			if (event.key !== 'Tab' || !dialogRef.current) return
			const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
			)
			if (focusable.length === 0) return
			const first = focusable[0]
			const last = focusable[focusable.length - 1]
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault()
				last.focus()
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault()
				first.focus()
			}
		}
		document.addEventListener('keydown', handleKey)

		return () => {
			document.removeEventListener('keydown', handleKey)
			const anyOpen = document.querySelector('dialog.drawerContent.open')
			if (!anyOpen) body.style.overflow = ''
			triggerRef.current?.focus?.()
		}
	}, [open, handleClose])

	return (
		<Portal containerRef='body'>
			{overlay && open && (
				<button
					type='button'
					tabIndex={-1}
					className={classNames('drawerOverlay', {
						active: open,
					})}
					style={{ zIndex }}
					onClick={handleClose}
					aria-label={translate('general.close', 'Fechar')}
				/>
			)}
			<dialog
				ref={dialogRef}
				open={open}
				className={classNames('drawerContent', orientation, {
					open: open,
				})}
				aria-modal='true'
				aria-label={label ?? translate('cart.bag_title', 'Sua sacola')}
				tabIndex={-1}
				style={{ width, zIndex: zIndex + 1 }}
			>
				{open && children}
			</dialog>
		</Portal>
	)
}
