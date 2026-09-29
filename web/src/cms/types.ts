import type { Locale } from "../i18n.tsx";

export const TYPES_PRODUCT = `// lib/types/liquid-globals.ts
export interface Product {
  id: number
  title: string
  handle: string
  vendor: string
  product_type: string
  price: number
  price_min: number
  price_max: number
  compare_at_price: number | null
  available: boolean
  options_with_values?: ProductOptionValue[]
  variants: ProductVariant[]
  images: ProductMedia[]
  featured_image: ProductMedia | null
  description: string
  metafields: Record<string, unknown>
}

export interface ProductVariant {
  id: number
  title: string
  price: number
  compare_at_price: number | null
  available: boolean
  options: string[]
  sku: string | null
  weight: number
  weight_unit: string
}

export interface ProductMedia {
  id: number
  alt: string | null
  src: string
  width: number
  height: number
  position: number
}

export interface ProductOptionValue {
  name: string
  position: number
  values: string[]
}`;

export const TYPES_COLLECTION = `export interface Collection {
  id: number
  title: string
  handle: string
  description: string
  image: { src: string; alt: string | null } | null
  products: Product[]
  products_count: number
  sort_options: SortOption[]
  filters: Filter[]
}

export interface Filter {
  id: string
  label: string
  type: string
  values: FilterValue[]
}

export interface FilterValue {
  label: string
  value: string
  count: number
  active: boolean
  url: string
}

export interface SortOption {
  label: string
  value: string
  active: boolean
}`;

export const TYPES_CART = `export interface Cart {
  item_count: number
  total_price: number
  items: CartItem[]
  currency: string
}

export interface CartItem {
  id: number
  key: string
  title: string
  variant_title: string | null
  price: number
  quantity: number
  image: { src: string; alt: string | null } | null
  url: string
  variant: ProductVariant
}`;

export const TYPES_SHOP = `export interface Shop {
  name: string
  domain: string
  url: string
  currency: string
  money_format: string
  money_with_currency_format: string
  shipping_policy: Policy | null
  refund_policy: Policy | null
  privacy_policy: Policy | null
  terms_of_service: Policy | null
}

export interface Policy {
  title: string
  body: string
  url: string
}

export interface Localization {
  country: string
  currency: string
  languages: Language[]
}

export interface Language {
  name: string
  endonym_name: string
  iso_code: string
  primary: boolean
}`;

export const TYPES_GLOBALS = `// Global declarations available in TSX
declare global {
  // Shopify globals
  const product: Product
  const collection: Collection
  const cart: Cart
  const shop: Shop
  const customer: Customer | null
  const localization: Localization
  const routes: Routes
  const request: Request
  const section: Section
  const block: Block
  const form: ShopifyForm
  const predictive_search: PredictiveSearch
  const gift_card: GiftCard

  // URL helpers
  const canonical_url: string
  const page_title: string
  const page_description: string
  const section_id: string
  const content_for_header: string
  const content_for_layout: string
  const linklists: Record<string, Link[]>

  // String extensions
  interface String {
    markdownify(): string
  }
}

export interface Routes {
  all_products_collection_url: string
  cart_add_url: string
  cart_url: string
  search_url: string
  account_url: string
  account_login_url: string
  account_logout_url: string
  account_register_url: string
  account_recover_url: string
  collections_url: string
}

export interface Section {
  id: string
  settings: Record<string, unknown>
  blocks: Block[]
}

export interface Block {
  id: string
  type: string
  settings: Record<string, unknown>
}

export interface ShopifyForm {
  errors: Record<string, string[]>
  posted_successfully?: boolean
  [key: string]: unknown
}`;

export const TYPES_PAGINATE = `export interface Paginate {
  current_page: number
  pages: number
  per_page: number
  total: number
  previous: { url: string; title: string } | null
  next: { url: string; title: string } | null
  parts: PaginatePart[]
}

export interface PaginatePart {
  title: string
  url: string
  is_link: boolean
}

export interface Page {
  id: number
  title: string
  handle: string
  content: string
  url: string
}

export interface Article {
  id: number
  title: string
  handle: string
  content: string
  excerpt: string
  image: { src: string; alt: string | null } | null
  author: string
  published_at: string
  tags: string[]
  url: string
}

export interface Blog {
  id: number
  title: string
  handle: string
  articles: Article[]
  articles_count: number
}`;

export type TypesCopy = {
  title: string;
  intro: string;
  product: string;
  productText: string;
  variant: string;
  variantText: string;
  media: string;
  mediaText: string;
  collection: string;
  collectionText: string;
  cart: string;
  cartText: string;
  shop: string;
  shopText: string;
  localization: string;
  localizationText: string;
  globals: string;
  globalsText: string;
  paginate: string;
  paginateText: string;
  page: string;
  pageText: string;
  article: string;
  articleText: string;
  blog: string;
  blogText: string;
  routes: string;
  routesText: string;
  section: string;
  sectionText: string;
  block: string;
  blockText: string;
  form: string;
  formText: string;
  usage: string;
  usageText: string;
};

export const TYPES_COPY: Record<Locale, TypesCopy> = {
  "pt-BR": {
    title: "Tipos Shopify",
    intro: "Todas as interfaces globais disponíveis nos seus componentes TSX. Estes tipos vêm de liquidify e são injetados automaticamente.",
    product: "Product",
    productText: "O produto atual. Disponível em product.liquid e quando product é passado como prop.",
    variant: "ProductVariant",
    variantText: "Variação de produto com preço, disponibilidade e opções.",
    media: "ProductMedia",
    mediaText: "Imagem ou mídia do produto com src, dimensões e alt.",
    collection: "Collection",
    collectionText: "Coleção com produtos, filtros e ordenação.",
    cart: "Cart",
    cartText: "Carrinho atual com itens, total e moeda.",
    shop: "Shop",
    shopText: "Dados da loja: nome, domínio, moeda, políticas.",
    localization: "Localization",
    localizationText: "País, moeda e idiomas ativos da loja.",
    globals: "Globais disponíveis",
    globalsText: "Estas constantes estão disponíveis em qualquer componente TSX sem import.",
    paginate: "Paginate",
    paginateText: "Objeto de paginação do Shopify com partes, anterior e próximo.",
    page: "Page",
    pageText: "Página estática do Shopify.",
    article: "Article",
    articleText: "Artigo de blog com conteúdo, imagem e autor.",
    blog: "Blog",
    blogText: "Blog com lista de artigos.",
    routes: "Routes",
    routesText: "URLs absolutas para rotas principais da loja.",
    section: "Section",
    sectionText: "Section atual com settings e blocks.",
    block: "Block",
    blockText: "Block individual dentro de uma section.",
    form: "ShopifyForm",
    formText: "Formulário Shopify com erros e status de envio.",
    usage: "Exemplo de uso",
    usageText: "Use os tipos diretamente nos seus componentes sem import:",
  },
  en: {
    title: "Shopify types",
    intro: "All global interfaces available in your TSX components. These types come from liquidify and are injected automatically.",
    product: "Product",
    productText: "The current product. Available in product.liquid and when product is passed as a prop.",
    variant: "ProductVariant",
    variantText: "Product variant with price, availability, and options.",
    media: "ProductMedia",
    mediaText: "Product image or media with src, dimensions, and alt.",
    collection: "Collection",
    collectionText: "Collection with products, filters, and sorting.",
    cart: "Cart",
    cartText: "Current cart with items, total, and currency.",
    shop: "Shop",
    shopText: "Shop data: name, domain, currency, policies.",
    localization: "Localization",
    localizationText: "Shop country, currency, and active languages.",
    globals: "Available globals",
    globalsText: "These constants are available in any TSX component without import.",
    paginate: "Paginate",
    paginateText: "Shopify pagination object with parts, previous, and next.",
    page: "Page",
    pageText: "Static Shopify page.",
    article: "Article",
    articleText: "Blog article with content, image, and author.",
    blog: "Blog",
    blogText: "Blog with article list.",
    routes: "Routes",
    routesText: "Absolute URLs for main shop routes.",
    section: "Section",
    sectionText: "Current section with settings and blocks.",
    block: "Block",
    blockText: "Individual block within a section.",
    form: "ShopifyForm",
    formText: "Shopify form with errors and submission status.",
    usage: "Usage example",
    usageText: "Use the types directly in your components without import:",
  },
};

export const TYPES_USAGE_SNIPPET = `// Em qualquer componente TSX
export const ProductCard = () => {
  // product, collection, shop, cart, etc. já estão disponíveis
  return (
    <div>
      <h1>{product.title}</h1>
      <p>{shop.name}</p>
      <span>{cart.item_count} itens</span>
    </div>
  )
}`;
