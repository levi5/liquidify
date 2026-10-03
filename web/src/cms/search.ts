import type { Locale } from "../i18n.tsx";
import type { NameGroup } from "../docs/search-index.ts";

export type SearchCopy = {
  open: string;
  placeholder: string;
  clear: string;
  jump: string;
  pages: string;
  sections: string;
  noResults: string;
  noResultsHint: string;
  hint: string;
  kbdUp: string;
  kbdDown: string;
  kbdEnter: string;
  kbdEsc: string;
  results: string;
  groups: Record<NameGroup, string>;
};

export const SEARCH_COPY: Record<Locale, SearchCopy> = {
  en: {
    open: "Search",
    placeholder: "Search the reference…",
    clear: "Clear search",
    jump: "Jump to",
    pages: "Pages",
    sections: "Sections",
    noResults: "No matches",
    noResultsHint: "Try a directive, a filter, a runtime export, or a flag.",
    hint: "to select · to close",
    kbdUp: "↑",
    kbdDown: "↓",
    kbdEnter: "↵",
    kbdEsc: "esc",
    results: "results",
    groups: {
      directive: "Directive",
      primitive: "Primitive",
      filter: "Filter",
      runtime: "Runtime API",
      event: "Event",
      config: "Configuration",
      flag: "CLI flag",
      error: "Error",
      element: "Element",
    },
  },
  "pt-BR": {
    open: "Buscar",
    placeholder: "Buscar na referência…",
    clear: "Limpar busca",
    jump: "Ir para",
    pages: "Páginas",
    sections: "Seções",
    noResults: "Nenhum resultado",
    noResultsHint: "Tente uma diretiva, um filtro, um export de runtime ou uma flag.",
    hint: "para selecionar · para fechar",
    kbdUp: "↑",
    kbdDown: "↓",
    kbdEnter: "↵",
    kbdEsc: "esc",
    results: "resultados",
    groups: {
      directive: "Diretiva",
      primitive: "Primitivo",
      filter: "Filtro",
      runtime: "API de runtime",
      event: "Evento",
      config: "Configuração",
      flag: "Flag de CLI",
      error: "Erro",
      element: "Elemento",
    },
  },
};

export const SEARCH_DEFAULT_NAMES = [
  "use react",
  "RenderSnippet",
  "registerLiquidifyAction",
  "strictCsp",
  "--watch",
  "liquid-data",
  "money",
  "DynamicBlock",
];
