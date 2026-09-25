import { IEither } from 'funcio'
import { left, right } from 'funcio/lib/Monads/Either'

export const $DomFind = (ref: string, element?: Element | Document): IEither.Either<null, Element> => {
	const hasWindow = typeof window !== 'undefined'

	if (!hasWindow) return left(null)
	const dom = element ?? document
	const $element = dom.querySelector(ref)

	return $element ? right($element) : left(null)
}

export const $DomFindAll = <T extends Element>(ref: string, element?: Element): IEither.Either<null, NodeListOf<T>> => {
	const hasWindow = typeof window !== 'undefined'

	if (!hasWindow) return left(null)
	const dom = element ?? document
	const $element = dom.querySelectorAll<T>(ref)

	return $element && !!$element.length ? right($element) : left(null)
}
