import { useState } from "react";
import { useLocale } from "../../i18n.tsx";
import CodeBlock from "../CodeBlock/index.tsx";
import "./style.css";

const TSX_SAMPLE = `type Product = {
  url: string
  title: string
  price: number
  featured_image?: { alt?: string | null } | null
}

"use snippets"

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <a href={product.url}>
        <img
          src="{{ product.featured_image | image_url: width: 700 }}"
          alt="{{ product.title | escape }}"
          loading="lazy"
        />
      </a>
      <h3>{'product.title | escape'}</h3>
      <strong>{'product.price | money'}</strong>
    </article>
  );
}`;

const LIQUID_SAMPLE = `<article class="product-card">
  <a href="{{ product.url }}">
    <img
      src="{{ product.featured_image | image_url: width: 700 }}"
      alt="{{ product.title | escape }}"
      loading="lazy" />
  </a>
  <h3>{{ product.title | escape }}</h3>
  <strong>{{ product.price | money }}</strong>
</article>

{% schema %}
{ "name": "Product card", "settings": [] }
{% endschema %}`;

export default function Hero() {
  const { locale } = useLocale();
  const [tab, setTab] = useState<"tsx" | "liquid">("tsx");
  const pt = locale === "pt-BR";
  const copy = pt
    ? {
        eyebrow: "Liquidify · TSX para Shopify Liquid",
        titleA: "Escreva TSX.",
        titleB: "Entregue Liquid.",
        description:
          "O Liquidify compila componentes React-like em sections, snippets e islands que o Shopify entende — com schema, stylesheet e bundles gerados juntos.",
        action: "Começar pela documentação",
        secondary: "Ver a loja example",
        install: "npx liquidify init minha-loja --template example",
        demoLabel: "Conversão real do compilador",
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
          ["👀 Watch mode", "Recompila no save durante o theme dev.", "#/api/build"],
          ["⚡ esbuild + Babel", "Bundles rápidos com CSP estrito por padrão.", "#/api/cli"],
        ],
      }
    : {
        eyebrow: "Liquidify · TSX to Shopify Liquid",
        titleA: "Write TSX.",
        titleB: "Ship Liquid.",
        description:
          "Liquidify compiles React-like components into sections, snippets, and islands Shopify understands — with schema, stylesheet, and bundles generated together.",
        action: "Start with the docs",
        secondary: "See the example store",
        install: "npx liquidify init my-store --template example",
        demoLabel: "Real compiler conversion",
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
          ["👀 Watch mode", "Recompiles on save during theme dev.", "#/api/build"],
          ["⚡ esbuild + Babel", "Fast bundles with strict CSP by default.", "#/api/cli"],
        ],
      };

  return (
    <section className="doc-hero">
      <div className="wrap hero-layout">
        <div className="hero-copy">
          <p className="crumb">
            <span className="crumb-dot" aria-hidden="true" /> {copy.eyebrow}
          </p>
          <h1>
            {copy.titleA}
            <br />
            <span>{copy.titleB}</span>
          </h1>
          <p className="lede">{copy.description}</p>
          <div className="hero-cta">
            <a className="btn btn-primary" href="#/docs/start">
              {copy.action} →
            </a>
            <a className="btn" href="#/example">
              {copy.secondary} →
            </a>
          </div>
          <code className="install">{copy.install}</code>
        </div>

        <div className="hero-demo">
          <div className="demo-window">
            <div className="demo-bar">
              <span className="demo-dots" aria-hidden="true">
                <i /> <i /> <i />
              </span>
              <span className="demo-label">{copy.demoLabel}</span>
              <div className="demo-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "tsx"}
                  className={tab === "tsx" ? "active" : ""}
                  onClick={() => setTab("tsx")}
                >
                  ProductCard.tsx
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "liquid"}
                  className={tab === "liquid" ? "active" : ""}
                  onClick={() => setTab("liquid")}
                >
                  card.liquid
                </button>
              </div>
            </div>
            <CodeBlock
              code={tab === "tsx" ? TSX_SAMPLE : LIQUID_SAMPLE}
              path={tab === "tsx" ? "ProductCard.tsx" : "card.liquid"}
            />
            <p className="demo-foot">TSX → Liquid · schema + stylesheet incluídos no build</p>
          </div>
        </div>
      </div>

      <div className="wrap">
        <ol className="hero-pipeline">
          {copy.pipeline.map(([n, title, text, href]) => (
            <li className="hero-pipeline-step" key={title}>
              <a href={href}>
                <span className="hero-pipeline-n" aria-hidden="true">{n}</span>
                <div>
                  <strong>{title} →</strong>
                  <span>{text}</span>
                </div>
              </a>
            </li>
          ))}
        </ol>
        <div className="feature-grid">
          {copy.features.map(([title, text, href]) => (
            <a className="feature-card" key={title} href={href}>
              <strong>{title} →</strong>
              <span>{text}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
