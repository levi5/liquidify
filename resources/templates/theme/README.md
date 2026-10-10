# Liquidify Starter Theme

Production-ready Shopify theme template built with **TSX** using **Liquidify** and Preact.

## Quick Start

### 1. Initialize a new project

```bash
npx liquidify init my-store
cd my-store
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development mode

```bash
npm run dev
```

Watch mode tracks components, shared files in `src`, CSS, JavaScript, templates, configuration, and layout.

### 4. Build for production

```bash
npm run build
```

### 5. Preview with Shopify CLI

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

- **Complete theme structure** — layout, templates, sections, snippets, assets, config, locales
- **Home page sections** — Hero, Featured Collection, Categories, Brand Banner
- **Product page** — Gallery, variants, quantity picker, add-to-cart, related products
- **Collection page** — Sidebar filters (desktop), filter drawer (mobile), pagination
- **Search** — Instant search with suggestions, results page, pagination
- **Cart** — Mini-cart drawer, full cart page, Ajax API integration
- **React Islands** — Mini-cart, search drawer, mobile menu, filter drawer, product gallery
- **Sections** — Header, Footer, Newsletter, Hero, Categories, Featured, Product Info, Empty State
- **Localization** — English and Brazilian Portuguese (storefront + theme editor schema)

## Localization

The template uses Shopify locale files for both storefront copy and theme-editor labels:

- `locales/en.default.json` — default English storefront strings
- `locales/pt-BR.json` — Brazilian Portuguese storefront strings
- `locales/en.default.schema.json` — English theme-editor labels
- `locales/pt-BR.schema.json` — Portuguese theme-editor labels

Liquid components reference storefront strings with `{{ 'key' | t }}` expressions embedded in TSX string literals.
React islands receive the active translations through `window.LiquidifyTheme.i18n`, initialized in `layout/theme.liquid`.

Merchant-configured section settings remain merchant-owned values; use locale keys for fixed copy and provide translated defaults where appropriate.

To add a language, copy the default locale files, translate the values, and publish the new locale files with the theme.

## File Organization

| Path | Content |
| --- | --- |
| `src/app/components/sections/` | TSX sections and Shopify theme editor schemas |
| `src/app/components/snippets/` | Reusable cards, filters, SVG icons, and pagination |
| `src/app/components/islands/` | Mini-cart, search, mobile submenus, filter drawer, and Preact purchase flow |
| `src/app/components/ui/` | Shared UI components for islands |
| `src/app/lib/shopify.ts` | Cart integration and currency formatting |
| `src/app/scripts/theme.ts` | Rotating notices, quick add, and product gallery |
| `src/app/` | TSX sections, components, and their stylesheets |
| `assets/global.css` | Base theme styles (reset, tokens, typography, buttons, utilities), hand-maintained above the `liquidify:start`/`liquidify:end` markers |
| `templates/` | Shopify page composition templates |
| `config/` | Brand name and color settings |
| `locales/` | English and Brazilian Portuguese storefront and schema translations |

`sections/*.liquid`, component `snippets/*.liquid`, `blocks/*.liquid`, and generated JavaScript bundles are build outputs and are ignored by Git. Edit the source TSX to retain modifications on subsequent builds. Native theme files such as `layout/theme.liquid`, `templates/gift_card.liquid`, `snippets/css-variables.liquid`, `snippets/script-global.liquid`, layout/config files, and locale files remain tracked.

## Verification

```bash
npm run build
npm run typecheck
npm run check
```

`check` runs Shopify Theme Check CLI. Verification validates against empty outputs, missing section references, and known serialization constraints. See [Liquidify Notes](docs/LIQUIDIFY-NOTES.md).