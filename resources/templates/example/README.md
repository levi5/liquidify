# Liquidify — Shopify Fashion Store

E-commerce theme built in **TSX inside `src`**, using **Liquidify** and Preact.

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start development mode

```bash
npm run dev
```

Watch mode tracks components, shared files in `src`, CSS, JavaScript, templates, configuration, and layout.

### 3. Build for production

```bash
npm run build
```

### 4. Preview with Shopify CLI

In another terminal, start the store preview with your Shopify store:

```bash
shopify theme dev --store your-store.myshopify.com
```

Or using the npm script:

```bash
npm run preview -- --store your-store.myshopify.com
```

To select a specific port:

```bash
npm run preview -- --store your-store.myshopify.com --port 9393
```

> **Note:** Preview requires the Shopify CLI installed and store access. Preview uses a development theme; checkout, payments, and customer accounts are handled by Shopify.

## Included Features

- Fashion home page, Liquidify branding, and a black, white, and gray palette.
- Rotating announcements with three editable messages, arrows, pause, and reduced motion support.
- New Arrivals, Women, Men, and Accessories menus with submenus on desktop and mobile; custom menu supports up to three levels configured in Shopify.
- Header with search, login, and cart icons without visual labels; cart counter updates after every mutation.
- Product cards with secondary image on hover, price, availability, and quick-add for single-variant products; products with multiple options direct to the product page.
- Catalog with sidebar filters (280px on desktop) and a filter drawer on screens up to 680px. Active filters support individual removal, clear-all preserving sort order, and auto-submit sorting.
- Numbered pagination in catalog and search with 12 items per page. The count is configurable from 6 to 36 in the theme editor. Links preserve filters, sort order, and search queries.
- Product page with gallery, Shopify media, variants, quantity picker, add-to-cart button capped at 320px, unavailable combination feedback, and a URL-synced form fallback without JavaScript.
- Related products via the Shopify Recommendations API, falling back to collection alternatives while loading or if unavailable. The currently viewed product is excluded.
- Mini-cart drawer and full cart page updated via the Shopify Ajax API, with inventory errors, item removal, and checkout redirection.
- Search, institutional pages, contact form, collection list, blog, article, and 404 page.
- Native Shopify newsletter, store policies, social metadata, and structured product data.

## File Organization

| Path | Content |
| --- | --- |
| `src/components/sections/` | TSX sections and Shopify theme editor schemas |
| `src/components/snippets/` | Reusable cards, filters, SVG icons, and pagination |
| `src/components/islands/` | Mini-cart, search, mobile submenus, filter drawer, and Preact purchase flow |
| `src/ui/` | Shared UI components for islands |
| `src/lib/shopify.ts` | Cart integration and currency formatting |
| `src/scripts/theme.ts` | Rotating notices, quick add, and product gallery |
| `src/styles/theme.css` | Styles and responsive layouts |
| `templates/` | Shopify page composition templates |
| `config/` | Brand name and color settings |

`sections/*.liquid`, snippets generated from TSX components, and JavaScript bundles are build outputs. Edit the source TSX to retain modifications on subsequent builds. Layout, JSON templates, and `snippets/css-variables.liquid` are native theme files.

Submenu and filter styles reside within their respective TSX components. `MainCollection` includes `CollectionFilters`, which embeds the `FilterDrawer` island referenced by `templates/collection.json`. The island reuses the same Liquid form across the sidebar and drawer, preserving user selections on resize. Without JavaScript, filters remain fully usable on the page and the "Apply filters" button submits both filters and selected sort order.

`ProductRecommendations` links to the product template. Pagination utilizes `Pagination` and the `PaginateByLiquid` component exported by the library, accepting dynamic Liquid page-size settings.

Assign `page.contact.json` to the contact page in Shopify Admin. Available filters depend on Shopify Search & Discovery configuration. Women and Men links map to existing catalog tags; destinations can be customized to collections in the editor.

## Verification

```bash
npm run build
npm run typecheck
npm run check
```

`check` runs Shopify Theme Check CLI. Verification validates against empty outputs, missing section references, and known serialization constraints. See [Liquidify Notes](docs/LIQUIDIFY-NOTES.md).

