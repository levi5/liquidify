import 'liquidify'

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
}


