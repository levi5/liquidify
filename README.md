# Liquidify 🚀

> **Status:** Alpha — `v1.1.0-alpha.5`

**Liquidify** is an advanced compiler that transforms **JSX/TSX** components into **Shopify Liquid** code, powered by Babel and esbuild. Write your Shopify theme sections and snippets using React-like syntax and let Liquidify compile them into production-ready `.liquid` files.

---

[![Sponsor](https://img.shields.io/badge/Sponsor-GitHub-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/levi5)

## ✨ Features

- ⚛️ Write Shopify sections and snippets using **TSX/JSX** syntax
- 🔄 **Directives-based** system (`"use react"`, `"use dom"`, `"use snippets"`) to control compilation behavior
- 🏝️ **React Islands** — embed interactive React components inside Liquid templates
- 📄 **Liquid-native components** — `DynamicBlock`, `RenderSnippet`, `RenderSvg`, `PaginateByLiquid`, `FormBlock`
- 👀 **Watch mode** for real-time compilation during development
- ⚡ **esbuild** for blazing-fast JS bundling
- 🔧 Zero-config setup with sensible defaults

---

## 📦 Installation

```bash
npm install liquidify@alpha
# or
pnpm add liquidify@alpha
# or
yarn add liquidify@alpha
```

---

## 🚀 Quick Start

### 1. Initialize a new theme template (Recommended)

Generate a complete Shopify theme structure with the Liquidify starter theme:

```bash
npx liquidify init [project-name]
# or initialize in the current folder:
npx liquidify init
```

This creates:

- The full Liquidify starter theme (250+ files)
- Shopify theme folders (`layout/`, `templates/`, `sections/`, `snippets/`, `assets/`, `config/`, `locales/`)
- Default Shopify files (`theme.liquid`, `index.json`, `settings_schema.json`, `css-variables.liquid`)
- Liquidify components (sections, snippets, React islands)
- `liquidify.config.json` and `tsconfig.json` pre-configured
- English and Brazilian Portuguese locales

---

### 2. Or configure an existing project manually

Create a `liquidify.config.json` at the root of your Shopify theme project:

```json
{
  "componentsDir": "src/components",
  "output": "liquidify"
}
```

> Use `"output": "."` when the config lives at your Shopify theme root and compiled files should be written in place.

| Option          | Default          | Description                                  |
|-----------------|------------------|----------------------------------------------|
| `componentsDir` | `src/components` | Directory where your TSX/JSX components live |
| `output`        | `liquidify`      | Output directory (your Shopify theme root)   |
| `force`         | `false`          | Overwrite unmanaged output files             |
| `react`         | `{strictCsp:true}` | React runtime options (`strictCsp`)        |

---

### 3. Run the compiler

```bash
# Build once
npx liquidify

# Watch mode (rebuilds on file changes)
npx liquidify --watch
# or alias:
npx liquidx --watch

# Use an explicit config file, skip the banner, or print the version
npx liquidify --config ./liquidify.config.json
npx liquidify --no-banner
npx liquidify --version
```

---

## 🧩 Directives

Directives are string literals placed at the top of your component file to tell Liquidify how to compile it.

| Directive        | Output                           | Description                                    |
|------------------|----------------------------------|------------------------------------------------|
| `"use react"`    | Liquid + React Island JS bundle  | Interactive React component embedded in Liquid |
| `"use dom"`      | Liquid + plain JS bundle         | Vanilla JS component compiled via esbuild      |
| `"use snippets"` | Liquid snippet                   | Reusable Liquid snippet (no JS)                |
| `"use script"`   | Plain JS bundle only             | Script-only file (no Liquid output)            |

---

## 📝 Usage Examples

### Liquid Section with React Island

```tsx
"use react"

export default function ProductCard() {
  const title = "{{ product.title }}"
  const price = "{{ product.price | money }}"

  return (
    <div className="product-card">
      <h2>{title}</h2>
      <p>{price}</p>
    </div>
  )
}
```

### Liquid Snippet

```tsx
"use snippets"

interface Props {
  heading: string
}

export default function SectionHeader({ heading }: Props) {
  return <h1 className="section-title">{heading}</h1>
}
```

### Vanilla JS Component

```tsx
"use dom"

export default function MobileMenu() {
  return (
    <nav id="mobile-menu">
      <button>Menu</button>
    </nav>
  )
}
```

---

## 🧱 Built-in Components

Import these from `liquidify` to use Liquid-native features inside your TSX:

```tsx
import {
  DynamicBlock,
  RenderSnippet,
  RenderSvg,
  PaginateByLiquid,
  FormBlock,
} from 'liquidify'
```

| Component           | Description                                                    |
|---------------------|----------------------------------------------------------------|
| `DynamicBlock`      | Renders a Liquid dynamic block (`{% content_for "blocks" %}`) |
| `RenderSnippet`     | Renders a Liquid snippet (`{% render 'snippet' %}`)           |
| `RenderSvg`         | Inlines an SVG via Liquid (`{% render 'icon-name' %}`)        |
| `PaginateByLiquid`  | Wraps content in a Liquid `{% paginate %}` block              |
| `FormBlock`         | Renders a Shopify `{% form %}` tag                            |
| `Raw`               | Outputs raw Liquid without escaping                            |
| `Fallback`          | Renders fallback content when a condition fails               |
| `UnlessBlock`       | Inverse of `if` block (`{% unless condition %}...{% endunless %}`) |
| `CaptureBlock`      | Captures output into a variable (`{% capture var %}...{% endcapture %}`) |
| `TablerowByLiquid`  | Iterates over an array in Liquid (`{% tablerow %}...{% endtablerow %}`) |
| `StylesheetBlock`   | Injects a CSS stylesheet into the page                        |
| `JavascriptBlock`   | Injects a JavaScript script into the page                     |

---

## React events and the Shopify theme editor

Strict CSP mode is enabled by default. See [event examples and Shopify section lifecycle](docs/react-events.md) for JSX handlers, registered Liquid actions, native DOM listeners, and cleanup when sections reload in the theme editor.

See [incremental compilation, output cleanup and import resolution](docs/compiler-build.md) for build and watch behavior.

## ⚙️ Programmatic API

You can use Liquidify programmatically in your own scripts:

```ts
import { makeLiquidifyBuilder } from 'liquidify'

const builder = makeLiquidifyBuilder({
  componentsDir: 'src/components',
  output: '.',
})

builder.on('build:start', () => console.log('Building...'))
builder.on('build:end', () => console.log('Done!'))
builder.on('error', (err) => console.error(err.message))

await builder.build()

// Optional: watch for file changes
builder.watch()
```

---

## 📁 Project Structure

```txt
your-shopify-theme/
├── src/
│   └── components/
│       ├── ProductCard.tsx     # "use react"
│       ├── MobileMenu.tsx      # "use dom"
│       └── SectionHeader.tsx   # "use snippets"
├── sections/                   # ← generated .liquid files
├── snippets/                   # ← generated .liquid files
├── assets/                     # ← generated .js bundles
└── liquidify.config.json
```

---

## 🛠️ CLI Reference

```txt
Usage:
  liquidify [options]
  liquidify init [directory] [options]

Commands:
  init [dir]      Initialize a new Shopify + Liquidify project template (default: .)

Options:
  --template, -t  Template to initialize (default: theme, options: theme, starter, default)
  --watch, -w     Watch for file changes and rebuild automatically
  --force, -f     Overwrite existing output/files
  --config <path> Use an explicit config file
  --no-banner     Skip startup banner
  --quiet, -q     Minimal output; implies --no-banner
  --version, -V   Show version
  --help, -h      Show help

Aliases: liquidx, liquidx:watch
```

---

## 📜 License

Proprietary - all rights reserved. See LICENSE file.
