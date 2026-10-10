import { _Maybe } from 'funcio'
import { useEventListener } from './useCustomEvent'
import { RefObject } from 'preact'

interface TRefWithContainsMethod<T extends HTMLElement = HTMLElement> extends RefObject<T> {
	current: T | null
}

export const useClickOutside = (ref: TRefWithContainsMethod, cb: (event: Event) => void, ignoreSelectors: string[] = []) => {
	useEventListener('click', (event: Event) => {
		const target = _Maybe
			.of(event)
			.map((event) => event.target as HTMLElement | null)
			.getOrElse(null)

		if (!target) return
		if (!ref.current) return

		if (ref.current.contains(target)) return

		const shouldIgnore = ignoreSelectors.some((selector) => target.closest(selector))

		if (shouldIgnore) return

		cb(event)
	})
}
