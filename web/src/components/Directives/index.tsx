import { useState } from "react";
import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import "./style.css";

const ROWS = [
  {
    directive: '"use react"',
  },
  {
    directive: '"use dom"',
  },
  {
    directive: '"use snippets"',
  },
  {
    directive: '"use script"',
  },
];

const BADGES_TSX = `'use snippets'

export const Badges = ({ badges }) => {
  return (
    <div className={styles.badges}>
      {badges && (
        <div className={styles.wrapper}>
          {badges.slice(0, 3).map(
            ({ text, color, background }) => (
              <span class={styles.badge}
                style={{ background, color }}>
                {text}
              </span>
            ))}
        </div>
      )}
    </div>
  )
}`;

const BADGES_LIQUID = `<div class="badges">
  {% if badges != nil and badges != ""
     and badges != false %}
  <div class="wrapper">
    {% for item in badges limit: 3 %}
      {% assign text = item.text %}
      {% assign color = item.color %}
      {% assign background = item.background %}
    <span class="badge"
      style="background: {{ background | escape }};
             color: {{ color | escape }};">
      {{ text | escape }}
    </span>
    {% endfor %}
  </div>
  {% endif %}
</div>`;

const REACT_TSX = `"use react"

export default function ProductCard() {
  const title = "{{ product.title }}"
  const price = "{{ product.price | money }}"

  return (
    <div className="product-card">
      <h2>{title}</h2>
      <p>{price}</p>
      <button onClick="addToCart">
        Adicionar
      </button>
    </div>
  )
}`;

const REACT_LIQUID = `<div class="product-card">
  <h2>{{ product.title }}</h2>
  <p>{{ product.price | money }}</p>
</div>
<react-island component="ProductCard">
  <script type="application/json"
    data-react-props>{}</script>
</react-island>
{% comment %} + assets/product-card.js
  (bundle esbuild) {% endcomment %}`;

const DOM_TSX = `"use dom"

export default function MobileMenu() {
  return (
    <nav id="mobile-menu">
      <button data-action="open">Menu</button>
      <div className="drawer" hidden>
        {% for link in linklists.main-menu.links %}
          <a href="{{ link.url }}">
            {{ link.title }}
          </a>
        {% endfor %}
      </div>
    </nav>
  )
}`;

const DOM_LIQUID = `<nav id="mobile-menu">
  <button data-action="open">Menu</button>
  <div class="drawer" hidden>
    {% for link in linklists.main-menu.links %}
      <a href="{{ link.url | escape }}">
        {{ link.title | escape }}
      </a>
    {% endfor %}
  </div>
</nav>
{% comment %} + assets/mobile-menu.js {% endcomment %}`;

const CATALOG_LIQUID = `{% paginate collection.products by by %}
{% if collection.products.size > 0 %}
<div class="product-grid">
  {% for item in collection.products %}
    {% render 'card', key: item.id, item: item %}
  {% endfor %}
</div>
{% else %}
<react-island component="BaseEmptyState">
  <script type="application/json" data-react-props>
    {"heading": "'collection.empty_heading' | t", …}
  </script>
</react-island>
{% endif %}
{% endpaginate %}`;

type TabId = "snippets" | "react" | "dom";

const TABS: { id: TabId; label: string }[] = [
  { id: "snippets", label: '"use snippets"' },
  { id: "react", label: '"use react"' },
  { id: "dom", label: '"use dom"' },
];

export default function Directives() {
  const [active, setActive] = useState<TabId>("snippets");
  const { locale } = useLocale();
  const copy = locale === "pt-BR"
    ? { title: "Diretivas", intro: "String literal no topo do arquivo. Ela decide o que o compilador gera. Exemplos reais extraídos do template", headers: ["Diretiva", "Saída", "Quando usar"], rows: [["Liquid + bundle React Island", "Componente interativo dentro do Liquid"], ["Liquid + bundle JS vanilla", "Menu, drawer, slider sem React"], ["Snippet Liquid (sem JS)", "Partes reutilizáveis: badges, botões"], ["Somente bundle JS", "Script global, sem saída Liquid"]], tabs: "Exemplos por diretiva", source: "Fonte real:", island: "Padrão React Island: Liquid renderiza o shell +", output: "Saída", advanced: "Exemplo avançado real: paginate + island.", advancedText: "O snippet catalog.liquid gerado a partir do TSX combina", see: "Ver na loja demo" }
    : { title: "Directives", intro: "A string literal at the top of the file. It determines what the compiler generates. Real examples from the", headers: ["Directive", "Output", "Use when"], rows: [["Liquid + React Island bundle", "An interactive component inside Liquid"], ["Liquid + vanilla JS bundle", "A menu, drawer, or slider without React"], ["Liquid snippet (no JS)", "Reusable pieces: badges and buttons"], ["JS bundle only", "A global script with no Liquid output"]], tabs: "Examples by directive", source: "Real source:", island: "React Island pattern: Liquid renders the shell +", output: "Output", advanced: "Real advanced example: paginate + island.", advancedText: "The catalog.liquid snippet generated from TSX combines", see: "See it in the store demo" };

  return (
    <section id="diretivas" className="wrap section">
      <p className="kicker">Compiler behavior</p>
      <h2>{copy.title}</h2>
      <p className="muted">
        {copy.intro} <code>example</code> {locale === "pt-BR" ? "." : " template."}
      </p>
      <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {copy.headers.map((header) => <th key={header}>{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, index) => (
            <tr key={row.directive}>
              <td>
                <code>{row.directive}</code>
              </td>
              <td>{copy.rows[index][0]}</td>
              <td>{copy.rows[index][1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div className="tabs" role="tablist" aria-label={copy.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={tab.id === active ? "tab active" : "tab"}
            role="tab"
            type="button"
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-panels">
        {active === "snippets" && (
          <article className="tab-panel active">
            <p className="muted">
              {copy.source}{" "}
              <code>src/app/components/Badges/index.tsx</code> →{" "}
              <code>snippets/badges.liquid</code>
            </p>
            <div className="cols">
              <div>
                <Snippet title="Badges/index.tsx" code={BADGES_TSX} language="tsx" />
              </div>
              <div>
                <Snippet
                  title={`snippets/badges.liquid (${locale === "pt-BR" ? "gerado" : "generated"})`}
                  code={BADGES_LIQUID}
                  language="liquid"
                />
              </div>
            </div>
          </article>
        )}

        {active === "react" && (
          <article className="tab-panel active">
            <p className="muted">
              {copy.island}{" "}
              <code>&lt;react-island&gt;</code> hidrata no cliente.
            </p>
            <div className="cols">
              <div>
                <Snippet title="ProductCard.tsx" code={REACT_TSX} language="tsx" />
              </div>
              <div>
                <Snippet title={`${copy.output} (Liquid + island)`} code={REACT_LIQUID} language="liquid" />
              </div>
            </div>
          </article>
        )}

        {active === "dom" && (
          <article className="tab-panel active">
            <div className="cols">
              <div>
                <Snippet title="MobileMenu.tsx" code={DOM_TSX} language="tsx" />
              </div>
              <div>
                <Snippet
                  title={`${copy.output} (Liquid + vanilla JS)`}
                  code={DOM_LIQUID}
                  language="liquid"
                />
              </div>
            </div>
          </article>
        )}
      </div>

      <div className="callout">
        <strong>{copy.advanced}</strong> {copy.advancedText}{" "}
        <code>{"{% paginate %}"}</code> com fallback para{" "}
        <code>&lt;react-island component="BaseEmptyState"&gt;</code>.{" "}
        <a href="#/example">{copy.see} ↓</a>
      </div>
      <Snippet code={CATALOG_LIQUID} language="liquid" />
    </section>
  );
}
