type AddCartItemPayload = {
	id: number | string
	quantity?: number
	properties?: Record<string, string>
	selling_plan?: number | string
}

type ChangeCartItemPayload = {
	id: number | string
	quantity: number
}

import { rootUrl } from '../../../lib/shopify'

type ShopifyCartError = {
	description?: string
	message?: string
	status?: number
}

const getCartRoute = (path: string) => `${rootUrl()}${path}`

const getErrorMessage = async (response: Response) => {
	const fallback = response.status === 401 ? 'Carrinho não autorizado neste preview. Teste em uma sessão válida da loja Shopify.' : 'Não foi possível adicionar o produto.'

	try {
		const data = (await response.json()) as ShopifyCartError
		return data.description || data.message || fallback
	} catch {
		return fallback
	}
}

export const CartService = {
	async getCart() {
		const response = await fetch(getCartRoute('cart.js'), {
			credentials: 'same-origin',
			headers: {
				Accept: 'application/json',
			},
		})

		if (!response.ok) throw new Error(await getErrorMessage(response))

		return response.json()
	},

	async addItem({ id, quantity = 1, properties, selling_plan }: AddCartItemPayload) {
		const response = await fetch(getCartRoute('cart/add.js'), {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({ id, quantity, properties, selling_plan }),
		})

		if (!response.ok) throw new Error(await getErrorMessage(response))

		return response.json()
	},

	async getProduct(handle: string) {
		const response = await fetch(getCartRoute(`products/${handle}.js`), {
			credentials: 'same-origin',
			headers: {
				Accept: 'application/json',
			},
		})

		if (!response.ok) return null

		return response.json()
	},

	async getVariant(id: number | string) {
		const response = await fetch(getCartRoute(`variants/${id}.js`), {
			credentials: 'same-origin',
			headers: {
				Accept: 'application/json',
			},
		})

		if (!response.ok) return null

		return response.json()
	},

	async changeItem({ id, quantity }: ChangeCartItemPayload) {
		const response = await fetch(getCartRoute('cart/change.js'), {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({ id, quantity }),
		})

		if (!response.ok) throw new Error(await getErrorMessage(response))

		return response.json()
	},
}
