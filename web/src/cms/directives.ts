export const SECTIONS_TSX = `'use sections'

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

export const SECTIONS_LIQUID = `<section class="fashion-hero container">
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

export const SNIPPETS_TSX = `'use snippets'

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

export const SNIPPETS_LIQUID = `<div class="badges">
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

export const REACT_TSX = `'use snippets' // HeaderUserOptions: snippet que consome a ilha
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

export const REACT_LIQUID = `<!-- snippets/header-user-options.liquid (gerado) -->
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

export const DOM_TSX = `// src/app/components/Menu/Desktop/index.tsx
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

export const DOM_LIQUID = `<!-- snippets/menu-desktop.liquid (gerado) -->
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

export const GLOBAL_TSX = `'use dom:global' // src/app/scripts/theme.ts

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

export const GLOBAL_OUT = `// assets/theme.js (bundle global, sem saída .liquid)
// carregado uma vez no layout:
// <script src="{{ 'theme.js' | asset_url }}" defer></script>
// Escopo: carrinho Ajax, quick-add, drawer, toast, busca.`;

export const SCRIPT_TSX = `'use script' // src/app/web-components/Accordion/index.ts

class MyAccordion extends HTMLElement {
  connectedCallback() {
    // comportamento do <my-accordion> (single/multiple)
  }
}
customElements.define('my-accordion', MyAccordion);`;

export const SCRIPT_OUT = `// assets/accordion.js (somente JS, sem .liquid)
// Web Component puro: <my-accordion> usável em qualquer snippet.`;

export const BLOCKS_TSX = `'use blocks'

export function PromoBenefits({ text }: { text: string }) {
  return (
    <div className="promo-benefits">
      <p>{'text | escape'}</p>
    </div>
  );
}`;

export const BLOCKS_OUT = `<!-- blocks/promo-benefits.liquid (gerado) -->
<div class="promo-benefits">
  <p>{{ text | escape }}</p>
</div>
<!-- blocos são montados pelo lojista e renderizados
     onde a section chama {% content_for 'blocks' %} -->`;

export const REACT_ID_TSX = `'use react(hero-root)' // monta num <div> próprio, não numa ilha

export function HeroApp() {
  return <div className="hero-app">{/* … */}</div>;
}

// --- no consumo, props especiais da ilha: ---
<MiniCart elementId="mini-cart" eager />`;

export const REACT_ID_OUT = `<!-- com id na diretiva: ponto de montagem próprio -->
<div id="hero-root"></div>
<script src="{{ 'hero-app.js' | asset_url }}" defer></script>

<!-- props no consumo (ilha normal): -->
<react-island id="mini-cart" data-hydrate="eager" component="MiniCart">
  <script type="application/json" data-react-props>
    {"elementId": "mini-cart"}
  </script>
</react-island>
<!-- elementId vira id= da ilha (+ eco no JSON); eager hidrata sem esperar -->`;

export const CONTEXT_TSX = `'use react'
'use context' // compartilha createContext entre bundles de ilhas

import { createContext } from 'preact/hooks';

export const ProductContext = createContext(null);

export function ProductProvider({ store, children }) {
  return <ProductContext.Provider value={store}>{children}</ProductContext.Provider>;
}`;

export const CONTEXT_OUT = `// Cada ilha gera um bundle esbuild separado.
// Sem 'use context', dois bundles não enxergam o mesmo createContext.
// Com o marcador, o compilador aplica a ponte de contexto (bridge id)
// e ProductProvider / QuantitySelector falam entre si.
// (ver src/app/context/Product/index.tsx no template)`;

export const SCHEMA_TSX = `// Todas estas formas geram o mesmo {% schema %}. Vale a última.
export const schema = { name: 'Hero', settings: [/* … */], presets: [/* … */] };

export { HeroSchema as schema };
export default { name: 'Hero', settings: [/* … */] };

// anexado ao componente (padrão do template example):
export default (Newsletter.schema = NEWSLETTER_SCHEMA);
// também vale: Component.schema = {...} · maiúsculo Schema ok
// re-export e import de outro arquivo resolvem; não-objeto = erro.`;

export const CSS_TSX = `// CSS colocado vira {% stylesheet %} do artefato gerado:
import styles from './styles.css';
import './global-part.css'; // relativo ok
// .scss também vale; limite de 1MB por bloco.
// 'use dom:global' e 'use script' NÃO geram stylesheet:
// o CSS da ilha react é embutido no bundle assets/*.js.`;

export const EQUIV_TSX = `{product.title}                    {'product.title | escape'}
{product.price | money}              // ERRO: filtro fora de string
{'product.price | money'}
{section.settings.heading ? 'section.settings.heading | escape' : "'hero.heading' | t"}
{badges && <div>…</div>}
{items.map((item) => <Card item={item} />)}
<RenderSnippet slot={Card} item={item} />
<img src="{{ product.featured_image | image_url: width: 700 }}" />
<a href={product.url}>                // prop = variável Liquid (sem filtro)`;

export const EQUIV_LIQUID = `{{ product.title | escape }}      <!-- {x} sempre escapa -->
{{ product.price | money }}         <!-- filtro SEMPRE dentro de 'string' -->
{{ product.price | money }}
{% if section.settings.heading %}…{% else %}…{% endif %}
{% if badges %}<div>…</div>{% endif %}
{% for item in items %}…{% endfor %} <!-- .map vira for; .slice(0,3) vira limit: 3 -->
{% render 'card', item: item %}
<img src="{{ product.featured_image | image_url: width: 700 }}" />
<a href="{{ product.url }}">          <!-- href={x} vira href="{{ x }}" -->`;

export const VALIDATION_ERROR_TSX = `'use sections'

// ERRO: React code is not allowed in "sections".
// Use 'use dom' for plain JavaScript or keep it as pure Liquid.
export function Hero() {
  const [state, setState] = useState(null) // ❌
  return <div>{state}</div>
}`;

export const VALIDATION_OK_TSX = `'use sections'
'use dom'

// CORRETO: JS puro com use dom
export function Hero() {
  const button = document.querySelector('.btn')
  button?.addEventListener('click', () => {
    console.log('clicked')
  })
  return <div>Static content</div>
}`;
