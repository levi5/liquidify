import type { Product, ProductOption, ProductProviderProps, ProductStore, ProductVariant } from '../../../types/components/product'

export const normalizeProduct = (store: ProductStore): Product | null => {
	if (!store) return null
	if ('product' in store) return store.product || null
	return store as Product
}

export const getVariantOption = (variant: ProductVariant, position: number) => {
	return variant.options?.[position - 1] || variant[`option${position}` as 'option1' | 'option2' | 'option3'] || null
}

export const getProductOptions = (product: Product | null): ProductOption[] => {
	if (!product) return []

	if (product.options_with_values?.length) return product.options_with_values

	return (product.options || []).map((name, index) => {
		const position = index + 1
		const values = Array.from(new Set((product.variants || []).map((variant) => getVariantOption(variant, position)).filter((value): value is string => Boolean(value))))

		return { name, position, values }
	})
}

export const getRequiredOptions = (options: ProductOption[], requiredOptionNames: ProductProviderProps['requiredOptionNames']) => {
	if (!requiredOptionNames?.length) return options

	const normalizedNames = requiredOptionNames.map((name) => name.toUpperCase())
	return options.filter((option) => normalizedNames.includes(option.name.toUpperCase()))
}

export const buildSelectedOptions = (options: ProductOption[], variant: ProductVariant | null) => {
	return options.reduce<Record<string, string>>((acc, option) => {
		const value = variant ? getVariantOption(variant, option.position) : option.values[0]
		if (value) acc[option.name] = value
		return acc
	}, {})
}

export const variantMatches = (variant: ProductVariant, options: ProductOption[], selectedOptions: Record<string, string>) => {
	return options.every((option) => {
		const selectedValue = selectedOptions[option.name]
		return !selectedValue || getVariantOption(variant, option.position) === selectedValue
	})
}

export const selectionIsComplete = (options: ProductOption[], selectedOptions: Record<string, string>) => {
	return options.every((option) => Boolean(selectedOptions[option.name]))
}

export const clampQuantity = (quantity: number, min = 1, max = 999) => {
	if (Number.isNaN(quantity)) return min
	return Math.min(Math.max(quantity, min), max)
}

export const toFiniteNumber = (value: unknown) => {
	if (typeof value === 'number' && Number.isFinite(value)) return value
	if (typeof value === 'string') {
		const parsed = Number(value)
		if (Number.isFinite(parsed)) return parsed
	}
	return null
}

type CartItemLike = {
	id?: number | string
	quantity?: number | string
	variant_id?: number | string
}

type CartLike = {
	items?: CartItemLike[]
}

export const getVariantQuantityInCart = (cart: CartLike | null | undefined, variantId: number | string) => {
	return cart?.items
		?.filter((item) => String(item.id) === String(variantId) || String(item.variant_id) === String(variantId))
		.reduce((total: number, item) => total + Number(item.quantity || 0), 0) || 0
}

export const getVariantStockLimit = (variant: unknown) => {
	const variantData = variant as Record<string, unknown>
	const quantityRule = (variantData?.quantity_rule || variantData?.quantityRule) as Record<string, unknown> | undefined
	const quantityRuleCandidates = [quantityRule?.max, quantityRule?.maximum]
	const stockCandidates = [variantData?.inventory_quantity, variantData?.inventoryQuantity, variantData?.quantityAvailable, variantData?.quantity_available]

	let quantityRuleMax: number | null = null
	for (const candidate of quantityRuleCandidates) {
		const numeric = toFiniteNumber(candidate)
		if (numeric !== null && numeric >= 0) {
			quantityRuleMax = Math.floor(numeric)
			break
		}
	}

	let stockLimit: number | null = null
	for (const candidate of stockCandidates) {
		const numeric = toFiniteNumber(candidate)
		if (numeric !== null && numeric >= 0) {
			stockLimit = Math.floor(numeric)
			break
		}
	}

	if (quantityRuleMax !== null && stockLimit !== null) return Math.max(0, Math.min(quantityRuleMax, stockLimit))
	return quantityRuleMax ?? stockLimit
}
