export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export type ToastPosition = 'bottom-left' | 'bottom-right'

export type ToastEventDetail = {
	message: string
	title?: string
	variant?: ToastVariant
	durationMs?: number
}

export const TOAST_EVENT = 'ui:toast'

export const showToast = (detail: ToastEventDetail) => {
	if (typeof window === 'undefined') return
	window.dispatchEvent(new CustomEvent<ToastEventDetail>(TOAST_EVENT, { detail }))
}
