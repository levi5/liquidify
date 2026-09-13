export interface CartLine {
  key: string
  product_title: string
  variant_title: string | null
  url: string
  image: string | null
  quantity: number
  final_line_price: number
  selling_plan_allocation?: { selling_plan: { name: string } }
  properties?: Record<string, string>
}

export interface StoreCart {
  items: CartLine[]
  item_count: number
  total_price: number
  total_discount: number
  currency: string
  cart_level_discount_applications?: { title: string; total_allocated_amount: number }[]
}

declare global {
  interface Window {
    Shopify?: { routes?: { root: string } }
    LiquidifyTheme?: { currency: string; locale: string; root: string; account: string }
  }
}

export const rootUrl = () => {
  const root = window.Shopify?.routes?.root || window.LiquidifyTheme?.root || '/'
  return root.endsWith('/') ? root : `${root}/`
}
export const moneyText = (cents: number, currency = window.LiquidifyTheme?.currency || 'BRL') =>
  new Intl.NumberFormat(window.LiquidifyTheme?.locale || 'pt-BR', { style: 'currency', currency }).format(
    cents / 100,
  )

export async function cartRequest(path = 'cart.js', payload?: unknown): Promise<StoreCart> {
  const response = await fetch(`${rootUrl()}${path}`, {
    method: payload ? 'POST' : 'GET',
    headers: { Accept: 'application/json', ...(payload ? { 'Content-Type': 'application/json' } : {}) },
    credentials: 'same-origin',
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  })
  const data = await response.json()
  if (!response.ok)
    throw new Error(
      data.description || data.message || 'Não foi possível atualizar a sacola. Tente novamente.',
    )
  return data
}

export function announceCart(cart: StoreCart, open = false) {
  document.dispatchEvent(new CustomEvent('liquidify-theme:cart', { detail: { cart, open } }))
}

export async function addItem(id: number, quantity: number) {
  await cartRequest('cart/add.js', { items: [{ id, quantity }] })
  // A successful add must stay successful even if the following cart refresh fails.
  try {
    announceCart(await cartRequest(), true)
  } catch {
    document.dispatchEvent(new CustomEvent('liquidify-theme:cart-refresh', { detail: { open: true } }))
  }
}
