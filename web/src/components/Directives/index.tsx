import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";

const SECTIONS_TSX = `'use sections'

export function Hero() {
  return (
    <section className="fashion-hero container">
      <h1>
        {section.settings.heading
          ? 'section.settings.heading | escape'
          : "'hero.heading' | t"}
      </h1>
      <a href="{{ section.settings.link | default: routes.all_products_collection_url }}">
        {"'hero.button' | t"}
      </a>
    </section>
  );
}

export const schema = {
  name: 'Hero',
  settings: [{ type: 'text', id: 'heading', label: 'Heading' }],
  presets: [{ name: 'Default' }],
};`;

const SECTIONS_LIQUID = `<section class="fashion-hero container">
  <h1>
    {% if section.settings.heading %}
      {{ section.settings.heading | escape }}
    {% else %}
      {{ 'hero.heading' | t }}
    {% endif %}
  </h1>
  <a href="{{ section.settings.link | default: routes.all_products_collection_url }}">
    {{ 'hero.button' | t }}
  </a>
</section>

{% schema %}
{ "name": "Hero",
  "settings": [{ "type": "text", "id": "heading" }],
  "presets": [{ "name": "Default" }] }
{% endschema %}`;

const SNIPPETS_TSX = `'use snippets'

export const Badges = ({ badges }: { badges?: any[] }) => {
  return (
    <div className={styles.badges}>
      {badges && (
        <div className={styles.wrapper}>
          {badges.slice(0, 3).map(({ text, color, background }) => (
            <span class={styles.badge} style={{ background, color }}>
              {text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};`;

const SNIPPETS_LIQUID = `<div class="badges">
  {% if badges %}
    <div class="wrapper">
      {% for item in badges limit: 3 %}
        {% assign text = item.text %}
        <span class="badge"
          style="background: {{ background | escape }}; color: {{ color | escape }};">
          {{ text | escape }}
        </span>
      {% endfor %}
    </div>
  {% endif %}
</div>`;

const REACT_TSX = `'use snippets' // HeaderUserOptions: snippet que consome a ilha
import { MiniCart } from '../../../components/MiniCart'

export const HeaderUserOptions = () => (
  <div className="icon-button-group">
    <MiniCart elementId="mini-cart" />
  </div>
);

// MiniCart/index.tsx
'use react'
export function MiniCart({ elementId }: { elementId: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    CartService.getCart().then((cart: any) => setCount(cart.item_count));
  }, []);
  return <button aria-label="Sacola">🛍 {count > 0 && <span>{count}</span>}</button>;
}`;

const REACT_LIQUID = `<!-- snippets/header-user-options.liquid (gerado) -->
<div class="icon-button-group">
  <react-island id="mini-cart" component="MiniCart">
    <script type="application/json" data-react-props>
      {"elementId": "mini-cart"}
    </script>
  </react-island>
</div>

{%- unless script_mini_cart_loaded -%}
  <script src="{{ 'mini-cart.js' | asset_url }}" defer></script>
  {%- assign script_mini_cart_loaded = true -%}
{%- endunless -%}
<!-- + assets/mini-cart.js (bundle esbuild) -->`;

const DOM_TSX = `// src/app/components/Menu/Desktop/index.tsx
// "use dom" vai na PRIMEIRA linha do corpo da função:

export const MenuDesktop = ({ options }) => {
  "use dom";
  document.addEventListener('click', (event) => {
    // fecha dropdowns abertos fora do clique
  });

  return (
    <>
      {options.map((link) =>
        link.links.length > 0 ? (
          <details className="nav-dropdown" data-menu-item>
            <summary>{link.title}</summary>
          </details>
        ) : (
          <a data-menu-item href={link.url}>{link.title}</a>
        )
      )}
    </>
  );
};`;

const DOM_LIQUID = `<!-- snippets/menu-desktop.liquid (gerado) -->
{% for link in options %}
  {% if link.links.size > 0 %}
    <details class="nav-dropdown" data-menu-item>
      <summary>{{ link.title | escape }}</summary>
    </details>
  {% else %}
    <a data-menu-item href="{{ link.url | escape }}">
      {{ link.title | escape }}
    </a>
  {% endif %}
{% endfor %}
<!-- + assets/menu-desktop.js (o bloco "use dom" acima) -->`;

const GLOBAL_TSX = `'use dom:global' // src/app/scripts/theme.ts

const translate = (key: string, fallback: string) => {
  const i18n = (window as any).LiquidifyTheme?.i18n;
  return i18n?.[key] || fallback;
};

export async function addItem(id: number, quantity: number) {
  const response = await fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, quantity }),
  });
  if (!response.ok) throw new Error(translate('theme_add_error', 'Could not add.'));
}`;

const GLOBAL_OUT = `// assets/theme.js (bundle global, sem saída .liquid)
// carregado uma vez no layout:
// <script src="{{ 'theme.js' | asset_url }}" defer></script>
// Escopo: carrinho Ajax, quick-add, drawer, toast, busca.`;

const SCRIPT_TSX = `'use script' // src/app/web-components/Accordion/index.ts

class MyAccordion extends HTMLElement {
  connectedCallback() {
    // comportamento do <my-accordion> (single/multiple)
  }
}
customElements.define('my-accordion', MyAccordion);`;

const SCRIPT_OUT = `// assets/accordion.js (somente JS, sem .liquid)
// Web Component puro: <my-accordion> usável em qualquer snippet.`;

const BLOCKS_TSX = `'use blocks'

export function PromoBenefits({ text }: { text: string }) {
  return (
    <div className="promo-benefits">
      <p>{'text | escape'}</p>
    </div>
  );
}`;

const BLOCKS_OUT = `<!-- blocks/promo-benefits.liquid (gerado) -->
<div class="promo-benefits">
  <p>{{ text | escape }}</p>
</div>
<!-- blocos são montados pelo lojista e renderizados
     onde a section chama {% content_for 'blocks' %} -->`;

const REACT_ID_TSX = `'use react(hero-root)' // monta num <div> próprio, não numa ilha

export function HeroApp() {
  return <div className="hero-app">{/* … */}</div>;
}

// --- no consumo, props especiais da ilha: ---
<MiniCart elementId="mini-cart" eager />`;

const REACT_ID_OUT = `<!-- com id na diretiva: ponto de montagem próprio -->
<div id="hero-root"></div>
<script src="{{ 'hero-app.js' | asset_url }}" defer></script>

<!-- props no consumo (ilha normal): -->
<react-island id="mini-cart" data-hydrate="eager" component="MiniCart">
  <script type="application/json" data-react-props>
    {"elementId": "mini-cart"}
  </script>
</react-island>
<!-- elementId vira id= da ilha (+ eco no JSON); eager hidrata sem esperar -->`;

const CONTEXT_TSX = `'use react'
'use context' // compartilha createContext entre bundles de ilhas

import { createContext } from 'preact/hooks';

export const ProductContext = createContext(null);

export function ProductProvider({ store, children }) {
  return <ProductContext.Provider value={store}>{children}</ProductContext.Provider>;
}`;

const CONTEXT_OUT = `// Cada ilha gera um bundle esbuild separado.
// Sem 'use context', dois bundles não enxergam o mesmo createContext.
// Com o marcador, o compilador aplica a ponte de contexto (bridge id)
// e ProductProvider / QuantitySelector falam entre si.
// (ver src/app/context/Product/index.tsx no template)`;

const SCHEMA_TSX = `// Todas estas formas geram o mesmo {% schema %}. Vale a última.
export const schema = { name: 'Hero', settings: [/* … */], presets: [/* … */] };

export { HeroSchema as schema };
export default { name: 'Hero', settings: [/* … */] };

// anexado ao componente (padrão do template example):
export default (Newsletter.schema = NEWSLETTER_SCHEMA);
// também vale: Component.schema = {...} · maiúsculo Schema ok
// re-export e import de outro arquivo resolvem; não-objeto = erro.`;

const CSS_TSX = `// CSS colocado vira {% stylesheet %} do artefato gerado:
import styles from './styles.css';
import './global-part.css'; // relativo ok
// .scss também vale; limite de 1MB por bloco.
// 'use dom:global' e 'use script' NÃO geram stylesheet:
// o CSS da ilha react é embutido no bundle assets/*.js.`;

const EQUIV_TSX = `{product.title}                    {'product.title | escape'}
{product.price | money}              // ERRO: filtro fora de string
{'product.price | money'}
{section.settings.heading ? 'section.settings.heading | escape' : "'hero.heading' | t"}
{badges && <div>…</div>}
{items.map((item) => <Card item={item} />)}
<RenderSnippet slot={Card} item={item} />
<img src="{{ product.featured_image | image_url: width: 700 }}" />
<a href={product.url}>                // prop = variável Liquid (sem filtro)`;

const EQUIV_LIQUID = `{{ product.title | escape }}      <!-- {x} sempre escapa -->
{{ product.price | money }}         <!-- filtro SEMPRE dentro de 'string' -->
{{ product.price | money }}
{% if section.settings.heading %}…{% else %}…{% endif %}
{% if badges %}<div>…</div>{% endif %}
{% for item in items %}…{% endfor %} <!-- .map vira for; .slice(0,3) vira limit: 3 -->
{% render 'card', item: item %}
<img src="{{ product.featured_image | image_url: width: 700 }}" />
<a href="{{ product.url }}">          <!-- href={x} vira href="{{ x }}" -->`;

type DirectiveDoc = {
  id: string;
  directive: string;
  generates: string;
  when: string;
  rule: string;
  tsxTitle: string;
  tsx: string;
  tsxLang: "tsx" | "plain";
  outTitle: string;
  out: string;
  outLang: "liquid" | "plain";
};

export default function Directives() {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";

  const docs: DirectiveDoc[] = [
    {
      id: "sections",
      directive: "'use sections'",
      generates: pt ? "sections/*.liquid + {% schema %} + {% stylesheet %}" : "sections/*.liquid + {% schema %} + {% stylesheet %}",
      when: pt
        ? "Conteúdo editável no Theme Editor (Hero, coleção, produto). Exporte schema + presets."
        : "Theme Editor-editable content (hero, collection, product). Export schema + presets.",
      rule: pt
        ? "Regra: leia section.settings / section.blocks; nunca use estado ou eventos aqui."
        : "Rule: read section.settings / section.blocks; never use state or events here.",
      tsxTitle: "Hero/index.tsx",
      tsx: SECTIONS_TSX,
      tsxLang: "tsx",
      outTitle: "sections/hero.liquid",
      out: SECTIONS_LIQUID,
      outLang: "liquid",
    },
    {
      id: "snippets",
      directive: "'use snippets'",
      generates: "snippets/*.liquid",
      when: pt ? "Markup reutilizável sem JS: badges, cards, menus, filtros." : "Reusable markup without JS: badges, cards, menus, filters.",
      rule: pt
        ? "Regra: props viram variáveis do {% render %}; {x} escapa; filtros sempre em 'string'."
        : "Rule: props become {% render %} variables; {x} escapes; filters always inside a 'string'.",
      tsxTitle: "Badges/index.tsx",
      tsx: SNIPPETS_TSX,
      tsxLang: "tsx",
      outTitle: "snippets/badges.liquid",
      out: SNIPPETS_LIQUID,
      outLang: "liquid",
    },
    {
      id: "react",
      directive: "'use react'",
      generates: pt ? "<react-island> + props JSON + assets/*.js" : "<react-island> + JSON props + assets/*.js",
      when: pt
        ? "Interatividade real: carrinho, variantes, quantidade, busca. O Liquid renderiza o shell; o Preact hidrata."
        : "Real interactivity: cart, variants, quantity, search. Liquid renders the shell; Preact hydrates.",
      rule: pt
        ? "Regra: a ilha recebe props via <script data-react-props>; dados Shopify entram por <liquid-data>."
        : "Rule: the island receives props via <script data-react-props>; Shopify data enters via <liquid-data>.",
      tsxTitle: "MiniCart (HeaderUserOptions + MiniCart)",
      tsx: REACT_TSX,
      tsxLang: "tsx",
      outTitle: "header-user-options.liquid + mini-cart.js",
      out: REACT_LIQUID,
      outLang: "liquid",
    },
    {
      id: "dom",
      directive: '"use dom"',
      generates: "snippets/*.liquid + assets/*.js",
      when: pt ? "Comportamento imperativo de UM componente, sem React (menu, drawer, slider)." : "Imperative behavior for ONE component, no React (menu, drawer, slider).",
      rule: pt
        ? 'Regra: escreva "use dom"; como primeira linha do corpo da função; o JS vira o bundle do componente.'
        : 'Rule: write "use dom"; as the first line of the function body; the JS becomes the component bundle.',
      tsxTitle: "Menu/Desktop/index.tsx",
      tsx: DOM_TSX,
      tsxLang: "tsx",
      outTitle: "menu-desktop.liquid + menu-desktop.js",
      out: DOM_LIQUID,
      outLang: "liquid",
    },
    {
      id: "global",
      directive: "'use dom:global'",
      generates: "assets/*.js",
      when: pt ? "Script global da loja: carrinho Ajax, quick-add, toast, busca." : "Store-wide script: Ajax cart, quick-add, toast, search.",
      rule: pt ? "Regra: sem saída .liquid; importe no layout uma única vez." : "Rule: no .liquid output; include in the layout once.",
      tsxTitle: "scripts/theme.ts",
      tsx: GLOBAL_TSX,
      tsxLang: "tsx",
      outTitle: "assets/theme.js",
      out: GLOBAL_OUT,
      outLang: "plain",
    },
    {
      id: "script",
      directive: "'use script'",
      generates: "assets/*.js",
      when: pt ? "JS puro isolado: Web Components, libs, polyfills." : "Isolated plain JS: Web Components, libs, polyfills.",
      rule: pt ? "Regra: somente bundle JS, sem Liquid — como 'use dom:global' mas para um arquivo." : "Rule: JS bundle only, no Liquid — like 'use dom:global' for one file.",
      tsxTitle: "web-components/Accordion/index.ts",
      tsx: SCRIPT_TSX,
      tsxLang: "tsx",
      outTitle: "assets/accordion.js",
      out: SCRIPT_OUT,
      outLang: "plain",
    },
    {
      id: "blocks",
      directive: "'use blocks'",
      generates: "blocks/*.liquid",
      when: pt ? "Terceiro valor do eixo tipo: blocos reutilizáveis que o lojista monta no Theme Editor." : "Third type-axis value: reusable blocks merchants assemble in Theme Editor.",
      rule: pt ? "Regra: o bloco sai em blocks/ e é renderizado onde a section chama {% content_for 'blocks' %} (primitivo DynamicBlock)." : "Rule: blocks emit to blocks/ and render where the section calls {% content_for 'blocks' %} (DynamicBlock primitive).",
      tsxTitle: "PromoBenefits/index.tsx",
      tsx: BLOCKS_TSX,
      tsxLang: "tsx",
      outTitle: "blocks/promo-benefits.liquid",
      out: BLOCKS_OUT,
      outLang: "liquid",
    },
    {
      id: "react-id",
      directive: "'use react(id)'",
      generates: pt ? "<div id> próprio em vez de <react-island>" : "own <div id> instead of <react-island>",
      when: pt ? "Quando a ilha precisa de um ponto de montagem fixo em vez de hidratar onde foi usada." : "When the island needs a fixed mount point instead of hydrating where used.",
      rule: pt ? "Regra: 'use react(hero-root)' (o # inicial é opcional) monta em <div id=\"hero-root\">. No consumo, elementId vira id= da ilha e eager hidrata sem esperar." : "Rule: 'use react(hero-root)' (leading # optional) mounts on <div id=\"hero-root\">. At usage, elementId becomes the island id and eager hydrates without waiting.",
      tsxTitle: "HeroApp + consumo com props",
      tsx: REACT_ID_TSX,
      tsxLang: "tsx",
      outTitle: "montagem + ilha com props",
      out: REACT_ID_OUT,
      outLang: "liquid",
    },
    {
      id: "context",
      directive: "'use context'",
      generates: pt ? "ponte de createContext entre bundles" : "createContext bridge across bundles",
      when: pt ? "Segunda diretiva no arquivo da ilha quando dois bundles precisam do mesmo contexto (ex. ProductProvider → QuantitySelector)." : "Second directive in the island file when two bundles need the same context (e.g. ProductProvider → QuantitySelector).",
      rule: pt ? "Regra: cada ilha é um bundle esbuild separado; sem o marcador, createContext não atravessa bundles." : "Rule: each island is a separate esbuild bundle; without the marker, createContext does not cross bundles.",
      tsxTitle: "context/Product/index.tsx",
      tsx: CONTEXT_TSX,
      tsxLang: "tsx",
      outTitle: "efeito no bundle",
      out: CONTEXT_OUT,
      outLang: "plain",
    },
  ];

  return (
    <section id="diretivas" className="wrap section directives-page">
      <p className="kicker">Compiler behavior</p>
      <h2>{pt ? "Diretivas: o que cada TSX vira" : "Directives: what each TSX becomes"}</h2>
      <p className="section-sub">
        {pt
          ? "A string literal no topo do arquivo decide o que o compilador gera. Eixo tipo (sections/snippets/blocks) = onde o Liquid sai; eixo modo (react/dom/script) = se sai JS junto; modificadores ('use react(id)', 'use context') ajustam a hidratação. Abaixo, cada um com exemplo real do template example."
          : "A string literal at the top of the file decides what the compiler emits. Type axis (sections/snippets/blocks) = where Liquid goes; mode axis (react/dom/script) = whether JS comes along; modifiers ('use react(id)', 'use context') tune hydration. Below, each with a real example from the example template."}
      </p>

      <div className="directive-list">
        {docs.map((doc) => (
          <article className="directive-card" key={doc.id} id={`diretiva-${doc.id}`}>
            <header className="directive-head">
              <code className="directive-name">{doc.directive}</code>
              <span className="directive-gen">→ {doc.generates}</span>
            </header>
            <p className="directive-when">{doc.when}</p>
            <p className="directive-rule">{doc.rule}</p>
            <div className="dir-cols">
              <Snippet title={`${doc.tsxTitle} (TSX)`} code={doc.tsx} language={doc.tsxLang} />
              <Snippet title={`${doc.outTitle} (${pt ? "gerado" : "generated"})`} code={doc.out} language={doc.outLang} />
            </div>
          </article>
        ))}
      </div>

      <article className="directive-card equiv-card" id="diretiva-schema-css">
        <header className="directive-head">
          <code className="directive-name">{pt ? "Schema e CSS: formas aceitas" : "Schema and CSS: accepted forms"}</code>
          <span className="directive-gen">
            → {pt ? "vale a última declaração de schema" : "last schema declaration wins"}
          </span>
        </header>
        <p className="directive-when">
          {pt
            ? "O schema pode ser exportado de várias formas e resolvido de outro arquivo (re-export vale). Não-objeto vira ValidationError. O CSS colocado/importado (inclusive .scss) vira {% stylesheet %} — exceto em dom:global/script, que só geram JS."
            : "Schema can be exported in several forms and resolved from another file (re-export counts). Non-objects become ValidationError. Colocated/imported CSS (including .scss) becomes {% stylesheet %} — except dom:global/script, which only emit JS."}
        </p>
        <div className="dir-cols">
          <Snippet title="schema (todas valem)" code={SCHEMA_TSX} language="tsx" />
          <Snippet title="CSS (o que vira stylesheet)" code={CSS_TSX} language="tsx" />
        </div>
      </article>

      <article className="directive-card equiv-card" id="diretiva-equivalencias">
        <header className="directive-head">
          <code className="directive-name">{pt ? "TSX → Liquid: equivalências" : "TSX → Liquid: equivalences"}</code>
          <span className="directive-gen">
            → {pt ? "leia lado a lado antes de escrever" : "read side by side before writing"}
          </span>
        </header>
        <p className="directive-when">
          {pt
            ? "O TSX é sintaxe tipada para Liquid: objetos Shopify (product, collection, cart, shop, routes, section) já estão no escopo. Filtros Liquid só sobrevivem dentro de strings."
            : "TSX is typed syntax for Liquid: Shopify objects (product, collection, cart, shop, routes, section) are already in scope. Liquid filters only survive inside strings."}
        </p>
        <div className="dir-cols">
          <Snippet title="TSX (o que você escreve)" code={EQUIV_TSX} language="tsx" />
          <Snippet title={pt ? "Liquid (o que sai)" : "Liquid (what comes out)"} code={EQUIV_LIQUID} language="liquid" />
        </div>
      </article>
    </section>
  );
}
