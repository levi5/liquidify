declare global {
  interface Window {
    Shopify?: { routes?: { root: string } }
    LiquidifyTheme?: {
      currency: string
      locale: string
      root: string
      account: string
      i18n?: Record<string, string>
    }
  }
}

export const translate = (key: string, fallback: string): string => {
  if (typeof window === 'undefined') return fallback
  return window.LiquidifyTheme?.i18n?.[key] || fallback
}

export const rootUrl = () => {
  const root = window.Shopify?.routes?.root || window.LiquidifyTheme?.root || '/'
  return root.endsWith('/') ? root : `${root}/`
}

export const moneyText = (cents: number, currency = window.LiquidifyTheme?.currency || 'BRL') =>
  new Intl.NumberFormat(window.LiquidifyTheme?.locale || 'pt-BR', { style: 'currency', currency }).format(
    cents / 100,
  )
