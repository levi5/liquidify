import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "../../i18n.tsx";
import { CHAPTERS, t as tr, type Chapter } from "../../docs/manifest.ts";
import {
  highlight,
  search,
  type NameGroup,
  type SearchResult,
} from "../../docs/search-index.ts";
import "./style.css";

type Copy = {
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

const EN: Copy = {
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
};

const PT: Copy = {
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
};

const DEFAULT_NAMES = [
  "use react",
  "RenderSnippet",
  "registerLiquidifyAction",
  "strictCsp",
  "--watch",
  "liquid-data",
  "money",
  "DynamicBlock",
];

function toPageResult(chapter: Chapter): SearchResult {
  return {
    key: `page:${chapter.href}`,
    kind: "page",
    title: chapter.title.en,
    titleT: chapter.title,
    noteT: chapter.summary,
    href: chapter.href,
    haystack: "",
    terms: [chapter.id],
    score: 0,
  };
}

function labelFor(result: SearchResult, copy: Copy): string {
  if (result.kind === "name" && result.group) return copy.groups[result.group];
  if (result.kind === "page") return copy.pages;
  return copy.sections;
}

function Marked({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlight(text, query).map((run, index) =>
        run.match ? <mark key={index}>{run.text}</mark> : <span key={index}>{run.text}</span>,
      )}
    </>
  );
}

export default function Search() {
  const { locale } = useLocale();
  const copy = locale === "pt-BR" ? PT : EN;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const clearRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const results = useMemo(() => {
    if (query.trim()) return search(query);
    const byName = DEFAULT_NAMES.map((name) => search(name, 1)[0]).filter(Boolean);
    return [...CHAPTERS.map(toPageResult), ...byName];
  }, [query]);

  const display = useCallback(
    (result: SearchResult) => ({
      title: result.titleT ? tr(result.titleT, locale) : result.title,
      note: result.noteT ? tr(result.noteT, locale) : "",
    }),
    [locale],
  );

  useEffect(() => setCursor(0), [query, locale]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable === true;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        setOpen(true);
        return;
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (open) return;
    setQuery("");
    triggerRef.current?.focus();
  }, [open]);

  const go = useCallback((href: string) => {
    setOpen(false);
    window.location.hash = href;
  }, []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === copy.kbdDown || event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((value) => (results.length === 0 ? 0 : (value + 1) % results.length));
    } else if (event.key === copy.kbdUp || event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((value) => (results.length === 0 ? 0 : (value - 1 + results.length) % results.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = results[cursor];
      if (hit) go(hit.href);
    } else if (event.key === "Home") {
      event.preventDefault();
      setCursor(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setCursor(Math.max(0, results.length - 1));
    } else if (event.key === "Tab") {
      const stops = ([inputRef.current, clearRef.current].filter(Boolean) as HTMLElement[])
        .filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (stops.length === 0) return;
      const at = stops.indexOf(document.activeElement as HTMLElement);
      event.preventDefault();
      const next = stops[(at + (event.shiftKey ? -1 : 1) + stops.length) % stops.length];
      next.focus();
    }
  };

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [cursor, results]);

  const grouped = useMemo(() => {
    const buckets = new Map<string, SearchResult[]>();
    for (const result of results) {
      const label = labelFor(result, copy);
      const bucket = buckets.get(label);
      if (bucket) bucket.push(result);
      else buckets.set(label, [result]);
    }
    return [...buckets].map(([label, items]) => ({ label, items }));
  }, [results, copy]);

  let flatIndex = -1;
  const isMac = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);

  return (
    <>
      <button
        ref={triggerRef}
        className="search-trigger"
        type="button"
        onClick={() => setOpen(true)}
        aria-label={copy.open}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
                <div className="search-trigger-wrapper">
        <span className="search-trigger-icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="M12.8 12.8 17 17" />
          </svg>
        </span>
        <span className="search-trigger-label">{copy.open}</span>
        </div>
        <kbd className="search-trigger-kbd">{isMac ? "⌘" : "Ctrl"} K</kbd>
      </button>

      {open &&
        createPortal(
          <div className="search-backdrop" onClick={() => setOpen(false)}>
            <div
              className="search-dialog"
              role="dialog"
              aria-modal="true"
              aria-label={copy.open}
              onClick={(event) => event.stopPropagation()}
            >
            <div className="search-field">
              <span className="search-field-icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="8.5" cy="8.5" r="5.5" />
                  <path d="M12.8 12.8 17 17" />
                </svg>
              </span>
              <input
                ref={inputRef}
                className="search-input"
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls="search-results"
                aria-autocomplete="list"
                placeholder={copy.placeholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onKeyDown}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                ref={clearRef}
                className="search-clear"
                type="button"
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                aria-label={copy.clear}
                hidden={!query}
              >
                <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l8 8M14 6l-8 8" />
                </svg>
              </button>
            </div>

            <div className="search-results" id="search-results" ref={listRef} role="listbox" aria-label={copy.open}>
              {results.length === 0 && (
                <div className="search-empty">
                  <p>{copy.noResults}</p>
                  <p className="search-empty-hint">{copy.noResultsHint}</p>
                </div>
              )}

              {grouped.map((bucket) => (
                <div className="search-group" key={bucket.label}>
                  <p className="search-group-label">
                    {query ? bucket.label : bucket.label === copy.pages ? copy.jump : bucket.label}
                  </p>
                  {bucket.items.map((result) => {
                    flatIndex += 1;
                    const index = flatIndex;
                    const active = index === cursor;
                    const { title, note } = display(result);
                    return (
                      <a
                        key={result.key}
                        role="option"
                        aria-selected={active}
                        data-active={active}
                        className="search-hit"
                        href={result.href}
                        onMouseEnter={() => setCursor(index)}
                        onClick={(event) => {
                          event.preventDefault();
                          go(result.href);
                        }}
                      >
                        <span className="search-hit-title">
                          <Marked text={title} query={query} />
                        </span>
                        {note && <span className="search-hit-note">{note}</span>}
                      </a>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="search-foot">
              <span className="search-count">
                {results.length} {copy.results}
              </span>
              <span className="search-keys">
                <kbd>{copy.kbdUp}</kbd>
                <kbd>{copy.kbdDown}</kbd>
                <span>{copy.hint}</span>
                <kbd>{copy.kbdEnter}</kbd>
              </span>
            </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
