import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import "./style.css";

const INSTALL = `npx liquidify init my-store --template example
cd my-store
npm install
npm run dev

# Second terminal: connect a Shopify development theme
npm run preview -- --store your-store.myshopify.com`;

const TREE = `my-store/
├── src/app/                 # Edit TSX and component CSS here
├── layout/theme.liquid      # Native Shopify page shell
├── templates/*.json         # Page composition and initial settings
├── config/                  # Theme Editor settings
├── locales/                 # Storefront and schema translations
├── assets/                  # Brand assets + generated browser bundles
├── liquidify.config.json    # Compiler source/output paths
└── sections/ snippets/      # Generated output: do not hand-edit`;

export default function GettingStarted() {
  const { locale } = useLocale();
  const copy = locale === "pt-BR" ? {
    title: "Comece com um tema executável", intro: "O caminho mais seguro é iniciar pelo template example. Ele já contém a estrutura Shopify, os componentes TSX e os scripts de qualidade usados pela documentação.", prerequisites: "Pré-requisitos", prerequisiteItems: ["Node 22 ou mais recente.", "Uma loja Shopify de development ou acesso a uma loja de teste.", "Shopify CLI autenticada para abrir a prévia do tema.", "Produtos, coleção all e menus configurados para ver o layout completo."], install: "1. Gere e rode o tema", structure: "2. Entenda a pasta antes de editar", workflow: "3. Fluxo diário", workflowItems: ["Edite arquivos em src/app e seus estilos adjacentes.", "Deixe npm run dev ativo para o Liquidify compilar mudanças.", "Mantenha shopify theme dev ativo para o navegador atualizar a development theme.", "Antes de enviar, execute typecheck, build e Theme Check."], checkpoint: "Checkpoint", checkpointText: "Depois de npm run dev, a raiz do tema deve ter sections, snippets e assets gerados. Se eles não aparecerem, confirme liquidify.config.json antes de alterar qualquer componente." } : {
    title: "Start with a runnable theme", intro: "The safest path is to start from the example template. It already contains Shopify structure, TSX components, and the quality scripts used throughout this documentation.", prerequisites: "Prerequisites", prerequisiteItems: ["Node 22 or newer.", "A Shopify development store or access to a test store.", "Authenticated Shopify CLI to open theme preview.", "Products, the all collection, and menus configured to see the complete layout."], install: "1. Generate and run the theme", structure: "2. Understand the folder before editing", workflow: "3. Daily workflow", workflowItems: ["Edit files in src/app and adjacent styles.", "Keep npm run dev active for Liquidify to compile changes.", "Keep shopify theme dev active for the browser to refresh the development theme.", "Before shipping, run typecheck, build, and Theme Check."], checkpoint: "Checkpoint", checkpointText: "After npm run dev, the theme root should contain generated sections, snippets, and assets. If they do not appear, confirm liquidify.config.json before changing any component." };
  return <section className="wrap section reference-page"><h2>{copy.title}</h2><p className="section-sub">{copy.intro}</p><div className="reference-grid"><article><h3>{copy.prerequisites}</h3><ul>{copy.prerequisiteItems.map((item) => <li key={item}>{item}</li>)}</ul></article><div><Snippet title={copy.install} code={INSTALL} language="plain" /></div></div><div className="reference-grid"><div><Snippet title={copy.structure} code={TREE} language="plain" /></div><article><h3>{copy.workflow}</h3><ol>{copy.workflowItems.map((item) => <li key={item}>{item}</li>)}</ol></article></div><div className="reference-callout"><strong>{copy.checkpoint}</strong><p>{copy.checkpointText}</p></div></section>;
}
