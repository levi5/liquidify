export { }

type TCollectionType = any
type TFiltersType = {
  label: string
  type: string
  values: any
}

type ClosestType = {
  product: {
    options_with_values: { name: string, prosition: number, values: string[] }[]
  }
}

declare global {
  const collection: TCollectionType & { filters: TFiltersType[] }
  const collections: TCollectionType[]
  const search: { filters: TFiltersType[] }
  const filters: TFiltersType[]
  const paginate: { previous: boolean, next: boolean }
  const product: any
  const all_products: any[]
  const pages: any[]
  const blogs: any[]
  const cart: any
  const shop: any
  const settings: any
  const closest: ClosestType
  const section: {
    settings?: any
    blocks?: any[]
  }

  const results: {
    filters: TFiltersType[]
  }

  const routes: { root_url: string, account_login_url: string }
  const content_for_header: string

  const content_for_layout: string

  interface Link {
    title: string
    url: string
    handle: string
    type: string
    active: boolean
    current: boolean
    links: Link[]
  }

  interface Menu {
    handle: string
    title: string
    links: Link[]
  }

  const linklists: Record<string, Menu>
}
