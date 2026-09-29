import type { Locale } from "../i18n.tsx";

export const STORE_SETUP: Record<Locale, string> = {
  "pt-BR": `npx liquidify init minha-loja --template example
cd minha-loja
npm install
npm run dev

# segundo terminal: prévia na development store
npm run preview -- --store sua-loja.myshopify.com`,
  en: `npx liquidify init my-store --template example
cd my-store
npm install
npm run dev

# second terminal: preview on the development store
npm run preview -- --store your-store.myshopify.com`,
};

export type StoreBlock = {
  kicker: string;
  title: string;
  text: string;
};

export type StoreCopy = {
  title: string;
  intro: string;
  setupTitle: string;
  blocks: StoreBlock[];
  checklistTitle: string;
  checklist: string[];
};

export const STORE_COPY: Record<Locale, StoreCopy> = {
  "pt-BR": {
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
  },
  en: {
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
  },
};
