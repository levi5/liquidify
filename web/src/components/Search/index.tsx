import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { _match, _Maybe } from "funcio";
import { useLocale } from "../../i18n.tsx";
import { CHAPTERS, t as tr, type Chapter } from "../../docs/manifest.ts";
import { navigate, toHref } from "../../lib/routes.ts";
import { highlight, search, type NameGroup, type SearchResult } from "../../docs/search-index.ts";
import { SEARCH_COPY, SEARCH_DEFAULT_NAMES } from "../../cms/search.ts";
import styles from "./style.module.css";

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
  return _Maybe.of(
    _match(true)
      .with(result.kind === "name" && result.group !== undefined, () => copy.groups[result.group as NameGroup])
      .with(result.kind === "page", () => copy.pages)
      .exec(),
  ).getOrElse(copy.sections);
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
  const copy = SEARCH_COPY[locale];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const clearRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const results = useMemo(() => {
    return _match(query.trim() !== "")
      .with(true, () => search(query))
      .with(false, () => {
        const byName = SEARCH_DEFAULT_NAMES.map((name) => search(name, 1)[0]).filter(Boolean);
        return [...CHAPTERS.map(toPageResult), ...byName];
      })
      .exec();
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

      _Maybe.of(
        _match(true)
          .with((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k", () => {
            event.preventDefault();
            setOpen((value) => !value);
          })
          .with(event.key === "/" && !typing && !event.metaKey && !event.ctrlKey && !event.altKey, () => {
            event.preventDefault();
            setOpen(true);
          })
          .with(event.key === "Escape", () => setOpen(false))
          .exec(),
      ).getOrElse(undefined);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    return _match(!open)
      .with(true, () => undefined)
      .with(false, () => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.requestAnimationFrame(() => inputRef.current?.focus());
        return () => {
          document.body.style.overflow = previous;
        };
      })
      .exec();
  }, [open]);

  useEffect(() => {
    _match(open)
      .with(true, () => undefined)
      .with(false, () => {
        setQuery("");
        triggerRef.current?.focus();
      })
      .exec();
  }, [open]);

  const go = useCallback((href: string) => {
    setOpen(false);
    navigate(href);
  }, []);

  function moveCursor(delta: number) {
    setCursor((value) => (results.length === 0 ? 0 : (value + delta + results.length) % results.length));
  }

  function trapTab(event: React.KeyboardEvent) {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(`a[class*='searchHit']`)).filter(
      (el) => el.offsetParent !== null,
    );
    const stops = ([inputRef.current, ...links, clearRef.current].filter(Boolean) as HTMLElement[]).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
    // Fallback to input+clear when no results rendered yet
    const focusables = stops.length > 0 ? stops : ([inputRef.current, clearRef.current].filter(Boolean) as HTMLElement[]);
    _match(focusables.length === 0)
      .with(true, () => undefined)
      .with(false, () => {
        const at = focusables.indexOf(document.activeElement as HTMLElement);
        event.preventDefault();
        focusables[(at + (event.shiftKey ? -1 : 1) + focusables.length) % focusables.length].focus();
      })
      .exec();
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    _Maybe.of(
      _match(true)
        .with(event.key === copy.kbdDown || event.key === "ArrowDown", () => {
          event.preventDefault();
          moveCursor(1);
        })
        .with(event.key === copy.kbdUp || event.key === "ArrowUp", () => {
          event.preventDefault();
          moveCursor(-1);
        })
        .with(event.key === "Enter", () => {
          event.preventDefault();
          _Maybe.of(results[cursor]).map((hit) => go((hit as SearchResult).href));
        })
        .with(event.key === "Home", () => {
          event.preventDefault();
          setCursor(0);
        })
        .with(event.key === "End", () => {
          event.preventDefault();
          setCursor(Math.max(0, results.length - 1));
        })
        .with(event.key === "Tab", () => trapTab(event))
        .exec(),
    ).getOrElse(undefined);
  };

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [cursor, results]);

  const grouped = useMemo(() => {
    const buckets = new Map<string, SearchResult[]>();
    for (const result of results) {
      const label = labelFor(result, copy);
      buckets.set(label, [...(buckets.get(label) ?? []), result]);
    }
    return [...buckets].map(([label, items]) => ({ label, items }));
  }, [results, copy]);

  let flatIndex = -1;
  const isMac = typeof navigator !== "undefined" && (/mac/i.test((navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? "") || /mac/i.test(navigator.userAgent));

  return (
    <>
      <button
        ref={triggerRef}
        className={styles.searchTrigger}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={copy.open}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
                <div className={styles.searchTriggerWrapper}>
        <span className={styles.searchTriggerIcon} aria-hidden="true">
          <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="M12.8 12.8 17 17" />
          </svg>
        </span>
        <span className={styles.searchTriggerLabel}>{copy.open}</span>
        </div>
        <kbd className={styles.searchTriggerKbd}>{isMac ? "⌘" : "Ctrl"} K</kbd>
      </button>

      {open &&
        createPortal(
          <div className={styles.searchBackdrop} onClick={() => setOpen(false)}>
            <div
              className={styles.searchDialog}
              role="dialog"
              aria-modal="true"
              aria-label={copy.open}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === "Tab") trapTab(event);
              }}
            >
            <div className={styles.searchField}>
              <span className={styles.searchFieldIcon} aria-hidden="true">
                <svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="8.5" cy="8.5" r="5.5" />
                  <path d="M12.8 12.8 17 17" />
                </svg>
              </span>
              <input
                ref={inputRef}
                className={styles.searchInput}
                type="text"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls="search-results"
                aria-activedescendant={results.length > 0 ? `search-option-${cursor}` : undefined}
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
                className={styles.searchClear}
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

            <div className={styles.searchResults} id="search-results" ref={listRef} role="listbox" aria-label={copy.open}>
              {results.length === 0 && (
                <div className={styles.searchEmpty}>
                  <p>{copy.noResults}</p>
                  <p className={styles.searchEmptyHint}>{copy.noResultsHint}</p>
                </div>
              )}

              {grouped.map((bucket) => (
                <div className={styles.searchGroup} key={bucket.label}>
                  <p className={styles.searchGroupLabel}>
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
                        id={`search-option-${index}`}
                        aria-selected={active}
                        data-active={active}
                        className={styles.searchHit}
                        href={toHref(result.href)}
                        onMouseEnter={() => setCursor(index)}
                        onClick={(event) => {
                          event.preventDefault();
                          go(result.href);
                        }}
                      >
                        <span className={styles.searchHitTitle}>
                          <Marked text={title} query={query} />
                        </span>
                        {note && <span className={styles.searchHitNote}>{note}</span>}
                      </a>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className={styles.searchFoot}>
              <span className={styles.searchCount}>
                {results.length} {copy.results}
              </span>
              <span className={styles.searchKeys}>
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
