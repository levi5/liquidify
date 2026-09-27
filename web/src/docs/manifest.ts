import type { Locale } from "../i18n.tsx";

export type T = { en: string; "pt-BR": string };

export function t(value: T, locale: Locale): string {
  return value[locale];
}

export type Chapter = {
  id: string;
  area: "docs" | "api";
  href: string;
  title: T;
  summary: T;
  sections: Section[];
  standalone?: boolean;
};

export type Section = {
  id: string;
  title: T;
  match?: string[];
  terms?: string[];
};

export const DOCS_CHAPTERS: Chapter[] = [
  {
    id: "start",
    area: "docs",
    href: "#/docs/start",
    title: { en: "Start here", "pt-BR": "Começar" },
    summary: {
      en: "Generate a runnable theme, understand the folders, and settle into a daily loop.",
      "pt-BR": "Gere um tema funcional, entenda as pastas e estabeleça o ciclo diário.",
    },
    sections: [
      { id: "prerequisites", title: { en: "Prerequisites", "pt-BR": "Pré-requisitos" }, terms: ["node", "shopify cli", "dev store", "requirements"] },
      { id: "install", title: { en: "Generate and run the theme", "pt-BR": "Gerar e rodar o tema" }, match: ["Start with a runnable theme", "Comece com um tema executível"], terms: ["npx", "init", "install", "preview", "store"] },
      { id: "folder", title: { en: "The folder before editing", "pt-BR": "A pasta antes de editar" }, terms: ["structure", "tree", "src/app", "layout", "templates"] },
      { id: "daily-loop", title: { en: "Daily workflow", "pt-BR": "Fluxo diário" }, match: ["Daily workflow", "Fluxo diário"], terms: ["watch", "dev", "typecheck", "theme check"] },
      { id: "checkpoint", title: { en: "First checkpoint", "pt-BR": "Primeiro checkpoint" }, terms: ["verify", "generated", "output"] },
    ],
  },
  {
    id: "theme-model",
    area: "docs",
    href: "#/docs/theme-model",
    title: { en: "Theme model", "pt-BR": "Modelo do tema" },
    summary: {
      en: "Who owns which file, what the compiler generates, and when to reach for an island.",
      "pt-BR": "Quem é dono de cada arquivo, o que o compilador gera e quando usar uma ilha.",
    },
    sections: [
      { id: "pipeline", title: { en: "Compilation pipeline", "pt-BR": "Pipeline de compilação" }, terms: ["build", "compile", "emit", "flow"] },
      { id: "ownership", title: { en: "Who owns each file?", "pt-BR": "Quem é dono de cada arquivo?" }, terms: ["ownership", "generated", "do not edit"] },
      { id: "min-config", title: { en: "Minimum configuration", "pt-BR": "Configuração mínima" }, terms: ["componentsDir", "output"] },
      { id: "transformations", title: { en: "What the compiler understands", "pt-BR": "O que o compilador entende" }, terms: ["escape", "if", "for", "schema", "stylesheet"] },
      { id: "when-island", title: { en: "When to create an island", "pt-BR": "Quando criar uma ilha" }, terms: ["react", "state", "cart", "drawer", "filter"] },
      { id: "boundaries", title: { en: "Important boundaries", "pt-BR": "Limites importantes" }, terms: ["not a spa", "seo", "limits"] },
    ],
  },
  {
    id: "authoring",
    area: "docs",
    href: "#/docs/authoring",
    title: { en: "Writing TSX", "pt-BR": "Escrever TSX" },
    summary: {
      en: "Directives, the full TSX-to-Liquid equivalence table, and the data you get for free.",
      "pt-BR": "Diretivas, a tabela completa de equivalências TSX→Liquid e os dados que vêm de graça.",
    },
    sections: [
      { id: "data-in-scope", title: { en: "Shopify data in scope", "pt-BR": "Dados Shopify no escopo" }, terms: ["product", "collection", "cart", "section", "shop", "globals"] },
      { id: "sections-and-schemas", title: { en: "Sections, schemas, and templates", "pt-BR": "Sections, schemas e templates" }, terms: ["use sections", "schema", "settings"] },
      { id: "islands-and-csp", title: { en: "Islands, data, and CSP", "pt-BR": "Ilhas, dados e CSP" }, terms: ["use react", "liquid-data", "strictCsp"] },
      { id: "snippets", title: { en: "Snippets and composition", "pt-BR": "Snippets e composição" }, terms: ["use snippets", "rendersnippet", "render"] },
      { id: "css-and-assets", title: { en: "CSS and assets", "pt-BR": "CSS e assets" }, terms: ["stylesheet", "import", "scss", "asset_url", "image_url"] },
      { id: "directives", title: { en: "Directives: what each one becomes", "pt-BR": "Diretivas: o que cada uma vira" }, match: ["Directives: what each TSX becomes", "Diretivas: o que cada TSX vira"], terms: ["use dom", "use dom:global", "use script", "use blocks", "use context"] },
      { id: "schema-forms", title: { en: "Schema: accepted forms", "pt-BR": "Schema: formas aceitas" }, terms: ["export const schema", "export default", "last wins"] },
      { id: "equivalences", title: { en: "TSX to Liquid equivalences", "pt-BR": "Equivalências TSX→Liquid" }, terms: ["map", "filter", "ternary", "and", "or", "coalesce", "slice"] },
      { id: "not-compiling", title: { en: "When something does not compile", "pt-BR": "Quando algo não compila" }, match: ["Checklist quando algo não compilar", "Checklist when something does not compile"], terms: ["debug", "checklist", "troubleshoot"] },
    ],
  },
  {
    id: "schema",
    area: "docs",
    href: "#/docs/schema",
    title: { en: "Schema reference", "pt-BR": "Referência de schema" },
    summary: {
      en: "Every setting type, presets, blocks, translations, and the merchant-facing rules.",
      "pt-BR": "Todos os tipos de setting, presets, blocks, traduções e as regras do lojista.",
    },
    sections: [
      { id: "settings", title: { en: "Setting types", "pt-BR": "Tipos de setting" }, terms: ["text", "richtext", "number", "range", "checkbox", "select", "color", "collection", "product", "image_picker", "url", "video", "text_reference", "font_picker"] },
      { id: "presets", title: { en: "Presets", "pt-BR": "Presets" }, terms: ["presets", "default", "sections"] },
      { id: "blocks", title: { en: "Block schemas", "pt-BR": "Schemas de block" }, terms: ["blocks", "content_for", "type", "limit", "DynamicBlock"] },
      { id: "translations", title: { en: "Translations and labels", "pt-BR": "Traduções e labels" }, terms: ["t:", "label", "translate", "locales", "pt-BR"] },
      { id: "limits", title: { en: "Limits and defaults", "pt-BR": "Limites e defaults" }, terms: ["max", "default", "id"] },
    ],
  },
  {
    id: "shopify",
    area: "docs",
    href: "#/docs/shopify",
    title: { en: "Shopify & editor", "pt-BR": "Shopify e editor" },
    summary: {
      en: "The Theme Editor, JSON templates, and what the merchant configures in Admin.",
      "pt-BR": "Theme Editor, templates JSON e o que o lojista configura no Admin.",
    },
    sections: [
      { id: "composition", title: { en: "Composition model", "pt-BR": "Modelo de composição" }, terms: ["layout", "theme.liquid", "content_for_layout", "templates"] },
      { id: "json-templates", title: { en: "JSON templates control the page", "pt-BR": "Templates JSON controlam a página" }, terms: ["index.json", "order", "sections", "blocks"] },
      { id: "theme-editor", title: { en: "Theme Editor", "pt-BR": "Theme Editor" }, terms: ["settings", "merchants", "blocks", "app"] },
      { id: "admin-data", title: { en: "Data you configure in Admin", "pt-BR": "Dados que você configura no Admin" }, terms: ["products", "collections", "menus", "filters", "policies", "languages"] },
    ],
  },
  {
    id: "runtime",
    area: "docs",
    href: "#/docs/runtime",
    title: { en: "Islands & runtime", "pt-BR": "Ilhas e runtime" },
    summary: {
      en: "The server-to-browser model: island lifecycle, the data bridge, CSP, cleanup.",
      "pt-BR": "O modelo servidor-navegador: ciclo da ilha, ponte de dados, CSP e cleanup.",
    },
    sections: [
      { id: "lifecycle", title: { en: "Island lifecycle", "pt-BR": "Ciclo de vida da ilha" }, terms: ["hydrate", "defer", "intersectionobserver", "rootmargin"] },
      { id: "event-pattern", title: { en: "Example event pattern", "pt-BR": "Padrão de eventos" }, terms: ["customerevent", "cart", "add-to-cart"] },
      { id: "bridge", title: { en: "Liquid to React bridge", "pt-BR": "Ponte Liquid para React" }, match: ["Liquid \u2192 React bridge", "Ponte Liquid \u2192 React"], terms: ["liquid-data", "data-liquid-store", "json"] },
      { id: "csp", title: { en: "CSP and safety", "pt-BR": "CSP e segurança" }, terms: ["strictcsp", "new function", "json script"] },
      { id: "cleanup", title: { en: "Cleanup and boundaries", "pt-BR": "Cleanup e limites" }, terms: ["useeffect", "listeners", "timers"] },
    ],
  },
  {
    id: "islands",
    area: "docs",
    href: "#/docs/islands",
    title: { en: "Advanced islands", "pt-BR": "Ilhas avançadas" },
    summary: {
      en: "Three interaction layers, the Theme Editor lifecycle, and typed data attributes.",
      "pt-BR": "Três camadas de interação, o ciclo no Theme Editor e atributos tipados.",
    },
    sections: [
      { id: "jsx-events", title: { en: "JSX events in the island", "pt-BR": "Eventos JSX na ilha" }, terms: ["onclick", "oninput", "onchange", "onsubmit"] },
      { id: "actions", title: { en: "Actions: Liquid HTML calling React", "pt-BR": "Actions: HTML do Liquid chamando React" }, terms: ["registerLiquidifyAction", "data-liquidify-on-click", "useLayoutEffect"] },
      { id: "native-listeners", title: { en: "Native listeners outside islands", "pt-BR": "Listeners nativos fora das ilhas" }, terms: ["delegation", "document", "closest"] },
      { id: "event-bus", title: { en: "Talking across islands", "pt-BR": "Conversa entre ilhas" }, terms: ["useLiquidifyEvent", "emitLiquidifyEvent", "LiquidifyEvents"] },
      { id: "editor-lifecycle", title: { en: "Theme Editor lifecycle", "pt-BR": "Ciclo no Theme Editor" }, terms: ["shopify:section:load", "shopify:section:unload", "100ms"] },
      { id: "typed-attrs", title: { en: "Types in data-liquid-*", "pt-BR": "Tipos em data-liquid-*" }, terms: ["data-liquid", "boolean", "array", "null", "merge"] },
    ],
  },
];

export const API_CHAPTERS: Chapter[] = [
  {
    id: "cli",
    area: "api",
    href: "#/api/cli",
    title: { en: "CLI", "pt-BR": "CLI" },
    summary: {
      en: "Every command, flag, exit behaviour, and the programmatic builder API.",
      "pt-BR": "Todo comando, flag, comportamento de saída e a API programática do builder.",
    },
    sections: [
      { id: "commands", title: { en: "Commands and flags", "pt-BR": "Comandos e flags" }, terms: ["--watch", "--force", "--config", "--quiet", "--no-banner", "--version", "--help", "-w", "-f", "-V", "-h"] },
      { id: "init", title: { en: "Safe initialization", "pt-BR": "Inicialização segura" }, terms: ["init", "template", "overwrite", "symlink"] },
      { id: "builder-api", title: { en: "Builder API", "pt-BR": "API do builder" }, match: ["Builder e eventos", "Builder and events"], terms: ["makeLiquidifyBuilder", "build", "dispose", "on"] },
      { id: "builder-events", title: { en: "Builder events", "pt-BR": "Eventos do builder" }, match: ["Eventos do builder", "Builder events"], terms: ["build:start", "build:end", "build:failed", "file:change", "error"] },
      { id: "builder-methods", title: { en: "Builder methods", "pt-BR": "Métodos do builder" }, match: ["Métodos do builder", "Builder methods"], terms: ["watch", "disposeSync", "EventEmitter"] },
      { id: "ci", title: { en: "Project scripts and CI", "pt-BR": "Scripts de projeto e CI" }, terms: ["npm scripts", "github actions", "pipeline"] },
    ],
  },
  {
    id: "config",
    area: "api",
    href: "#/api/config",
    title: { en: "Configuration", "pt-BR": "Configuração" },
    summary: {
      en: "The four config keys, discovery order, path resolution, and strictCsp.",
      "pt-BR": "As quatro chaves, ordem de descoberta, resolução de paths e o strictCsp.",
    },
    sections: [
      { id: "options", title: { en: "Options", "pt-BR": "Opções" }, terms: ["componentsDir", "output", "force", "react.strictCsp"] },
      { id: "discovery", title: { en: "Config discovery", "pt-BR": "Descoberta de config" }, terms: ["liquidify.config.json", ".liquidifyrc", "liquidx.config.json", "search order", "cwd"] },
      { id: "validation", title: { en: "Strict validation", "pt-BR": "Validação estrita" }, terms: ["unknown key", "did you mean", "non-empty", "boolean"] },
      { id: "paths", title: { en: "Choosing paths", "pt-BR": "Escolhendo paths" }, terms: ["relative", "cwd", "config folder", "theme root"] },
      { id: "strictcsp", title: { en: "About strictCsp", "pt-BR": "Sobre o strictCsp" }, terms: ["csp", "inline handlers", "new Function"] },
    ],
  },
  {
    id: "runtime",
    area: "api",
    href: "#/api/runtime",
    title: { en: "Runtime API", "pt-BR": "API de runtime" },
    summary: {
      en: "Every export of liquidify/runtime, every window global, and every event name.",
      "pt-BR": "Todos os exports de liquidify/runtime, todos os globais de window e todos os nomes de evento.",
    },
    sections: [
      { id: "module", title: { en: "Module exports", "pt-BR": "Exports do módulo" }, terms: ["registerLiquidifyAction", "registerLiquidIsland", "useLiquidifyEvent", "emitLiquidifyEvent", "LiquidifyEvents"] },
      { id: "actions", title: { en: "Action registry", "pt-BR": "Registro de actions" }, terms: ["data-liquidify-on", "unregister", "this", "currentTarget"] },
      { id: "bus", title: { en: "Event bus semantics", "pt-BR": "Semântica do event bus" }, terms: ["on", "off", "emit", "queue", "replay", "refcount"] },
      { id: "events", title: { en: "Every event name", "pt-BR": "Todos os nomes de evento" }, terms: ["liquidify:ready", "liquidx:ready", "shopify:section:load", "shopify:section:unload"] },
      { id: "dom-events", title: { en: "Supported DOM events", "pt-BR": "Eventos DOM suportados" }, terms: ["onclick", "onkeydown", "onpointerdown", "attribute list"] },
      { id: "globals", title: { en: "Window globals", "pt-BR": "Globais de window" }, terms: ["LiquidifyMount", "LiquidifyUnmount", "LiquidifyCanMount", "LiquidifyParseProps", "React", "ReactDOM"] },
      { id: "package", title: { en: "Package exports and bins", "pt-BR": "Exports do pacote e bins" }, terms: ["liquidify/runtime", "main", "types", "bin", "liquidx"] },
    ],
  },
  {
    id: "filters",
    area: "api",
    href: "#/api/filters",
    title: { en: "Filters & helpers", "pt-BR": "Filtros e helpers" },
    summary: {
      en: "Every filter the compiler recognises, plus the TSX helper that emits it.",
      "pt-BR": "Todo filtro que o compilador reconhece, e o helper TSX que o emite.",
    },
    sections: [
      { id: "string-rule", title: { en: "The one rule about filters", "pt-BR": "A única regra sobre filtros" }, terms: ["string", "pipe", "escape", "error"] },
      { id: "core", title: { en: "Core filters", "pt-BR": "Filtros core" }, terms: ["escape", "downcase", "upcase", "strip", "handleize", "markdownify", "truncate"] },
      { id: "collections", title: { en: "Collection filters", "pt-BR": "Filtros de coleção" }, terms: ["map", "sort", "uniq", "compact", "sum", "first", "last", "size", "where"] },
      { id: "money", title: { en: "Money and weight", "pt-BR": "Dinheiro e peso" }, terms: ["money", "money_with_currency", "weight_with_unit"] },
      { id: "shopify", title: { en: "Shopify globals", "pt-BR": "Globais Shopify" }, terms: ["asset_url", "image_url", "t", "date", "link_to", "default_errors"] },
      { id: "helpers", title: { en: "TSX helpers", "pt-BR": "Helpers TSX" }, terms: ["raw", "json", "t", "imageUrl", "defaultValue"] },
      { id: "strings", title: { en: "String-like methods", "pt-BR": "Métodos string-like" }, terms: ["toString", "toLowerCase", "join", "trim"] },
      { id: "classnames", title: { en: "classNames / clsx", "pt-BR": "classNames / clsx" }, terms: ["classnames", "clsx", "static folding", "css modules"] },
      { id: "operators", title: { en: "Operators", "pt-BR": "Operadores" }, terms: ["ternary", "and", "or", "coalesce", "nullish", "equality", "comparison"] },
    ],
  },
  {
    id: "tsx",
    area: "api",
    href: "#/api/tsx",
    title: { en: "TSX primitives", "pt-BR": "Primitivos TSX" },
    summary: {
      en: "The built-in components that become Liquid tags, with their exact props.",
      "pt-BR": "Os componentes embutidos que viram tags Liquid, com as props exatas.",
    },
    sections: [
      { id: "composition", title: { en: "Composition primitives", "pt-BR": "Primitivos de composição" }, terms: ["RenderSnippet", "RenderSvg", "DynamicBlock", "PaginateByLiquid", "FormBlock"] },
      { id: "logic", title: { en: "Liquid logic primitives", "pt-BR": "Primitivos de lógica Liquid" }, match: ["Liquid logic in TSX", "Lógica Liquid em TSX"], terms: ["Raw", "Fallback", "UnlessBlock", "CaptureBlock", "TablerowByLiquid", "StylesheetBlock", "JavascriptBlock"] },
      { id: "intrinsics", title: { en: "JSX intrinsics", "pt-BR": "Intrínsecos JSX" }, terms: ["react-island", "liquid-data", "product-provider", "eager", "elementId"] },
      { id: "forbidden", title: { en: "Forbidden in islands", "pt-BR": "Proibido em ilhas" }, terms: ["markdownify", "handleize", "money", "downcase", "upcase", "strip"] },
    ],
  },
  {
    id: "builder",
    area: "api",
    href: "#/api/builder",
    title: { en: "Builder API", "pt-BR": "API do builder" },
    summary: {
      en: "Embedding Liquidify in your own build: interface choice, events, methods, automation.",
      "pt-BR": "Embutindo o Liquidify no seu build: escolha de interface, eventos, métodos e automação.",
    },
    sections: [
      { id: "interface", title: { en: "Choose the right interface", "pt-BR": "Escolha a interface certa" }, terms: ["cli", "api", "when to use"] },
      { id: "lifecycle", title: { en: "Recommended lifecycle", "pt-BR": "Ciclo recomendado" }, terms: ["workflow", "watch", "ship"] },
      { id: "incremental", title: { en: "Incremental build", "pt-BR": "Build incremental" }, terms: ["cache", "dependency graph", "full rebuild"] },
      { id: "commands", title: { en: "Command reference", "pt-BR": "Referência de comandos" }, terms: ["liquidify init", "liquidify --watch", "aliases"] },
    ],
  },
  {
    id: "build",
    area: "api",
    href: "#/api/build",
    title: { en: "Build internals", "pt-BR": "Internos do build" },
    summary: {
      en: "Dependency tracking, the output manifest, import resolution, and diagnostics.",
      "pt-BR": "Rastreamento de dependências, manifest de saída, resolução de imports e diagnósticos.",
    },
    sections: [
      { id: "incremental", title: { en: "Incremental build", "pt-BR": "Build incremental" }, terms: ["imports", "exports", "dynamic import", "require", "scss", "watch"] },
      { id: "manifest", title: { en: "Manifest and cleanup", "pt-BR": "Manifest e limpeza" }, terms: [".liquidify-manifest.json", "sha256", "stale", "fence"] },
      { id: "imports", title: { en: "Import resolution", "pt-BR": "Resolução de imports" }, terms: ["tsconfig", "paths", "baseUrl", "extends", "reexport", "cycle"] },
      { id: "expressions", title: { en: "Expressions and diagnostics", "pt-BR": "Expressões e diagnósticos" }, terms: ["temporary", "find", "filePath", "line", "column", "reserved"] },
      { id: "output", title: { en: "Emitted output contract", "pt-BR": "Contrato de saída" }, terms: ["sections", "snippets", "blocks", "assets", "kebab-case", "global.css"] },
    ],
  },
  {
    id: "errors",
    area: "api",
    href: "#/api/errors",
    title: { en: "Errors & limits", "pt-BR": "Erros e limites" },
    summary: {
      en: "Every message the compiler emits, the hard constraints, and how to fix each one.",
      "pt-BR": "Cada mensagem que o compilador emite, os limites rígidos e como corrigir.",
    },
    sections: [
      { id: "unsupported", title: { en: "Unsupported syntax", "pt-BR": "Sintaxe não suportada" }, terms: ["spread", "namespaced", "liquid block", "style", "dynamic slot"] },
      { id: "primitive-attrs", title: { en: "Missing primitive attributes", "pt-BR": "Atributos obrigatórios ausentes" }, terms: ["UnlessBlock", "CaptureBlock", "TablerowByLiquid", "Raw", "RenderSnippet", "RenderSvg"] },
      { id: "loops", title: { en: "Loop and expression limits", "pt-BR": "Limites de loop e expressão" }, terms: [".map", ".filter", ".find", ".some", "clsx", "css module", "arithmetic"] },
      { id: "config-errors", title: { en: "Config and manifest errors", "pt-BR": "Erros de config e manifest" }, terms: ["invalid json", "unknown key", "manifest version", "output conflict", "reserved"] },
      { id: "naming", title: { en: "Naming rules", "pt-BR": "Regras de nome" }, terms: ["pascalToKebab", "safe filename", "conflict", "collision"] },
      { id: "limits", title: { en: "Hard limits", "pt-BR": "Limites rígidos" }, terms: ["1mb", "css", "transpile cache", "1000"] },
      { id: "runtime-console", title: { en: "Runtime console messages", "pt-BR": "Mensagens de console do runtime" }, terms: ["console.error", "unmount failed", "registration failed", "action requires"] },
    ],
  },
];

export const CHAPTERS: Chapter[] = [...DOCS_CHAPTERS, ...API_CHAPTERS];

export const ALL_ROUTES = [
  { href: "#/", title: { en: "Home", "pt-BR": "Home" } },
  ...CHAPTERS.map((c) => ({ href: c.href, title: c.title })),
  { href: "#/example", title: { en: "Example store", "pt-BR": "Loja de exemplo" } },
];

export function findChapter(href: string): Chapter | undefined {
  return CHAPTERS.find((chapter) => chapter.href === href);
}

export function findSection(permalink: string): { chapter: Chapter; section: Section } | undefined {
  const [route, anchor] = permalink.split("#").filter(Boolean);
  const chapter = CHAPTERS.find((c) => c.href.split("#")[1] === route);
  if (!chapter || !anchor) return undefined;
  const section = chapter.sections.find((s) => s.id === anchor);
  return section ? { chapter, section } : undefined;
}

export function chapterNeighbours(chapter: Chapter): { previous?: Chapter; next?: Chapter } {
  const list = chapter.area === "docs" ? DOCS_CHAPTERS : API_CHAPTERS;
  const index = list.findIndex((c) => c.id === chapter.id);
  return { previous: list[index - 1], next: list[index + 1] };
}
