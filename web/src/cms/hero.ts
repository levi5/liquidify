import type { Locale } from "../i18n.tsx";

export const HERO_TSX = `"use snippets"

import { escape, imageUrl, money } from 'liquidify'

type Product = {
  url: string
  title: string
  price: number
  featured_image?: unknown
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <a href={product.url}>
        <img
          src={imageUrl(product.featured_image, { width: 700 })}
          alt={escape(product.title)}
          loading="lazy"
        />
      </a>
      <h3>{escape(product.title)}</h3>
      <strong>{money(product.price)}</strong>
    </article>
  );
}`;

export const HERO_LIQUID = `<article class="product-card">
  <a href="{{ product.url }}">
    <img
      src="{{ product.featured_image | image_url: width: 700 | escape }}"
      alt="{{ product.title | escape }}"
      loading="lazy" />
  </a>
  <h3>{{ product.title | escape }}</h3>
  <strong>{{ product.price | money }}</strong>
</article>

{% schema %}
{ "name": "Product card", "settings": [] }
{% endschema %}`;

export type HeroCopy = {
  eyebrow: string;
  titleA: string;
  titleB: string;
  description: string;
  action: string;
  tutorial: string;
  secondary: string;
  install: string;
  demoLabel: string;
  demoFoot: string;
  answers: string[][];
  pipeline: string[][];
  features: string[][];
};

export const HERO_COPY: Record<Locale, HeroCopy> = {
  "pt-BR": {
    eyebrow: "Liquidify · TSX para Shopify Liquid",
    titleA: "Escreva TSX.",
    titleB: "Entregue Liquid.",
    description:
      "O Liquidify compila componentes React-like em sections, snippets e islands que o Shopify entende — com schema, stylesheet e bundles gerados juntos.",
    action: "Começar pela documentação",
    tutorial: "Tutorial Hello World em 5 min",
    secondary: "Ver a loja example",
    install: "npx liquidify init minha-loja --template example",
    demoLabel: "Conversão real do compilador",
    demoFoot: "TSX → Liquid · schema + stylesheet incluídos no build",
    answers: [
      ["Preciso de loja?", "Uma development store grátis basta para a prévia.", "#/docs/start"],
      ["Preciso saber React?", "Não. TSX básico basta; o interativo vive nas ilhas.", "#/docs/concepts"],
      ["É bom para SEO?", "Sim. O HTML vem do servidor; o JS só hidrata ilhas.", "#/docs/runtime"],
      ["Substitui meu tema?", "Não. Gera sections e snippets dentro do tema Shopify.", "#/docs/theme-model"],
    ],
    pipeline: [
      ["1", "Escreva", "Sections e snippets em TSX, com dados Shopify via {{ }}.", "#/docs/authoring"],
      ["2", "Compile", "Liquid + schema + CSS + JS gerados sem editar à mão.", "#/docs/theme-model"],
      ["3", "Rode", "Theme Check passa, Theme Editor abre, loja vende.", "#/example"],
    ],
    features: [
      ["⚛️ TSX familiar", "Props, condicionais e loops viram if/for do Liquid.", "#/docs/authoring"],
      ["🏝️ React Islands", `"use react" hidrata só o interativo: carrinho, variantes.`, "#/docs/runtime"],
      ["📄 Snippets nativos", `"use snippets" gera Liquid puro, sem JS.`, "#/api/tsx"],
      ["🧱 Primitivos Shopify", "Paginate, Form, DynamicBlock e RenderSnippet.", "#/api/tsx"],
      ["👀 Watch mode", "Recompila no save durante o theme dev.", "#/api/cli#commands"],
      ["⚡ esbuild + Babel", "Bundles rápidos com CSP estrito por padrão.", "#/api/cli"],
    ],
  },
  en: {
    eyebrow: "Liquidify · TSX to Shopify Liquid",
    titleA: "Write TSX.",
    titleB: "Ship Liquid.",
    description:
      "Liquidify compiles React-like components into sections, snippets, and islands Shopify understands — with schema, stylesheet, and bundles generated together.",
    action: "Start with the docs",
    tutorial: "5-min Hello World tutorial",
    secondary: "See the example store",
    install: "npx liquidify init my-store --template example",
    demoLabel: "Real compiler conversion",
    demoFoot: "TSX → Liquid · schema + stylesheet included in the build",
    answers: [
      ["Do I need a store?", "A free development store is enough for preview.", "#/docs/start"],
      ["Do I need React?", "No. Basic TSX is enough; interactivity lives in islands.", "#/docs/concepts"],
      ["Is it SEO-safe?", "Yes. HTML comes from the server; JS only hydrates islands.", "#/docs/runtime"],
      ["Does it replace my theme?", "No. It generates sections and snippets inside the Shopify theme.", "#/docs/theme-model"],
    ],
    pipeline: [
      ["1", "Write", "Sections and snippets in TSX, with Shopify data via {{ }}.", "#/docs/authoring"],
      ["2", "Compile", "Liquid + schema + CSS + JS generated, no hand-editing.", "#/docs/theme-model"],
      ["3", "Run", "Theme Check passes, Theme Editor opens, store sells.", "#/example"],
    ],
    features: [
      ["⚛️ Familiar TSX", "Props, conditionals, and loops become Liquid if/for.", "#/docs/authoring"],
      ["🏝️ React Islands", `"use react" hydrates only the interactive parts.`, "#/docs/runtime"],
      ["📄 Native snippets", `"use snippets" outputs pure Liquid, no JS.`, "#/api/tsx"],
      ["🧱 Shopify primitives", "Paginate, Form, DynamicBlock, RenderSnippet.", "#/api/tsx"],
      ["👀 Watch mode", "Recompiles on save during theme dev.", "#/api/cli#commands"],
      ["⚡ esbuild + Babel", "Fast bundles with strict CSP by default.", "#/api/cli"],
    ],
  },
};
