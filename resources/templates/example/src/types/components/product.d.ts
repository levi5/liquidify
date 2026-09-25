import type { ReactNode } from 'preact/compat'
import type { ProductOptionValue } from 'liquidx/dist/types/liquid-globals'

export type ProductPreviewType = {
	id: string
	title: string
	image: any
	images: any[]
}

export type ProductOption = {
	name: string
	position: number
	values: string[]
}

export type ProductVariant = {
	id: number
	available?: boolean
	inventory_management?: string | null
	inventory_policy?: string | null
	inventory_quantity?: number
	inventoryQuantity?: number
	quantityAvailable?: number
	quantity_available?: number
	quantity_rule?: {
		min?: number | null
		max?: number | null
		increment?: number | null
	}
	quantityRule?: {
		minimum?: number | null
		maximum?: number | null
		increment?: number | null
	}
	option1?: string | null
	option2?: string | null
	option3?: string | null
	options?: string[]
}

export type Product = {
	id: number | string
	handle?: string
	options?: string[]
	options_with_values?: ProductOption[]
	variants?: ProductVariant[]
}

export type ProductStore = Product | { product?: Product } | null | undefined

export type ProductOptionState = {
	selected: boolean
	available: boolean
}

export type ProductContextType = {
	product: Product | null
	options: ProductOption[]
	requiredOptions: ProductOption[]
	selectedOptions: Record<string, string>
	selectedVariant: ProductVariant | null
	quantity: number
	maxQuantity: number
	isStockLimitResolved: boolean
	isStockLimitLoading: boolean
	isSelectionComplete: boolean
	isAvailable: boolean
	isAdding: boolean
	error: string | null
	selectOption: (name: string, value: string) => void
	setQuantity: (quantity: number) => void
	getOptionState: (name: string, value: string) => ProductOptionState
	addToCart: (quantity?: number) => Promise<void>
}

export type ProductProviderProps = {
	children: ReactNode
	elementId: string
	requiredOptionNames?: string[]
	selectFirstVariant?: boolean
	store?: ProductStore
}

export type ProductInfoType = {
	product: {
		id: string
		featured_image: string
		title: string
		images: string[]
		description: string
		options_with_values: ProductOptionValue[]
		metafields: {
			custom: { product_badges: { value: string } }
		}
	}
}
