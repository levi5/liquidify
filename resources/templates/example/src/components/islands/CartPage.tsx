'use react'

import { useEffect, useState } from 'preact/hooks'
import { CartContents } from '../../ui/CartContents'
import type { StoreCart } from '../../lib/shopify'

export const CartPage = ({ store }: { store?: StoreCart; eager?: boolean; children?: unknown }) => {
  const [cart, setCart] = useState(store)
  useEffect(() => {
    const update = (event: Event) => setCart((event as CustomEvent).detail.cart)
    document.addEventListener('liquidify-theme:cart', update)
    return () => document.removeEventListener('liquidify-theme:cart', update)
  }, [])
  return <CartContents cart={cart} onUpdate={setCart} />
}
