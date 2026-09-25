import { useEffect, useRef } from 'preact/hooks'

type TElement = Window | Document | Element
export const useEventListener = (eventType: string, callback: (event: Event) => void, element: TElement = window) => {
	if (!element) return

	const callbackRef = useRef(callback)

	useEffect(() => {
		callbackRef.current = callback
	}, [callback])

	useEffect(() => {
		if (element == null) return

		const handler = (event: Event) => callbackRef.current(event)
		element.addEventListener(eventType, handler)

		return () => element.removeEventListener(eventType, handler)
	}, [eventType, element])
}

export const useDispatchEvent = <T>(eventName: string, data: T, element: TElement = window) => {
	if (!element) return
	const customEvent = new CustomEvent(eventName, { detail: data })
	element.dispatchEvent(customEvent)
}
