'use react'

import { useEffect, useRef, useState } from 'preact/hooks'

import { clampQuantity } from '../../../context/Product/product.helpers'
import { showToast } from '../../../../shared/events/toast'

import styles from './styles.css'

type QuantitySelectorProps = {
	ariaLabel?: string
	className?: string
	disabled?: boolean
	elementId?: string
	initialValue?: number
	syncKey?: number
	max?: number
	min?: number
	onChange?: (quantity: number) => void
}

export const QuantitySelector = ({ ariaLabel = 'Quantidade', className = '', disabled = false, initialValue = 1, syncKey, max = 999, min = 1, onChange }: QuantitySelectorProps) => {
	const rootRef = useRef<HTMLDivElement>(null)
	const lastInvalidToastAtRef = useRef<number | null>(null)
	const [quantity, setQuantityState] = useState(() => clampQuantity(initialValue, min, max))

	const prevResetKeyRef = useRef(`${initialValue}::${syncKey}`)

	useEffect(() => {
		const resetKey = `${initialValue}::${syncKey}`
		const isReset = prevResetKeyRef.current !== resetKey
		prevResetKeyRef.current = resetKey

		if (isReset) {
			setQuantityState(clampQuantity(initialValue, min, max))
		} else {
			setQuantityState((current) => clampQuantity(current, min, max))
		}
	}, [initialValue, max, min, syncKey])

	const updateQuantity = (nextQuantity: number) => {
		if (disabled) return

		const safeQuantity = clampQuantity(nextQuantity, min, max)

		const clampedByMax = Number.isFinite(nextQuantity) && nextQuantity > max && safeQuantity === max
		if (clampedByMax) {
			const now = Date.now()
			const lastToastAt = lastInvalidToastAtRef.current
			if (!lastToastAt || now - lastToastAt > 1200) {
				lastInvalidToastAtRef.current = now
				showToast({ variant: 'warning', title: 'Quantidade indisponível', message: `Quantidade máxima disponível: ${max}.` })
			}
		}

		setQuantityState(safeQuantity)
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

	return (
		<div ref={rootRef} className={`${'quantitySelector'} ${className}`} data-product-quantity aria-disabled={disabled}>
			<button type='button' aria-label='Diminuir quantidade' disabled={disabled || quantity <= min} onClick={() => updateQuantity(quantity - 1)}>
				-
			</button>
			<input aria-label={ariaLabel} disabled={disabled} inputMode='numeric' min={min} max={max} type='number' value={quantity} onInput={handleInput} />
			<button type='button' aria-label='Aumentar quantidade' disabled={disabled || quantity >= max} onClick={() => updateQuantity(quantity + 1)}>
				+
			</button>
		</div>
	)
}
