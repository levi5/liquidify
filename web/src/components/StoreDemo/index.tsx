import { useState, type KeyboardEvent } from "react";
import { _match, _Maybe } from "funcio";
import { useLocale } from "../../i18n.tsx";
import CodeBlock from "../CodeBlock/index.tsx";
import Snippet from "../Snippet/index.tsx";
import {
  HERO_TSX, HERO_LIQUID, HERO_CSS,
  CARD_TSX, CARD_LIQUID, CARD_CSS,
  MINICART_TSX, MINICART_LIQUID, MINICART_CSS,
} from "../../constants/store-demo.ts";
import {
  CATALOG_TSX, CATALOG_LIQUID, CATALOG_CSS,
  NEWS_TSX, NEWS_LIQUID, NEWS_CSS,
  PROD_TSX, PROD_LIQUID, PROD_CSS,
} from "../../constants/store-demo-extra.ts";
import { CatalogPreview, ProductPreview, NewsletterPreview, CartPreview } from "./previews.tsx";
import { STORE_SETUP, STORE_COPY } from "../../cms/store-demo.ts";
import "./style.css";

type Tab = "tsx" | "liquid" | "css";

function ShowcaseBlock({
  index,
  kicker,
  title,
  text,
  source,
  output,
  tsx,
  tsxFile,
  liquid,
  liquidFile,
  css,
  cssFile,
  preview,
}: {
  index: string;
  kicker: string;
  title: string;
  text: string;
  source: string;
  output: string;
  tsx: string;
  tsxFile: string;
  liquid: string;
  liquidFile: string;
  css: string;
  cssFile: string;
  preview: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("tsx");
  const files: Record<Tab, { label: string; code: string; path: string }> = {
    tsx: { label: tsxFile, code: tsx, path: "example.tsx" },
    liquid: { label: liquidFile, code: liquid, path: "output.liquid" },
    css: { label: cssFile, code: css, path: "styles.css" },
  };
  const tabIds: Tab[] = ["tsx", "liquid", "css"];

  function focusTab(next: Tab) {
    setTab(next);
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-showcase-tab="${index}-${next}"]`)?.focus();
    });
  }

  function go(event: KeyboardEvent, next: Tab) {
    event.preventDefault();
    focusTab(next);
  }

  function onTabKeyDown(event: KeyboardEvent) {
    const at = tabIds.indexOf(tab);
    _Maybe.of(
      _match(event.key)
        .with("ArrowRight", () => go(event, tabIds[(at + 1) % tabIds.length]))
        .with("ArrowLeft", () => go(event, tabIds[(at - 1 + tabIds.length) % tabIds.length]))
        .with("Home", () => go(event, tabIds[0]))
        .with("End", () => go(event, tabIds[tabIds.length - 1]))
        .exec(),
    ).getOrElse(undefined);
  }

  return (
    <article className="showcase-block">
      <div className="showcase-info">
        <p className="showcase-index">
          <span>{index}</span> {kicker}
        </p>
        <h3>{title}</h3>
        <p>{text}</p>
        <p className="showcase-map">
          <code>{source}</code>
          <span aria-hidden="true"> → </span>
          <code>{output}</code>
        </p>
        <div className="showcase-preview">{preview}</div>
      </div>
      <div className="showcase-code">
        <div className="showcase-tabs" role="tablist" aria-label={title} onKeyDown={onTabKeyDown}>
          {tabIds.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              data-showcase-tab={`${index}-${id}`}
              aria-selected={tab === id}
              aria-controls={`showcase-panel-${index}`}
              tabIndex={tab === id ? 0 : -1}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              {files[id].label}
            </button>
          ))}
        </div>
        <div id={`showcase-panel-${index}`} role="tabpanel" aria-label={title} tabIndex={0}>
          <CodeBlock code={files[tab].code} path={files[tab].path} showCopy />
        </div>
      </div>
    </article>
  );
}

export default function StoreDemo() {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const base = import.meta.env.BASE_URL || "/";
  const womenImg = `${base}store/liquidify-women.jpg`;
  const menImg = `${base}store/liquidify-men.jpg`;
  const copy = STORE_COPY[locale];

  return (
    <section id="loja" className="wrap section example-showcase">
      <p className="kicker">Example · fashion store</p>
      <h2>{copy.title}</h2>
      <p className="section-sub">{copy.intro}</p>

      <div className="setup-card">
        <Snippet title={copy.setupTitle} code={STORE_SETUP[locale]} language="plain" />
      </div>

      <div className="showcase-list">
        <ShowcaseBlock
          index="01"
          kicker={copy.blocks[0].kicker}
          title={copy.blocks[0].title}
          text={copy.blocks[0].text}
          source="src/app/sections/Home/Hero/index.tsx"
          output="sections/hero.liquid"
          tsx={HERO_TSX}
          tsxFile="Hero/index.tsx"
          liquid={HERO_LIQUID}
          liquidFile="hero.liquid"
          css={HERO_CSS}
          cssFile="Hero/styles.css"
          preview={
            <div className="mock-hero" aria-hidden="true">
              <div className="mock-hero-copy">
                <span className="mock-eyebrow">{pt ? "● Nova coleção" : "● New season"}</span>
                <strong>
                  {pt ? "Vista" : "Wear"}
                  <br />
                  <em>{pt ? "o novo" : "the new"}</em>
                </strong>
                <span className="mock-btn">{pt ? "Explorar ↗" : "Explore ↗"}</span>
              </div>
              <div className="mock-photo">
                <img src={womenImg} alt="" loading="eager" decoding="async" width="925" height="617" fetchPriority="high" sizes="(max-width: 960px) 100vw, 50vw" />
              </div>
              <div className="mock-photo alt">
                <img src={menImg} alt="" loading="lazy" decoding="async" width="925" height="617" sizes="(max-width: 960px) 50vw, 25vw" />
              </div>
            </div>
          }
        />
        <ShowcaseBlock
          index="02"
          kicker={copy.blocks[1].kicker}
          title={copy.blocks[1].title}
          text={copy.blocks[1].text}
          source="src/app/components/Card/index.tsx"
          output="snippets/card.liquid"
          tsx={CARD_TSX}
          tsxFile="Card/index.tsx"
          liquid={CARD_LIQUID}
          liquidFile="card.liquid"
          css={CARD_CSS}
          cssFile="Card/styles.css"
          preview={
            <div className="mock-shelf" aria-hidden="true">
              {[[pt ? "Vestido Seda" : "Silk Dress", "R$ 459", womenImg], [pt ? "Casaco Linho" : "Linen Coat", "R$ 689", menImg], [pt ? "Bolsa Couro" : "Leather Bag", "R$ 389", null]].map(([name, price, img]) => (
                <div className="mock-card" key={name as string}>
                  <div className="mock-img">{img ? <img src={img as string} alt="" loading="lazy" decoding="async" width="925" height="617" /> : "LQ."}</div>
                  <span>{name}</span>
                  <strong>{price}</strong>
                </div>
              ))}
            </div>
          }
        />
        <ShowcaseBlock
          index="03"
          kicker={copy.blocks[2].kicker}
          title={copy.blocks[2].title}
          text={copy.blocks[2].text}
          source="src/app/components/MiniCart/index.tsx"
          output="assets/mini-cart.js"
          tsx={MINICART_TSX}
          tsxFile="MiniCart/index.tsx"
          liquid={MINICART_LIQUID}
          liquidFile="header-user-options.liquid"
          css={MINICART_CSS}
          cssFile="MiniCart/styles.css"
          preview={<CartPreview />}
        />
        <ShowcaseBlock
          index="04"
          kicker={copy.blocks[3].kicker}
          title={copy.blocks[3].title}
          text={copy.blocks[3].text}
          source="src/app/components/Catalog/index.tsx"
          output="snippets/catalog.liquid"
          tsx={CATALOG_TSX}
          tsxFile="Catalog/index.tsx"
          liquid={CATALOG_LIQUID}
          liquidFile="catalog.liquid"
          css={CATALOG_CSS}
          cssFile="Catalog/styles.css"
          preview={<CatalogPreview womenImg={womenImg} menImg={menImg} />}
        />
        <ShowcaseBlock
          index="05"
          kicker={copy.blocks[4].kicker}
          title={copy.blocks[4].title}
          text={copy.blocks[4].text}
          source="src/app/sections/Newsletter/index.tsx"
          output="sections/newsletter.liquid"
          tsx={NEWS_TSX}
          tsxFile="Newsletter/index.tsx"
          liquid={NEWS_LIQUID}
          liquidFile="newsletter.liquid"
          css={NEWS_CSS}
          cssFile="Newsletter/styles.css"
          preview={<NewsletterPreview />}
        />
        <ShowcaseBlock
          index="06"
          kicker={copy.blocks[5].kicker}
          title={copy.blocks[5].title}
          text={copy.blocks[5].text}
          source="src/app/sections/ProductInfo/index.tsx"
          output="sections/product-info.liquid"
          tsx={PROD_TSX}
          tsxFile="ProductInfo/index.tsx"
          liquid={PROD_LIQUID}
          liquidFile="product-info.liquid"
          css={PROD_CSS}
          cssFile="ProductInfo/styles.css"
          preview={<ProductPreview img={womenImg} />}
        />
      </div>

      <aside className="example-finish">
        <h3>{copy.checklistTitle}</h3>
        <ul>
          {copy.checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
