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
import "./style.css";

const SETUP = `npx liquidify init minha-loja --template example
cd minha-loja
npm install
npm run dev

# segundo terminal: prévia na development store
npm run preview -- --store sua-loja.myshopify.com`;

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
        <div id={`showcase-panel-${index}`} role="tabpanel">
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
  const copy = pt
    ? {
        title: "A loja example, peça por peça",
        intro:
          "O template example é uma fashion store completa — header, home, coleção, produto e carrinho Ajax. Abaixo, 6 peças reais com TSX, Liquid gerado e CSS: do snippet simples à página de produto com ilhas.",
        setupTitle: "Rode a loja em 4 comandos",
        blocks: [
          {
            kicker: "Section · Home",
            title: "Hero que o lojista edita no Theme Editor",
            text: "TSX com section.settings vira Liquid com {% if %} + {% schema %}. O CSS ao lado do componente vira {% stylesheet %}. O lojista troca título, links e imagens sem tocar em código.",
          },
          {
            kicker: "Snippet · Catálogo",
            title: "Card de produto 100% Liquid, sem JS",
            text: "O componente mais reutilizado da loja: hover com segunda imagem, badges via {% render %}, preço com | money e quick-add com fallback. Tudo Liquid puro.",
          },
          {
            kicker: "Island · Carrinho",
            title: "MiniCart hidrata só onde precisa",
            text: "'use react' gera só o bundle JS. O <react-island> com as props é emitido no snippet que consome a ilha. O HTML indexável vem do Liquid; o Preact assume contador, drawer e toasts.",
          },
          {
            kicker: "Snippet complexo · Coleção",
            title: "Catálogo com paginação real",
            text: "PaginateByLiquid vira {% paginate %}, o .map vira {% for %} com {% render 'card' %}, e o estado vazio vira ilha. A paginação (anterior, páginas, elipse) é Liquid com rel=prev/next.",
          },
          {
            kicker: "Section · Newsletter",
            title: "Formulário Shopify com schema",
            text: "FormBlock vira {% form 'customer' %} com sucesso e erros tratados. As settings (títulos, cor de fundo) viram painel do Theme Editor via schema traduzido.",
          },
          {
            kicker: "Section complexa · Produto",
            title: "A página que junta tudo",
            text: "Liquid indexável + <liquid-data> com o produto serializado + ilhas (variantes, quantidade) + blocos do editor + SEO com structured_data. O exemplo mais completo do template.",
          },
        ],
        checklistTitle: "Checkpoint antes do preview",
        checklist: [
          "npm run dev gerou sections/, snippets/ e assets/ na raiz do tema.",
          "Produtos, coleção all e menus criados na development store.",
          "Theme Editor abre Hero, Shelf e ProductInfo com settings em PT + EN.",
          "shopify theme check passa sem erros de Liquid ou schema.",
        ],
      }
    : {
        title: "The example store, piece by piece",
        intro:
          "The example template is a complete fashion store — header, home, collection, product, and Ajax cart. Below, 6 real pieces with TSX, generated Liquid, and CSS: from simple snippet to island-powered product page.",
        setupTitle: "Run the store in 4 commands",
        blocks: [
          {
            kicker: "Section · Home",
            title: "Hero the merchant edits in Theme Editor",
            text: "TSX with section.settings becomes Liquid with {% if %} + {% schema %}. Colocated CSS becomes {% stylesheet %}. Merchants change copy, links, and images without code.",
          },
          {
            kicker: "Snippet · Catalog",
            title: "Product card in 100% Liquid, no JS",
            text: "The store's most reused component: hover second image, badges via {% render %}, | money pricing, quick-add with fallback. Pure Liquid.",
          },
          {
            kicker: "Island · Cart",
            title: "MiniCart hydrates only where needed",
            text: "'use react' outputs only the JS bundle. The <react-island> with props is emitted in the consuming snippet. Indexable HTML comes from Liquid; Preact takes over count, drawer, and toasts.",
          },
          {
            kicker: "Complex snippet · Collection",
            title: "Catalog with real pagination",
            text: "PaginateByLiquid becomes {% paginate %}, .map becomes {% for %} with {% render 'card' %}, empty state becomes an island. Pagination (prev, pages, ellipsis) is Liquid with rel=prev/next.",
          },
          {
            kicker: "Section · Newsletter",
            title: "Shopify form with schema",
            text: "FormBlock becomes {% form 'customer' %} with success and errors handled. Settings (copy, background color) become a Theme Editor panel via translated schema.",
          },
          {
            kicker: "Complex section · Product",
            title: "The page that combines everything",
            text: "Indexable Liquid + <liquid-data> with serialized product + islands (variants, quantity) + editor blocks + structured_data SEO. The template's most complete example.",
          },
        ],
        checklistTitle: "Checkpoint before preview",
        checklist: [
          "npm run dev generated sections/, snippets/, and assets/ at the theme root.",
          "Products, the all collection, and menus exist in the dev store.",
          "Theme Editor opens Hero, Shelf, and ProductInfo with PT + EN settings.",
          "shopify theme check passes with no Liquid or schema errors.",
        ],
      };

  return (
    <section id="loja" className="wrap section example-showcase">
      <p className="kicker">Example · fashion store</p>
      <h2>{copy.title}</h2>
      <p className="section-sub">{copy.intro}</p>

      <div className="setup-card">
        <Snippet title={copy.setupTitle} code={SETUP} language="plain" />
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
                <span className="mock-eyebrow">● New season</span>
                <strong>
                  Vista
                  <br />
                  <em>o novo</em>
                </strong>
                <span className="mock-btn">Explorar ↗</span>
              </div>
              <div className="mock-photo">
                <img src={womenImg} alt="" loading="eager" decoding="async" width="925" height="617" fetchPriority="high" />
              </div>
              <div className="mock-photo alt">
                <img src={menImg} alt="" loading="lazy" decoding="async" width="925" height="617" />
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
