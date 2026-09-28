import { useRef, useState, type KeyboardEvent } from "react";
import { _match, _Maybe } from "funcio";
import { useLocale } from "../../i18n.tsx";
import { toHref } from "../../lib/routes.ts";
import CodeBlock from "../CodeBlock/index.tsx";
import styles from "./style.module.css";
import { cx } from "../../constants/cx.ts";

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
  const [copied, setCopied] = useState(false);
  const tsxTabRef = useRef<HTMLButtonElement>(null);
  const liquidTabRef = useRef<HTMLButtonElement>(null);
  const pt = locale === "pt-BR";
  const copy = pt
    ? {
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
        tutorial: "5-min Hello World tutorial",
        secondary: "See the example store",
        install: "npx liquidify init my-store --template example",
        demoLabel: "Real compiler conversion",
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
          ["👀 Watch mode", "Recompiles on save during theme dev.", "#/api/build"],
          ["⚡ esbuild + Babel", "Fast bundles with strict CSP by default.", "#/api/cli"],
        ],
      };

  const installCmd = copy.install;

  async function copyInstall() {
    try {
      await navigator.clipboard.writeText(installCmd);
    } catch {
      const area = document.createElement("textarea");
      area.value = installCmd;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function focusTab(next: "tsx" | "liquid") {
    setTab(next);
    window.requestAnimationFrame(() => {
      _match(next)
        .with("tsx", () => tsxTabRef.current?.focus())
        .with("liquid", () => liquidTabRef.current?.focus())
        .exec();
    });
  }

  function onTabKeyDown(event: KeyboardEvent) {
    _Maybe.of(
      _match(event.key)
        .with("ArrowRight", () => focusTab("liquid"))
        .with("ArrowLeft", () => focusTab("tsx"))
        .exec(),
    ).getOrElse(undefined);
    _match(event.key === "ArrowRight" || event.key === "ArrowLeft")
      .with(true, () => event.preventDefault())
      .with(false, () => undefined)
      .exec();
  }

  return (
    <section className={styles.docHero}>
      <div className={cx('wrap', styles.heroLayout)}>
        <div className={styles.heroCopy}>
          <p className={styles.crumb}>
            <span className={styles.crumbDot} aria-hidden="true" /> {copy.eyebrow}
          </p>
          <h1>
            {copy.titleA}
            <br />
            <span>{copy.titleB}</span>
          </h1>
          <p className={styles.lede}>{copy.description}</p>
          <div className={styles.heroCta}>
            <a className={cx('btn', 'btn-primary')} href={toHref("#/docs/hello")}>
              {copy.tutorial} →
            </a>
            <a className="btn" href={toHref("#/docs/start")}>
              {copy.action} →
            </a>
            <a className="btn" href={toHref("#/example")}>
              {copy.secondary} →
            </a>
          </div>
          <div className={styles.installRow}>
            <code className={styles.install}>{installCmd}</code>
            <button type="button" className="icon-btn" onClick={copyInstall} aria-live="polite">
              {copied ? (locale === "pt-BR" ? "Copiado ✓" : "Copied ✓") : (locale === "pt-BR" ? "Copiar" : "Copy")}
            </button>
          </div>
          <ul className={styles.firstAnswers}>
            {copy.answers.map(([q, a, href]) => (
              <li key={q}>
                <a href={toHref(href)}>
                  <strong>{q}</strong>
                  <span>{a}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.heroDemo}>
          <div className={styles.demoWindow}>
            <div className={styles.demoBar}>
              <span className={styles.demoDots} aria-hidden="true">
                <i /> <i /> <i />
              </span>
              <span className={styles.demoLabel}>{copy.demoLabel}</span>
              <div className={styles.demoTabs} role="tablist" aria-label={copy.demoLabel} onKeyDown={onTabKeyDown}>
                <button
                  ref={tsxTabRef}
                  type="button"
                  role="tab"
                  id="hero-tab-tsx"
                  aria-selected={tab === "tsx"}
                  aria-controls="hero-panel"
                  tabIndex={tab === "tsx" ? 0 : -1}
                  className={tab === "tsx" ? styles.active : ""}
                  onClick={() => setTab("tsx")}
                >
                  ProductCard.tsx
                </button>
                <button
                  ref={liquidTabRef}
                  type="button"
                  role="tab"
                  id="hero-tab-liquid"
                  aria-selected={tab === "liquid"}
                  aria-controls="hero-panel"
                  tabIndex={tab === "liquid" ? 0 : -1}
                  className={tab === "liquid" ? styles.active : ""}
                  onClick={() => setTab("liquid")}
                >
                  card.liquid
                </button>
              </div>
            </div>
            <div id="hero-panel" role="tabpanel" aria-labelledby={tab === "tsx" ? "hero-tab-tsx" : "hero-tab-liquid"}>
            <CodeBlock
              code={tab === "tsx" ? TSX_SAMPLE : LIQUID_SAMPLE}
              path={tab === "tsx" ? "ProductCard.tsx" : "card.liquid"}
            />
            </div>
            <p className={styles.demoFoot}>TSX → Liquid · schema + stylesheet incluídos no build</p>
          </div>
        </div>
      </div>

      <div className="wrap">
        <ol className={styles.heroPipeline}>
          {copy.pipeline.map(([n, title, text, href]) => (
            <li className={styles.heroPipelineStep} key={title}>
              <a href={toHref(href)}>
                <span className={styles.heroPipelineN} aria-hidden="true">{n}</span>
                <div>
                  <strong>{title} →</strong>
                  <span>{text}</span>
                </div>
              </a>
            </li>
          ))}
        </ol>
        <div className={styles.featureGrid}>
          {copy.features.map(([title, text, href]) => (
            <a className={styles.featureCard} key={title} href={toHref(href)}>
              <strong>{title} →</strong>
              <span>{text}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
