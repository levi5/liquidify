import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import styles from "./style.module.css";

const SECTION_EXAMPLE = `'use sections'

import { RenderSnippet } from 'liquidify'
import { Card } from '../../components/Card'

export const FeaturedProducts = () => (
  <section>
    <h2>{section.settings.heading ? 'section.settings.heading | escape' : "'featured.heading' | t"}</h2>
    {collections[section.settings.collection].products.map((item) => (
      <RenderSnippet slot={Card} item={item} />
    ))}
  </section>
)

export default (FeaturedProducts.schema = {
  name: 'Featured products',
  settings: [
    { type: 'text', id: 'heading', label: 'Heading' },
    { type: 'collection', id: 'collection', label: 'Collection' },
  ],
})`;

const ISLAND_EXAMPLE = `'use react'

export const QuantitySelector = ({ initialValue }) => {
  const [quantity, setQuantity] = useState(initialValue)
  return <button onClick={() => setQuantity(quantity + 1)}>{quantity}</button>
}

// Liquid parent serializes data once:
<liquid-data data-liquid-store="{{ product | json }}">
  <QuantitySelector initialValue={1} />
</liquid-data>`;

export default function AuthoringGuide() {
  const { locale } = useLocale();
  const copy = locale === "pt-BR"
    ? {
        title: "Escrevendo um tema em TSX", intro: "O código TSX descreve a marcação que o Shopify precisa renderizar. Pense nele como uma sintaxe tipada para Liquid: os objetos Shopify estão disponíveis no escopo, mas o resultado precisa continuar determinístico no servidor.",
        data: "Dados Shopify no escopo", dataText: "Sections e snippets recebem globais Liquid como product, collection, cart, shop, routes, request e section. Leia esses objetos diretamente. Quando precisar de um filtro Liquid, escreva a expressão como string para que ela seja preservada na saída.", dataRows: [["product", "Título, variantes, mídia, preço, descrição e structured_data."], ["collection", "Produtos, filtros, ordenação, descrição e paginação."], ["section", "settings, blocks e id da section atual."], ["shop / routes / request", "Políticas, URLs, locale, moeda e contexto da requisição."], ["cart", "Moeda e estado inicial que o layout passa para ilhas."]], headers: ["Global", "Use para"],
        section: "Sections, schemas e templates", sectionText: "Uma section começa com use sections e exporta um schema. O compilador gera a section Liquid e o bloco schema; o arquivo templates/*.json decide onde a section aparece e quais settings/blocos iniciam configurados.",
        snippet: "Snippets e composição", snippetText: "Use use snippets para partes reutilizáveis e RenderSnippet para incluí-las. Cards, filtros, breadcrumbs e selectores do example são snippets. Eles recebem props que se tornam variáveis no {% render %} gerado.",
        modes: "Escolha o modo certo", modesRows: [["use sections", "sections/*.liquid", "Conteúdo editável pelo Theme Editor."], ["use snippets", "snippets/*.liquid", "Markup reutilizável sem estado no browser."], ["use react", "assets/*.js + react-island", "Estado, eventos e Shopify Ajax API."], ["use dom", "assets/*.js", "Comportamento imperativo de um componente."], ["use dom:global", "assets/*.js", "Script global, como anúncios e quick add."]], modesHeaders: ["Diretiva", "Gera", "Use quando"],
        island: "Ilhas, dados e CSP", islandText: "Uma ilha não recebe o mundo inteiro do React. O Liquid renderiza HTML inicial e serializa apenas os dados necessários dentro de liquid-data. O runtime hidrata o componente no navegador, mantendo o tema compatível com CSP estrito.",
        styling: "CSS e assets", stylingItems: ["Importe o CSS ao lado do componente TSX. O compilador coleta esse CSS e o associa ao artefato gerado.", "Use assets Shopify com asset_url ou imagens do Admin com image_url; não use caminhos do Vite dentro do tema final.", "Mantenha tokens globais em assets/global.css e variáveis configuráveis em snippets/css-variables.liquid.", "Evite estilos dependentes de uma estrutura que uma ilha possa substituir depois da hidratação."],
        diagnostics: "Checklist quando algo não compilar", diagnosticsItems: ["Confirme a directive no topo do arquivo e o caminho componentsDir.", "Cheque se imports relativos apontam para arquivos existentes dentro da árvore observada.", "Verifique se expressões Liquid que usam filtros estão entre aspas, por exemplo 'product.price | money'.", "Rode npm run typecheck, npm run build e npm run check separadamente para isolar o tipo de erro.", "Abra .liquidify-manifest.json para relacionar uma fonte ao arquivo gerado, sem editar o manifest."]
      }
    : {
        title: "Writing a theme in TSX", intro: "TSX describes the markup Shopify needs to render. Treat it as typed syntax for Liquid: Shopify objects are available in scope, but output must remain deterministic on the server.",
        data: "Shopify data in scope", dataText: "Sections and snippets receive Liquid globals such as product, collection, cart, shop, routes, request, and section. Read those objects directly. When a Liquid filter is required, write the expression as a string so it remains in the output.", dataRows: [["product", "Title, variants, media, price, description, and structured_data."], ["collection", "Products, filters, sort order, description, and pagination."], ["section", "Settings, blocks, and the current section id."], ["shop / routes / request", "Policies, URLs, locale, currency, and request context."], ["cart", "Currency and initial state passed by layout to islands."]], headers: ["Global", "Use it for"],
        section: "Sections, schemas, and templates", sectionText: "A section starts with use sections and exports a schema. The compiler emits the Liquid section and schema block; templates/*.json chooses where the section appears and which settings/blocks are initially configured.",
        snippet: "Snippets and composition", snippetText: "Use use snippets for reusable pieces and RenderSnippet to include them. Cards, filters, breadcrumbs, and selectors in example are snippets. They receive props that become variables in generated {% render %} calls.",
        modes: "Choose the right mode", modesRows: [["use sections", "sections/*.liquid", "Content editable in Theme Editor."], ["use snippets", "snippets/*.liquid", "Reusable markup without browser state."], ["use react", "assets/*.js + react-island", "State, events, and Shopify Ajax API."], ["use dom", "assets/*.js", "Imperative behavior for one component."], ["use dom:global", "assets/*.js", "Global script, such as announcements and quick add."]], modesHeaders: ["Directive", "Generates", "Use when"],
        island: "Islands, data, and CSP", islandText: "An island does not receive a whole React world. Liquid renders initial HTML and serializes only required data inside liquid-data. The runtime hydrates the component in the browser while keeping the theme compatible with strict CSP.",
        styling: "CSS and assets", stylingItems: ["Import CSS beside the TSX component. The compiler collects that CSS and associates it with generated output.", "Use Shopify assets with asset_url or Admin images with image_url; do not use Vite paths in the final theme.", "Keep global tokens in assets/global.css and configurable variables in snippets/css-variables.liquid.", "Avoid styles that depend on a structure an island can replace after hydration."],
        diagnostics: "Checklist when something does not compile", diagnosticsItems: ["Confirm the directive at the top of the file and the componentsDir path.", "Check that relative imports point to existing files inside the watched tree.", "Verify that Liquid expressions using filters are quoted, for example 'product.price | money'.", "Run npm run typecheck, npm run build, and npm run check separately to isolate the error type.", "Open .liquidify-manifest.json to relate source to generated file, without editing the manifest."]
      };
  return <section className={`'wrap' 'section' styles.authoringGuide`}><h2>{copy.title}</h2><p className="section-sub">{copy.intro}</p><div className={styles.authoringData}><div><h3>{copy.data}</h3><p>{copy.dataText}</p></div><div className="table-wrap"><table className="table"><thead><tr>{copy.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{copy.dataRows.map((row) => <tr key={row[0]}><td><code>{row[0]}</code></td><td>{row[1]}</td></tr>)}</tbody></table></div></div><div className={styles.authoringCodeGrid}><div><h3>{copy.section}</h3><p>{copy.sectionText}</p><Snippet code={SECTION_EXAMPLE} language="tsx" /></div><div><h3>{copy.island}</h3><p>{copy.islandText}</p><Snippet code={ISLAND_EXAMPLE} language="tsx" /></div></div><div className={styles.authoringBottomGrid}><article><h3>{copy.snippet}</h3><p>{copy.snippetText}</p><div className="table-wrap"><table className="table"><thead><tr>{copy.modesHeaders.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{copy.modesRows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}><code>{cell}</code></td>)}</tr>)}</tbody></table></div></article><article><h3>{copy.styling}</h3><ul>{copy.stylingItems.map((item) => <li key={item}>{item}</li>)}</ul><h3>{copy.diagnostics}</h3><ol>{copy.diagnosticsItems.map((item) => <li key={item}>{item}</li>)}</ol></article></div></section>;
}
