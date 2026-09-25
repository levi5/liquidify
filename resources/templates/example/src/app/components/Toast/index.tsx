'use react'

import { useEffect, useRef, useState } from 'preact/hooks'

import type { ToastEventDetail, ToastPosition } from '../../../shared/events/toast'
import { TOAST_EVENT } from '../../../shared/events/toast'

import styles from './styles.css'

type ToastHostProps = {
	position?: ToastPosition
}

export const ToastHost = ({ position = 'bottom-right' }: ToastHostProps) => {
	const [toast, setToast] = useState<ToastEventDetail | null>(null)
	const hideTimerRef = useRef<number | null>(null)

	const close = () => setToast(null)

	useEffect(() => {
		const clearTimer = () => {
			if (hideTimerRef.current === null) return
			window.clearTimeout(hideTimerRef.current)
			hideTimerRef.current = null
		}

		const handleToast = (event: Event) => {
			const customEvent = event as CustomEvent<ToastEventDetail>
			const detail = customEvent.detail
			if (!detail?.message) return

			clearTimer()
			setToast(detail)

			const duration = detail.durationMs ?? 4000
			if (duration > 0) {
				hideTimerRef.current = window.setTimeout(() => {
					setToast(null)
				}, duration)
			}
		}

		window.addEventListener(TOAST_EVENT, handleToast)
		return () => {
			clearTimer()
			window.removeEventListener(TOAST_EVENT, handleToast)
		}
	}, [])

	if (!toast) return null

	return (
		<div className={`toastHost ${position === 'bottom-left' ? 'bottomLeft' : 'bottomRight'}`} role={toast.variant === 'error' ? 'alert' : 'status'} aria-live='polite'>
			<div className={`toastAlert ${toast.variant}`} role={toast.variant === 'error' ? 'alert' : 'status'}>
				<div className='toastContent'>
					{toast.title && <strong className='toastTitle'>{toast.title}</strong>}
					<div className='toastMessage'>{toast.message}</div>
				</div>
				<button type='button' className='toastClose' aria-label='Fechar' onClick={close}>
					×
				</button>
			</div>
		</div>
	)
}
