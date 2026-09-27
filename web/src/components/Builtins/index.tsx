import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import "./style.css";

const IMPORT = `import {
  DynamicBlock,
  RenderSnippet,
  RenderSvg,
  PaginateByLiquid,
  FormBlock,
} from 'liquidify'`;

const IMPORT_LOGIC = `import {
  Raw,
  Fallback,
  UnlessBlock,
  CaptureBlock,
  TablerowByLiquid,
  StylesheetBlock,
  JavascriptBlock,
} from 'liquidify'`;

const IMPORT_RUNTIME = `import {
  registerLiquidifyAction,
  registerLiquidIsland,
  useLiquidifyEvent,
  emitLiquidifyEvent,
  LiquidifyEvents,
} from 'liquidify/runtime'`;

const RENDER_TSX = `<RenderSnippet slot={Card} item={item} />
<RenderSnippet key={item.id} slot={Card} item={item} />`;

const RENDER_LIQUID = `{% render 'card', item: item %}
{% render 'card', key: item.id, item: item %}`;

const RAW_ONLY_TSX = `<Raw html={product.description} />`;
const RAW_ONLY_LIQUID = `{{ product.description }}`;

const FALLBACK_ONLY_TSX = `<Fallback of={section.settings.heading} fallback={"'hero.heading' | t"} />
<Fallback of={title} only="blank" fallback="Sem título" />
<Fallback of={count} fallback={0} allowFalse />`;
const FALLBACK_ONLY_LIQUID = `{{ section.settings.heading | default: 'hero.heading' | t }}
{% if title != blank %}{{ title }}{% else %}Sem título{% endif %}
{{ count | default: 0, allow_false: true }}`;

const UNLESS_ONLY_TSX = `<UnlessBlock condition={product.available}>
  <span>Esgotado</span>
</UnlessBlock>`;
const UNLESS_ONLY_LIQUID = `{% unless product.available %}
  <span>Esgotado</span>
{% endunless %}`;

const CAPTURE_ONLY_TSX = `<CaptureBlock as="header_html">
  <h1>{'shop.name | escape'}</h1>
</CaptureBlock>`;
const CAPTURE_ONLY_LIQUID = `{% capture header_html %}
  <h1>{{ shop.name | escape }}</h1>
{% endcapture %}`;

const TABLEROW_ONLY_TSX = `<TablerowByLiquid collection={products} cols={3}>
  <span>{'item.title | escape'}</span>
</TablerowByLiquid>`;
const TABLEROW_ONLY_LIQUID = `{% tablerow item in products cols: 3 %}
  <span>{{ item.title | escape }}</span>
{% endtablerow %}`;

const STYLEJS_TSX = `<StylesheetBlock>
  {'.promo { color: red; }'}
</StylesheetBlock>
<JavascriptBlock>
  {'console.log(shop.name)'}
</JavascriptBlock>`;

const STYLEJS_LIQUID = `{% stylesheet %}
  .promo { color: red; }
{% endstylesheet %}
{% javascript %}
  console.log(shop.name)
{% endjavascript %}`;

const RUNTIME_TSX = `// ponte Liquid → JS sem violar CSP estrito:
registerLiquidifyAction('add-to-cart', function (event) {
  // this = elemento; cleanup no retorno
  return () => {};
});

useLiquidifyEvent('cart:updated', (cart) => setCount(cart.item_count));
emitLiquidifyEvent('cart:updated', cart);`;

const RUNTIME_OUT = `// data-liquidify-on-click="add-to-cart" no Liquid chama a action.
// LiquidifyEvents.on/off = barramento manual; registerLiquidIsland
// registra ilhas fora do pipeline (uso avançado).
// Detalhes no capítulo Ilhas avançadas.`;

const SVG_TSX = `<RenderSvg name='delivery.svg' />`;

const SVG_LIQUID = `{{ 'delivery.svg' | inline_asset_content }}`;

const PAGINATE_TSX = `<PaginateByLiquid by={by} collection={collection.products}>
  {collection.products.length > 0 ? (
    <div className="product-grid">
      {collection.products.map((item: any) => (
        <RenderSnippet key={item.id} slot={Card} item={item} />
      ))}
    </div>
  ) : (
    <BaseEmptyState />
  )}
</PaginateByLiquid>`;

const PAGINATE_LIQUID = `{% paginate collection.products by by %}
  {% if collection.products.size > 0 %}
    <div class="product-grid">
      {% for item in collection.products %}
        {% render 'card', key: item.id, item: item %}
      {% endfor %}
    </div>
  {% else %}
    {% render 'base-empty-state' %}
  {% endif %}
{% endpaginate %}`;

const FORM_TSX = `<FormBlock name='customer' id='FooterNewsletter'>
  <input type='hidden' name='contact[tags]' value='newsletter' />
  <input type='email' name='contact[email]' required />
  <button type='submit'>↗</button>
</FormBlock>`;

const FORM_LIQUID = `{% form 'customer', id: 'FooterNewsletter' %}
  <input type="hidden" name="contact[tags]" value="newsletter" />
  <input type="email" name="contact[email]" required />
  <button type="submit">↗</button>
  {% if form.errors %}{{ form.errors | default_errors }}{% endif %}
{% endform %}`;

const BLOCK_TSX = `// dentro de uma section com blocos:
{blocks?.map((block) => (
  block.type === 'variation' && (
    <RenderSnippet slot={Selector} options={product.options_with_values} />
  )
))}
// ou o primitivo direto:
<DynamicBlock />`;

const BLOCK_LIQUID = `{% content_for 'blocks' %}
<!-- o lojista monta os blocos no Theme Editor;
     cada block.type vira um {% render %} do snippet -->`;

const INTRINSICS = `import { registerLiquidIsland } from 'liquidify/runtime';

// JSX intrinsics disponíveis dentro de uma ilha:
<react-island name="CartDrawer" />
<liquid-data data={products} />
<product-provider>
  <ProductForm />
</product-provider>

// use react(id) faz a ilha usar o próprio <div id>
<div id="cart-drawer" data-hydrate="eager" />`;

const FORBIDDEN = `const FORBIDDEN_REACT_FILTERS = new Set([
  'markdownify',
  'handleize',
  'downcase',
  'upcase',
  'strip',
  'strip_html',
  'money',
  'money_without_currency',
])`;

export default function Builtins({ islands = false }: { islands?: boolean } = {}) {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const copy = pt
    ? {
        title: "Componentes nativos: TSX que vira Liquid",
        intro: "Importe de liquidify e use Liquid nativo dentro do TSX. Cada primitivo abaixo com exemplo real do template example.",
        cards: [
          ["RenderSnippet", "Composição: snippet dentro de snippet/section", "Props viram variáveis do {% render %}. É assim que Card, Shelf e Filtros se combinam."],
          ["RenderSvg", "Ícone inline sem request extra", "O SVG do assets vira inline_asset_content — sem <img>, sem fetch."],
          ["PaginateByLiquid", "Paginação real da coleção/busca", "O .map vira {% for %}, o ternário vira {% if %}, tudo dentro de {% paginate %}."],
          ["FormBlock", "Formulários Shopify (newsletter, contato)", "Vira {% form %} com erros e sucesso tratados; campos contact[...] preservados."],
          ["DynamicBlock", "Blocos do Theme Editor", "Vira {% content_for 'blocks' %}: o lojista arrasta blocos que renderizam seus snippets."],
        ],
        compositionTitle: "Primitivos de composição",
        logicTitle: "Lógica Liquid em TSX",
        logicIntro: "Saída crua, fallbacks, unless, capture, tablerow e blocos literais — para o que escapa do JSX comum.",
        cards2: [
          ["Raw", "Saída sem escape", "Passa HTML/Liquid cru (ex. product.description). É o que ProductInfo usa no accordion."],
          ["Fallback", "Valor ou plano B", "of + fallback viram | default:. only='nil'/'blank' e allowFalse refinam a condição."],
          ["UnlessBlock", "O if invertido", "condition vira {% unless %}. Exige a prop condition."],
          ["CaptureBlock", "Guarda markup numa variável", "as='nome' vira {% capture nome %}."],
          ["TablerowByLiquid", "Tabela de coleção", "collection + cols viram {% tablerow item in ... %}; a variável do loop é item."],
          ["StylesheetBlock · JavascriptBlock", "Blocos literais", "Emitem {% stylesheet %} / {% javascript %} com o conteúdo filho."],
        ],
        runtimeTitle: "Runtime no navegador",
        intrinsicsTitle: "Intrínsecos JSX",
        intrinsicsIntro: "Dentro de uma ilha React, estes nomes não são tags HTML: são o host da ilha, a serialização de dados Liquid e o provider do template.",
        forbiddenTitle: "Proibido em ilhas",
        forbiddenIntro: "Estes filtros transformam texto com a gramática do Liquid e não existem em JavaScript, então usá-los dentro de uma ilha é erro de build, não fallback silencioso.",
        runtimeIntro: "De liquidify/runtime: ponte Liquid → JS sem violar CSP estrito, barramento de eventos e registro de ilhas.",
        runtimeCards: [
          ["registerLiquidifyAction", "Liga data-liquidify-on-* à função; retorna cleanup."],
          ["registerLiquidIsland", "Registra ilha fora do pipeline (uso avançado)."],
          ["useLiquidifyEvent · emitLiquidifyEvent", "Assina e dispara eventos entre ilhas."],
          ["LiquidifyEvents", "Barramento manual (on/off) quando hook não basta."],
        ],
      }
    : {
        title: "Built-in components: TSX that becomes Liquid",
        intro: "Import from liquidify and use native Liquid inside TSX. Each primitive below with a real example from the example template.",
        cards: [
          ["RenderSnippet", "Composition: snippet inside snippet/section", "Props become {% render %} variables. This is how Card, Shelf, and Filters combine."],
          ["RenderSvg", "Inline icon with no extra request", "The asset SVG becomes inline_asset_content — no <img>, no fetch."],
          ["PaginateByLiquid", "Real collection/search pagination", ".map becomes {% for %}, the ternary becomes {% if %}, all inside {% paginate %}."],
          ["FormBlock", "Shopify forms (newsletter, contact)", "Becomes {% form %} with errors and success handled; contact[...] fields preserved."],
          ["DynamicBlock", "Theme Editor blocks", "Becomes {% content_for 'blocks' %}: merchants drag blocks that render your snippets."],
        ],
        compositionTitle: "Composition primitives",
        logicTitle: "Liquid logic in TSX",
        logicIntro: "Raw output, fallbacks, unless, capture, tablerow, and literal blocks — for what escapes common JSX.",
        cards2: [
          ["Raw", "Unescaped output", "Passes raw HTML/Liquid through (e.g. product.description). What ProductInfo uses in the accordion."],
          ["Fallback", "Value or plan B", "of + fallback become | default:. only='nil'/'blank' and allowFalse refine the condition."],
          ["UnlessBlock", "The inverted if", "condition becomes {% unless %}. Requires the condition prop."],
          ["CaptureBlock", "Stores markup in a variable", "as='name' becomes {% capture name %}."],
          ["TablerowByLiquid", "Collection table", "collection + cols become {% tablerow item in ... %}; the loop variable is item."],
          ["StylesheetBlock · JavascriptBlock", "Literal blocks", "Emit {% stylesheet %} / {% javascript %} with the child content."],
        ],
        runtimeTitle: "Browser runtime",
        intrinsicsTitle: "JSX intrinsics",
        intrinsicsIntro: "Inside a React island these names are not HTML tags: they are the island host, the Liquid data serialisation, and the template provider.",
        forbiddenTitle: "Forbidden in islands",
        forbiddenIntro: "These filters transform text with Liquid grammar and do not exist in JavaScript, so using one inside an island is a build error rather than a silent fallback.",
        runtimeIntro: "From liquidify/runtime: Liquid → JS bridge without breaking strict CSP, event bus, and island registration.",
        runtimeCards: [
          ["registerLiquidifyAction", "Binds data-liquidify-on-* to a function; returns cleanup."],
          ["registerLiquidIsland", "Registers islands outside the pipeline (advanced)."],
          ["useLiquidifyEvent · emitLiquidifyEvent", "Subscribes and emits events across islands."],
          ["LiquidifyEvents", "Manual bus (on/off) when a hook is not enough."],
        ],
      };
  const examples = [
    { tsx: RENDER_TSX, liquid: RENDER_LIQUID },
    { tsx: SVG_TSX, liquid: SVG_LIQUID },
    { tsx: PAGINATE_TSX, liquid: PAGINATE_LIQUID },
    { tsx: FORM_TSX, liquid: FORM_LIQUID },
    { tsx: BLOCK_TSX, liquid: BLOCK_LIQUID },
  ];
  const examples2 = [
    { tsx: RAW_ONLY_TSX, liquid: RAW_ONLY_LIQUID },
    { tsx: FALLBACK_ONLY_TSX, liquid: FALLBACK_ONLY_LIQUID },
    { tsx: UNLESS_ONLY_TSX, liquid: UNLESS_ONLY_LIQUID },
    { tsx: CAPTURE_ONLY_TSX, liquid: CAPTURE_ONLY_LIQUID },
    { tsx: TABLEROW_ONLY_TSX, liquid: TABLEROW_ONLY_LIQUID },
    { tsx: STYLEJS_TSX, liquid: STYLEJS_LIQUID },
  ];

  return (
    <section id="componentes" className="wrap section builtins-page">
      <p className="kicker">Native Liquid, typed TSX</p>
      <h2>{copy.title}</h2>
      <p className="section-sub">
        {copy.intro} <code>liquidify</code>.
      </p>
      <Snippet code={IMPORT} language="tsx" />
      <h3 id="composition" className="builtin-section-title">{copy.compositionTitle}</h3>
      <div className="builtin-list">
        {copy.cards.map(([name, subtitle, text], i) => (
          <article className="builtin-card" key={name} id={`primitivo-${name}`}>
            <header className="builtin-head">
              <code className="builtin-name">{name}</code>
              <span className="builtin-sub">{subtitle}</span>
            </header>
            <p className="builtin-text">{text}</p>
            <div className="dir-cols">
              <Snippet title={`${name} (TSX)`} code={examples[i].tsx} language="tsx" />
              <Snippet title={`${name} (${pt ? "Liquid gerado" : "generated Liquid"})`} code={examples[i].liquid} language="liquid" />
            </div>
          </article>
        ))}
      </div>

      <h2 className="builtin-section-title" id="logic">{copy.logicTitle}</h2>
      <p className="section-sub">{copy.logicIntro}</p>
      <Snippet code={IMPORT_LOGIC} language="tsx" />
      <div className="builtin-list">
        {copy.cards2.map(([name, subtitle, text], i) => (
          <article className="builtin-card" key={name} id={`primitivo-${name}`}>
            <header className="builtin-head">
              <code className="builtin-name">{name}</code>
              <span className="builtin-sub">{subtitle}</span>
            </header>
            <p className="builtin-text">{text}</p>
            <div className="dir-cols">
              <Snippet title={`${name} (TSX)`} code={examples2[i].tsx} language="tsx" />
              <Snippet title={`${name} (${pt ? "Liquid gerado" : "generated Liquid"})`} code={examples2[i].liquid} language="liquid" />
            </div>
          </article>
        ))}
      </div>

      <h2 className="builtin-section-title">{copy.runtimeTitle}</h2>
      <p className="section-sub">{copy.runtimeIntro}</p>
      <Snippet code={IMPORT_RUNTIME} language="tsx" />
      <div className="builtin-list">
        <article className="builtin-card">
          <div className="dir-cols">
            <Snippet title="runtime (TS)" code={RUNTIME_TSX} language="tsx" />
            <Snippet title={pt ? "como se conecta" : "how it connects"} code={RUNTIME_OUT} language="plain" />
          </div>
        </article>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>API</th>
              <th>{pt ? "Papel" : "Role"}</th>
            </tr>
          </thead>
          <tbody>
            {copy.runtimeCards.map(([name, text]) => (
              <tr key={name}>
                <td><code>{name}</code></td>
                <td>{text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {islands && (
        <>
          <h2 className="builtin-section-title" id="intrinsics">{copy.intrinsicsTitle}</h2>
          <p className="section-sub">{copy.intrinsicsIntro}</p>
          <Snippet code={INTRINSICS} language="tsx" />

          <h2 className="builtin-section-title" id="forbidden">{copy.forbiddenTitle}</h2>
          <p className="section-sub">{copy.forbiddenIntro}</p>
          <Snippet code={FORBIDDEN} language="tsx" />
        </>
      )}
    </section>
  );
}
