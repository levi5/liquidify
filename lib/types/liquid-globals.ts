export { }

export interface ShopifyImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  aspect_ratio: number;
}

export interface ProductOptionValue {
  name: string;
  position: number;
  values: string[];
}

export interface ProductVariant {
  id: number;
  title: string;
  price: number;
  compare_at_price: number | null;
  available: boolean;
  sku: string;
  weight: number;
  weight_unit: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  featured_image: ShopifyImage | null;
  url: string;
}

export interface Product {
  id: number;
  title: string;
  handle: string;
  description: string;
  price: number;
  price_min: number;
  price_max: number;
  compare_at_price: number | null;
  compare_at_price_min: number | null;
  compare_at_price_max: number | null;
  available: boolean;
  type: string;
  tags: string[];
  vendor: string;
  options: string[];
  options_with_values: ProductOptionValue[];
  variants: ProductVariant[];
  images: ShopifyImage[];
  featured_image: ShopifyImage | null;
  url: string;
  collections: Collection[];
}

export interface FilterValue {
  active: boolean;
  count: number;
  label: string;
  param_name: string;
  value: string;
  url_to_add: string;
  url_to_remove: string;
}

export interface Filter {
  label: string;
  type: 'list' | 'price_range' | 'boolean';
  param_name: string;
  active_values: FilterValue[];
  inactive_values: FilterValue[];
  values: FilterValue[];
  min_value?: { param_name: string; value: number };
  max_value?: { param_name: string; value: number };
  range_max?: number;
}

export interface Collection {
  id: number;
  title: string;
  handle: string;
  description: string;
  url: string;
  products_count: number;
  image: ShopifyImage | null;
  products: Product[];
  filters: Filter[];
  [key: string]: unknown
}

export interface Paginate {
  current_page: number;
  current_offset: number;
  items: number;
  parts: { is_link: boolean; title: string; url: string }[];
  next: { title: string; url: string } | null;
  previous: { title: string; url: string } | null;
  page_size: number;
  pages: number;
}

export interface Page {
  id: number;
  title: string;
  handle: string;
  content: string;
  url: string;
}

export interface Article {
  id: number;
  title: string;
  handle: string;
  content: string;
  excerpt: string;
  url: string;
  author: string;
  published_at: string;
  image: ShopifyImage | null;
  tags: string[];
}

export interface Blog {
  id: number;
  title: string;
  handle: string;
  url: string;
  articles: Article[];
}

export interface Template {
  name: string;
  suffix: string | null;
  directory: string | null;
}

export interface CartItem {
  id: number;
  key: string;
  product_id: number;
  variant_id: number;
  title: string;
  quantity: number;
  price: number;
  original_price: number;
  discounted_price: number;
  line_price: number;
  original_line_price: number;
  sku: string;
  vendor: string;
  product: Product;
  variant: ProductVariant;
  url: string;
  image: string;
}

export interface Cart {
  items: CartItem[];
  item_count: number;
  total_price: number;
  original_total_price: number;
  total_discount: number;
  currency: string;
}

export interface Shop {
  name: string;
  email: string;
  domain: string;
  url: string;
  currency: string;
  money_format: string;
  money_with_currency_format: string;
}

export interface Link {
  title: string;
  url: string;
  handle: string;
  type: string;
  active: boolean;
  current: boolean;
  links: Link[];
}

export interface Menu {
  handle: string;
  title: string;
  links: Link[];
}

export type FormErrors<TFields extends string = string> = {
  messages?: Partial<Record<TFields, string[]>>
  translated_fields?: Partial<Record<TFields, string>>
}

export type ShopifyForm<TFields extends string = string> = {
  posted_successfully?: boolean
  novalidate: 'novalidate'
  errors?: FormErrors<TFields>

  [key: string]: unknown
}

declare global {
  const collection: Collection;
  const collections: Collection[];
  const search: { filters: Filter[]; results: any[]; results_count: number; terms: string };
  const filters: Filter[];
  const paginate: Paginate;
  const product: Product;
  const all_products: Product[];
  const page: Page;
  const pages: Page[];
  const blog: Blog;
  const blogs: Blog[];
  const template: Template;
  const current_tags: string[];
  const cart: Cart;
  const shop: Shop;
  const settings: Record<string, any>;
  const form: ShopifyForm;
  const closest: {
    product: {
      options_with_values: ProductOptionValue[];
    };
  };
  const section: {
    id: string;
    settings: Record<string, any>;
    blocks: {
      id: string;
      type: string;
      settings: Record<string, any>;
    }[];
  };

  const results: {
    filters: Filter[];
  };

  const routes: {
    root_url: string;
    account_url: string;
    account_login_url: string;
    account_logout_url: string;
    account_register_url: string;
    account_addresses_url: string;
    collections_url: string;
    all_products_collection_url: string;
    search_url: string;
    cart_url: string;
    cart_add_url: string;
    cart_change_url: string;
    cart_clear_url: string;
    cart_update_url: string;
    product_recommendations_url: string;
  };
  const content_for_header: string;
  const content_for_layout: string;
  const linklists: Record<string, Menu>;

  const handleize: any;
  const downcase: any;
  const upcase: any;
  const strip: any;
  const strip_html: any;
  const money: any;
  const money_without_currency: any;
}
