'use react'

import classNames from 'classnames'
import { useEffect, useRef, useState } from 'preact/hooks'

import { clampQuantity } from '../../../context/Product/product.helpers'
import { showToast } from '../../../../shared/events/toast'

import './styles.css'

const MinusIcon = () => (
	<svg width='14' height='14' viewBox='0 0 14 14' fill='none' aria-hidden='true' focusable='false' xmlns='http://www.w3.org/2000/svg'>
		<path d='M2 7h10' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
	</svg>
)

const PlusIcon = () => (
	<svg width='14' height='14' viewBox='0 0 14 14' fill='none' aria-hidden='true' focusable='false' xmlns='http://www.w3.org/2000/svg'>
		<path d='M7 2v10M2 7h10' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
	</svg>
)

type QuantitySelectorProps = {
	ariaLabel?: string
	className?: string
	compact?: boolean
	disabled?: boolean
	elementId?: string
	initialValue?: number
	syncKey?: number
	max?: number
	min?: number
	onChange?: (quantity: number) => void
}

export const QuantitySelector = ({ ariaLabel = 'Quantidade', className = '', compact = false, disabled = false, initialValue = 1, syncKey, max = 999, min = 1, onChange }: QuantitySelectorProps) => {
	const rootRef = useRef<HTMLDivElement>(null)
	const lastInvalidToastAtRef = useRef<number | null>(null)
	const [quantity, setQuantityState] = useState(() => clampQuantity(initialValue, min, max))
	const quantityRef = useRef(quantity)

	const prevResetKeyRef = useRef(`${initialValue}::${syncKey}`)

	useEffect(() => {
		const resetKey = `${initialValue}::${syncKey}`
		const isReset = prevResetKeyRef.current !== resetKey
		prevResetKeyRef.current = resetKey

		const nextQuantity = isReset ? clampQuantity(initialValue, min, max) : clampQuantity(quantityRef.current, min, max)

		quantityRef.current = nextQuantity
		setQuantityState(nextQuantity)
	}, [initialValue, max, min, syncKey])

	const commitQuantity = (nextQuantity: number) => {
		const safeQuantity = clampQuantity(nextQuantity, min, max)

		quantityRef.current = safeQuantity
		setQuantityState(safeQuantity)

		return safeQuantity
	}

	const updateQuantity = (nextQuantity: number) => {
		if (disabled) return

		const safeQuantity = commitQuantity(nextQuantity)

		const clampedByMax = Number.isFinite(nextQuantity) && nextQuantity > max && safeQuantity === max
		if (clampedByMax) {
			const now = Date.now()
			const lastToastAt = lastInvalidToastAtRef.current
			if (!lastToastAt || now - lastToastAt > 1200) {
				lastInvalidToastAtRef.current = now
				showToast({ variant: 'warning', title: 'Quantidade indisponível', message: `Quantidade máxima disponível: ${max}.` })
			}
		}

		onChange?.(safeQuantity)
		rootRef.current?.dispatchEvent(new CustomEvent('product:quantity-change', { bubbles: true, detail: { quantity: safeQuantity } }))
	}

	const handleInput = (event: Event) => {
		const input = event.currentTarget as HTMLInputElement
		const nextQuantity = Number(input.value)
		const safeQuantity = clampQuantity(nextQuantity, min, max)

		updateQuantity(nextQuantity)

		if (input.value !== String(safeQuantity)) {
			input.value = String(safeQuantity)
		}
	}

	const stepQuantity = (step: number) => {
		updateQuantity(quantityRef.current + step)
	}

	return (
		<div ref={rootRef} className={classNames('quantitySelector', { compact }, className)} data-product-quantity aria-disabled={disabled}>
			<button type='button' aria-label='Diminuir quantidade' disabled={disabled || quantity <= min} onClick={() => stepQuantity(-1)}>
				<MinusIcon />
			</button>
			<input aria-label={ariaLabel} disabled={disabled} inputMode='numeric' min={min} max={max} type='number' value={quantity} onInput={handleInput} />
			<button type='button' aria-label='Aumentar quantidade' disabled={disabled || quantity >= max} onClick={() => stepQuantity(1)}>
				<PlusIcon />
			</button>
		</div>
	)
}
