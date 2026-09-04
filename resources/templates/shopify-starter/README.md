# Shopify Liquidify Theme

Shopify theme built with **Liquidify** — JSX/TSX to Shopify Liquid compiler.

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Start development mode
```bash
npm run dev
```

### 3. Build for production
```bash
npm run build
```

### 4. Preview with Shopify CLI
```bash
shopify theme dev
```

---

## Project Structure

```
├── layout/
│   └── theme.liquid            # Shopify base layout (includes react-runtime.js)
├── templates/
│   └── index.json              # Home page template
├── sections/                   # Compiled Shopify sections
├── snippets/                   # Compiled Shopify snippets
├── assets/                     # Assets & JS bundles
├── config/                     # Shopify theme configuration & schema
├── locales/                    # Shopify translation files
├── src/
│   └── components/
│       ├── sections/
│       │   ├── Header.tsx      # "use sections" Header section
│       │   ├── Hero.tsx        # "use sections" Liquid section with schema
│       │   └── Footer.tsx      # "use sections" Footer section
│       ├── islands/
│       │   └── Counter.tsx     # "use react" interactive React Island
│       └── snippets/
│           └── Badge.tsx       # "use snippets" reusable Liquid snippet
├── liquidify.config.json       # Liquidify compiler configuration
└── tsconfig.json               # TypeScript configuration
```
