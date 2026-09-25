'use react'

import { createContext } from 'preact'
import { FC } from 'preact/compat'
import { useState, useEffect, useContext, useRef, useCallback } from 'preact/hooks'

type Context = {
	open: boolean
	handleClose: () => void
	handleOpen: () => void
}

const DrawerContext = createContext<Context>({} as Context)

export const DrawerProvider: FC<{ name: string }> = ({ children, name }) => {
	const [state, setState] = useState({ open: false })
	const openerRef = useRef<HTMLElement | null>(null)

	const handleClose = useCallback(() => setState({ open: false }), [])

	const handleOpen = useCallback(() => {
		openerRef.current = (document.activeElement as HTMLElement | null) ?? null
		setState({ open: true })
	}, [])


	useEffect(() => {
		if (state.open) return

		const opener = openerRef.current
		openerRef.current = null
		opener?.focus?.()
	}, [state.open])

	useEffect(() => {
		if (!state.open) return

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return
			handleClose()
		}

		document.addEventListener('keydown', onKeyDown)

		return () => document.removeEventListener('keydown', onKeyDown)
	}, [state.open, handleClose])

	return (
		<DrawerContext.Provider value={{ open: state.open, handleClose, handleOpen }}>
			{children}
		</DrawerContext.Provider>
	)
}

export const useDrawerContext = () => {
	const context = useContext(DrawerContext)

	if (!context) {
		throw new Error('useDrawerContext must be used within a DrawerContextProvider')
	}

	return context
}
