import 'liquidify'
import type { Article, Blog, Cart, Collection, FallbackProps, Page, Product, Shop } from 'liquidify'

declare module 'liquidify' {
  interface Product {
    requires_selling_plan: boolean
    selected_or_first_available_variant: import('liquidify').ProductVariant
  }
}

declare global {
  const React: typeof import('preact/compat')
  const recommendations: {
    performed: boolean
    products: import('liquidify').Product[]
    products_count: number
  }
  const menu_json: string
}

export type { Article, Blog, Cart, Collection, FallbackProps, Page, Product, Shop }

export interface LiquidGlobalsExample {
  blog: Blog
  article: Article
  page: Page
  product: Product
  collection: Collection
  cart: Cart
  shop: Shop
}
