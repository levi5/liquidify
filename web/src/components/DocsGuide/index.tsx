import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import "./style.css";

const CONFIG = `{
  "componentsDir": "src/app",
  "output": "."
}`;

const TRANSFORMATION = `// TSX authoring                 // Liquid output
{product.title}                   {{ product.title | escape }}
{section.settings.heading}        {{ section.settings.heading | escape }}
{items.map((item) => <Card />)}   {% for item in items %} ... {% endfor %}
{enabled && <Banner />}           {% if enabled %} ... {% endif %}

// Explicit Liquid expressions stay strings in TSX:
{'product.price | money'}         {{ product.price | money }}`;

export default function DocsGuide() {
  const { locale } = useLocale();
  const copy = locale === "pt-BR"
    ? {
        title: "Como pensar em um tema Liquidify", intro: "Liquidify não substitui o Shopify. Ele cria uma camada de autoria em TSX para sections, snippets e interações, enquanto o tema continua sendo uma estrutura Shopify convencional.",
        pipeline: "Pipeline de compilação", source: "Você edita", generated: "Liquidify gera", shopify: "Shopify mantém", sourceItems: ["sections e componentes em src/app", "schemas, settings e serviços", "CSS que pertence ao componente"], generatedItems: ["sections/*.liquid", "snippets/*.liquid", "assets/*.js para ilhas"], shopifyItems: ["layout, templates e config", "locales e assets de marca", "dados: product, collection, cart"],
        ownership: "Quem é dono de cada arquivo?", rows: [["src/app/sections", "Você", "Section Liquid + schema"], ["src/app/components", "Você", "Snippet ou bundle de ilha"], ["sections/ e snippets/", "Compiler", "Não editar manualmente"], ["templates/*.json", "Você", "Ordem e configuração de páginas"], ["layout/, config/, locales/", "Você", "Arquivos Shopify nativos"]], headers: ["Local", "Responsável", "Papel"],
        config: "Configuração mínima", configText: "componentsDir aponta para o código TSX. output indica a raiz do tema, onde a saída Liquid, snippets e bundles serão escritos.",
        semantics: "O que o compilador entende", transformation: "Transformações TSX para Liquid", semanticsItems: ["A diretiva no topo define o destino: use sections, use snippets, use react ou use dom.", "Expressões de dados Shopify são escapadas por padrão; use strings de expressão Liquid quando precisar de filtros como money ou t.", "Condições e map previsíveis viram if e for Liquid. O resultado é renderizado no servidor.", "Schemas anexados à section viram o bloco {% schema %} que o Theme Editor lê."],
        islands: "Quando criar uma ilha", islandText: "Uma ilha React é apropriada quando o navegador precisa manter estado ou chamar uma API: mini-cart, seletor de variantes, drawer, busca ou filtro mobile. Conteúdo, links, preço, SEO e formulários devem continuar em Liquid sempre que possível.",
        limits: "Limites importantes", limitItems: ["Liquidify compila componentes; ele não transforma uma SPA React em um tema Shopify.", "Dados do Shopify chegam pelo escopo Liquid. Não use fetch para dados que já existem em product, collection, cart, section ou shop.", "Arquivos gerados são descartáveis. Faça alterações em src/app, layout, templates, config, locales e assets rastreados.", "Teste sempre no Shopify CLI: o formato final é um tema Shopify, não uma página Vite."],
      }
    : {
        title: "How to think about a Liquidify theme", intro: "Liquidify does not replace Shopify. It adds a TSX authoring layer for sections, snippets, and interactions, while the theme remains a conventional Shopify structure.",
        pipeline: "Compilation pipeline", source: "You edit", generated: "Liquidify generates", shopify: "Shopify owns", sourceItems: ["sections and components in src/app", "schemas, settings, and services", "CSS that belongs to each component"], generatedItems: ["sections/*.liquid", "snippets/*.liquid", "assets/*.js for islands"], shopifyItems: ["layout, templates, and config", "locales and brand assets", "data: product, collection, cart"],
        ownership: "Who owns each file?", rows: [["src/app/sections", "You", "Liquid section + schema"], ["src/app/components", "You", "Snippet or island bundle"], ["sections/ and snippets/", "Compiler", "Do not edit manually"], ["templates/*.json", "You", "Page order and configuration"], ["layout/, config/, locales/", "You", "Native Shopify files"]], headers: ["Location", "Owner", "Role"],
        config: "Minimum configuration", configText: "componentsDir points to the TSX source. output is the theme root, where Liquid output, snippets, and bundles are written.",
        semantics: "What the compiler understands", transformation: "TSX to Liquid transformations", semanticsItems: ["The directive at the top defines the target: use sections, use snippets, use react, or use dom.", "Shopify data expressions are escaped by default; use Liquid-expression strings when filters such as money or t are required.", "Predictable conditions and map calls become Liquid if and for. The result is server-rendered.", "Schemas attached to a section become the {% schema %} block read by Theme Editor."],
        islands: "When to create an island", islandText: "A React island is appropriate when the browser must keep state or call an API: mini-cart, variant selector, drawer, search, or mobile filter. Content, links, price, SEO, and forms should remain Liquid whenever possible.",
        limits: "Important boundaries", limitItems: ["Liquidify compiles components; it does not turn a React SPA into a Shopify theme.", "Shopify data arrives through Liquid scope. Do not fetch data that already exists in product, collection, cart, section, or shop.", "Generated files are disposable. Make changes in tracked src/app, layout, templates, config, locales, and assets.", "Always test in Shopify CLI: the final format is a Shopify theme, not a Vite page."],
      };

  return (
    <section className="wrap section docs-guide">
      <h2>{copy.title}</h2>
      <p className="section-sub">{copy.intro}</p>
      <div className="pipeline">
        <h3>{copy.pipeline}</h3>
        <div className="pipeline-grid">
          <article><span>01</span><h4>{copy.source}</h4><ul>{copy.sourceItems.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article><span>02</span><h4>{copy.generated}</h4><ul>{copy.generatedItems.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article><span>03</span><h4>{copy.shopify}</h4><ul>{copy.shopifyItems.map((item) => <li key={item}>{item}</li>)}</ul></article>
        </div>
      </div>
      <div className="docs-guide-grid">
        <div>
          <h3>{copy.ownership}</h3>
          <div className="table-wrap"><table className="table"><thead><tr>{copy.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{copy.rows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>
        </div>
        <div className="config-card">
          <h3>{copy.config}</h3>
          <p>{copy.configText}</p>
          <Snippet code={CONFIG} language="json" />
        </div>
      </div>
      <div className="docs-deep-grid">
        <article className="docs-deep-card">
          <h3>{copy.semantics}</h3>
          <ul>{copy.semanticsItems.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <div>
          <Snippet title={copy.transformation} code={TRANSFORMATION} language="plain" />
        </div>
      </div>
      <div className="docs-deep-grid docs-deep-grid-bottom">
        <article className="docs-deep-card"><h3>{copy.islands}</h3><p>{copy.islandText}</p></article>
        <article className="docs-deep-card"><h3>{copy.limits}</h3><ul>{copy.limitItems.map((item) => <li key={item}>{item}</li>)}</ul></article>
      </div>
    </section>
  );
}
