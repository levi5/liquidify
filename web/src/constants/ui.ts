export type Locale = "en" | "pt-BR";

export interface Copy {
  docsLink: string;
  apiLink: string;
  exampleLink: string;
  theme: string;
  light: string;
  dark: string;
  nav: string;
  language: string;
  tagline: string;
  footerTag: string;
  footerNav: string;
  install: string;
  searchOpen: string;
  open: string;
  placeholder: string;
  clear: string;
  noResults: string;
  noResultsHint: string;
  jump: string;
  pages: string;
  sections: string;
  searchPlaceholder: string;
  searchClear: string;
  searchNoResults: string;
  searchNoResultsHint: string;
  searchJump: string;
  kbdUp: string;
  kbdDown: string;
  hint: string;
  kbdEnter: string;
  results: string;
  tocLabel: string;
  navLabel: string;
  navPrevious: string;
  navNext: string;
  groups: Record<string, string>;
}

const CACHE = new Map<Locale, Copy>();

export function uiCopy(locale: Locale): Copy {
  const cached = CACHE.get(locale);
  if (cached) return cached;

  const copy: Copy =
    locale === "pt-BR"
      ? {
          docsLink: "Docs",
          apiLink: "API",
          exampleLink: "Example",
          theme: "Alternar tema",
          light: "Claro",
          dark: "Escuro",
          nav: "Navegação principal",
          language: "Idioma",
          tagline: "Shopify em TSX",
          footerTag: "TSX → Liquid para temas Shopify",
          footerNav: "Links do rodapé",
          install: "npm i liquidify",
          searchOpen: "Buscar na referência",
          open: "Buscar",
          placeholder: "Buscar na referência…",
          clear: "Limpar busca",
          noResults: "Nada encontrado.",
          noResultsHint: "Tente uma diretiva, um filtro, um export de runtime ou uma flag.",
          jump: "Ir para",
          searchPlaceholder: "Buscar na referência…",
          searchClear: "Limpar busca",
          searchNoResults: "Nada encontrado.",
          searchNoResultsHint: "Tente uma diretiva, um filtro, um export de runtime ou uma flag.",
          searchJump: "Ir para",
          kbdUp: "↑",
          kbdDown: "↓",
          hint: "para selecionar · para fechar",
          kbdEnter: "↵",
          results: "resultados",
          pages: "Páginas",
          sections: "Seções",
          tocLabel: "Nesta página",
          navLabel: "Navegação entre capítulos",
          navPrevious: "Anterior",
          navNext: "Próximo",
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
        }
      : {
          docsLink: "Docs",
          apiLink: "API",
          exampleLink: "Example",
          theme: "Toggle theme",
          light: "Light",
          dark: "Dark",
          nav: "Primary navigation",
          language: "Language",
          tagline: "Build Shopify in TSX",
          footerTag: "TSX → Liquid for Shopify themes",
          footerNav: "Footer links",
          install: "npm i liquidify",
          searchOpen: "Search the reference",
          open: "Search",
          placeholder: "Search the reference…",
          clear: "Clear search",
          noResults: "No matches",
          noResultsHint: "Try a directive, a filter, a runtime export, or a flag.",
          jump: "Jump to",
          searchPlaceholder: "Search the reference…",
          searchClear: "Clear search",
          searchNoResults: "No matches",
          searchNoResultsHint: "Try a directive, a filter, a runtime export, or a flag.",
          searchJump: "Jump to",
          kbdUp: "↑",
          kbdDown: "↓",
          hint: "to select · to close",
          kbdEnter: "↵",
          results: "results",
          pages: "Pages",
          sections: "Sections",
          tocLabel: "On this page",
          navLabel: "Chapter navigation",
          navPrevious: "Previous",
          navNext: "Next",
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
        };

  CACHE.set(locale, copy);
  return copy;
}
