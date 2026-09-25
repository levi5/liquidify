'use react'

import type { TargetedMouseEvent } from 'preact'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'

import { Drawer } from '../Drawer'
import { DrawerHeader } from '../Drawer/Header'
import { CartIcon } from '../Icon/Cart'
import { CartService } from '../../services/Cart/cart.service'
import { QuantitySelector } from '../Quantity/Selector'
import { ToastHost } from '../Toast'
import { showToast } from '../../../shared/events/toast'
import { translate } from '../../i18n/translate'
import { getVariantStockLimit } from '../../context/Product/product.helpers'

import './styles.css'
import styles from './styles.css'

type CartItem = {
	key: string
	url: string
	title: string
	price: number
	quantity: number
	variant_id?: number
	variant_title?: string | null
	options?: { name: string; value: string }[]
	featured_image?: { alt?: string; url?: string } | null
}

type Cart = {
	item_count: number
	total_price: number
	items: CartItem[]
}

const openMiniCart = () => {
	window.dispatchEvent(new CustomEvent('message::mini-cart', { detail: true }))
}

const formatMoney = (cents: number) =>
	new Intl.NumberFormat(window.LiquidifyTheme?.locale || 'pt-BR', {
		style: 'currency',
		currency: window.LiquidifyTheme?.currency || 'BRL',
	}).format(cents / 100)

const variantLabel = (item: CartItem) => {
	if (item.options?.length) return item.options.map(({ value }) => value).join(' / ')
	return item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title : null
}

export const MiniCart = (_props: { elementId: string }) => {
	const [state, setState] = useState<Cart | null>(null)
	const [quantitySyncKeys, setQuantitySyncKeys] = useState<Record<string, number>>({})
	const [quantityMaxByItem, setQuantityMaxByItem] = useState<Record<string, number>>({})

	const resolveCartQuantityLimits = useCallback(async (items: CartItem[]) => {
		const entries = await Promise.all(
			items.map(async (item) => {
				if (!item.variant_id) return [item.key, item.quantity] as const

				const variant = await CartService.getVariant(item.variant_id)

				return [item.key, getVariantStockLimit(variant) ?? item.quantity] as const
			}),
		)

		setQuantityMaxByItem(Object.fromEntries(entries))
	}, [])

	const getCart = useCallback(async () => {
		const orderForm = (await CartService.getCart()) as Cart
		setState(orderForm)
		void resolveCartQuantityLimits(orderForm.items ?? [])
		return orderForm
	}, [resolveCartQuantityLimits])

	const bumpQuantitySyncKey = (id: string) => {
		setQuantitySyncKeys((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }))
	}

	const removeProduct = async (event: TargetedMouseEvent<HTMLButtonElement>, id: string) => {
		event.preventDefault()
		event.stopPropagation()

		try {
			const orderForm = (await CartService.changeItem({ id, quantity: 0 })) as Cart
			setState(orderForm)
			window.dispatchEvent(new CustomEvent('cart:updated', { detail: { action: 'remove', id, cart: orderForm } }))
		} catch (err) {
			showToast({ variant: 'error', title: 'Carrinho', message: err instanceof Error ? err.message : translate('cart.update_error', 'Não foi possível atualizar a sacola. Tente novamente.') })
			void getCart()
		}
	}

	const updateProductQuantity = async (id: string, quantity: number) => {
		try {
			const orderForm = (await CartService.changeItem({ id, quantity })) as Cart
			setState(orderForm)
			void resolveCartQuantityLimits(orderForm.items ?? [])
			window.dispatchEvent(new CustomEvent('cart:updated', { detail: { action: 'change', id, quantity, cart: orderForm } }))
		} catch (err) {
			const message = err instanceof Error ? err.message : translate('cart.update_error', 'Não foi possível atualizar a sacola. Tente novamente.')
			showToast({ variant: 'warning', title: 'Carrinho', message })

			const inferredMax = message.match(/(?:somente|only)\s+(\d+)/i)?.[1]
			const max = inferredMax ? Number(inferredMax) : null
			if (max && Number.isFinite(max) && max > 0) {
				setQuantityMaxByItem((current) => ({ ...current, [id]: Math.floor(max) }))
			}

			bumpQuantitySyncKey(id)
			void getCart()
		}
	}

	useEffect(() => {
		void getCart()
	}, [getCart])

	useEffect(() => {
		const handleAddToCartSuccess = async () => {
			await getCart()
			openMiniCart()
			showToast({ variant: 'success', title: 'Carrinho', message: translate('cart.add_success', 'Adicionado à sua sacola.') })
		}

		window.addEventListener('product:add-to-cart:success', handleAddToCartSuccess)
		return () => window.removeEventListener('product:add-to-cart:success', handleAddToCartSuccess)
	}, [getCart])

	useEffect(() => {
		const handleAddToCartError = (event: Event) => {
			const customEvent = event as CustomEvent<{ error?: string }>
			const message = customEvent.detail?.error || translate('cart.add_error', 'Não foi possível adicionar. Tente novamente.')
			const normalized = message.toLowerCase()
			const partial = normalized.includes('foram adicionados') || normalized.includes('were added')

			showToast({
				variant: partial ? 'warning' : 'error',
				title: partial ? 'Disponibilidade' : 'Carrinho',
				message,
			})

			void getCart()
			if (partial) openMiniCart()
		}

		window.addEventListener('product:add-to-cart:error', handleAddToCartError)
		return () => window.removeEventListener('product:add-to-cart:error', handleAddToCartError)
	}, [getCart])

	const items = useMemo(() => state?.items ?? [], [state])
	const count = state?.item_count ?? 0
	const hasItems = items.length > 0

	return (
		<div className={'miniCart'}>
			<ToastHost position='bottom-left' />

			<Drawer.Root name='mini-cart'>
				<Drawer.Trigger>
					<Drawer.Action action='open' className={'miniCartIcon'}>
						<CartIcon />
						{!!count && <span className={'miniCartCount'}>{count}</span>}
					</Drawer.Action>
				</Drawer.Trigger>

				<Drawer.Content eventName='mini-cart' orientation='right' overlay={true} width='min(560px, 100vw)'>
					<div className={'miniCartDrawer'}>
						<DrawerHeader title={translate('cart.bag_title', 'Sua sacola')} count={count} />

						{hasItems ? (
							<div className={'miniCartList'}>
								{items.map((item) => {
									const variant = variantLabel(item)

									return (
										<div key={item.key} className={'miniCartProduct'}>
											<a href={item.url} className={'miniCartProductLink'}>
												{item.featured_image?.url && (
													<img
														width='96'
														height='120'
														alt={item.featured_image.alt || item.title}
														src={`${item.featured_image.url}&width=96&height=120&crop=center`}
														loading='lazy'
													/>
												)}
											</a>

											<div className={'miniCartProductInfo'}>
												<a href={item.url} className={'miniCartProductName'}>
													{item.title}
												</a>
												{variant && <span className={'miniCartProductVariant'}>{variant}</span>}
												<span className={'miniCartProductPrice'}>{formatMoney(item.price)}</span>

												<div className={'miniCartProductActions'}>
													<QuantitySelector
														syncKey={quantitySyncKeys[item.key] ?? 0}
														initialValue={item.quantity}
														max={quantityMaxByItem[item.key] ?? item.quantity}
														ariaLabel={translate('cart.quantity', 'Quantidade')}
														onChange={(nextQuantity) => updateProductQuantity(item.key, nextQuantity)}
													/>

													<button type='button' className={'miniCartRemove'} onClick={(event) => removeProduct(event, item.key)}>
														Remover
													</button>
												</div>
											</div>
										</div>
									)
								})}
							</div>
						) : (
							<div className={'miniCartEmpty'}>
								<h3>{translate('cart.empty_title', 'Sua sacola ainda está vazia.')}</h3>
								<p>{translate('cart.empty_text', 'Sua sacola está vazia. Explore a coleção e adicione seus favoritos.')}</p>
								<button type='button' className='button button-outline' onClick={() => window.location.assign('/collections/all')}>
									{translate('cart.explore_store', 'Explorar a loja ↗')}
								</button>
							</div>
						)}

						{hasItems && (
							<div className={'miniCartFooter'}>
								<div className={'miniCartSubtotal'}>
									<span>{translate('cart.subtotal', 'Subtotal')}</span>
									<strong>{formatMoney(state?.total_price ?? 0)}</strong>
								</div>

								<p className={'miniCartNote'}>{translate('cart.shipping_taxes', 'Frete e impostos calculados no checkout.')}</p>

								<a className='button button-dark' href='/cart'>
									{translate('cart.checkout', 'Finalizar compra ↗')}
								</a>

								<a className={'miniCartPageLink'} href='/cart'>
									{translate('cart.open_page', 'Abrir página da sacola')}
								</a>

								<p className={'miniCartSecure'}>{translate('cart.secure_payment', 'Pagamento seguro com Shopify')}</p>
							</div>
						)}
					</div>
				</Drawer.Content>
			</Drawer.Root>
		</div>
	)
}
