import { useEffect, useState } from "react";
import { _match, _Maybe } from "funcio";
import { useLocale } from "../../i18n.tsx";
import { t as tr, type Chapter } from "../../docs/manifest.ts";
import { toHref } from "../../lib/routes.ts";
import styles from "./style.module.css";

export default function PageToc({ chapter }: { chapter: Chapter }) {
  const { locale } = useLocale();
  const [present, setPresent] = useState<string[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const collect = () => {
      if (cancelled) return;
      const ids = chapter.sections
        .map((section) => section.id)
        .filter((id) => document.getElementById(id) !== null);
      setPresent(ids);
      setActiveId("");
      attempts += 1;
      if (ids.length === 0 && attempts < 5) window.requestAnimationFrame(collect);
    };
    const frame = window.requestAnimationFrame(collect);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [chapter, locale]);

  useEffect(() => {
    return _match(present.length === 0)
      .with(true, () => undefined)
      .with(false, () => {
        const observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) setActiveId(entry.target.id);
            }
          },
          { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
        );
        for (const id of present) {
          const node = document.getElementById(id);
          if (node) observer.observe(node);
        }
        return () => observer.disconnect();
      })
      .exec();
  }, [present.join("|")]);

  const items = present
    .map((id) =>
      _Maybe.of(chapter.sections.find((item) => item.id === id))
        .map((section) => {
          const found = section as NonNullable<typeof section>;
          return { id, label: tr(found.title, locale) };
        })
        .getOrElse(null),
    )
    .filter((item): item is { id: string; label: string } => item !== null);

  return _match(present.length === 0)
    .with(true, () => null)
    .with(false, () => (
      <>
        <nav className={styles.pageToc} aria-label={locale === "pt-BR" ? "Nesta página" : "On this page"}>
          <p className={styles.pageTocLabel}>{locale === "pt-BR" ? "Nesta página" : "On this page"}</p>
          <ul>
            {items.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={toHref(`${chapter.href}#${id}`)}
                  className={activeId === id ? styles.active : undefined}
                  aria-current={activeId === id ? "location" : undefined}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <details className={styles.pageTocMobile}>
          <summary>{locale === "pt-BR" ? "Nesta página" : "On this page"}</summary>
          <ul>
            {items.map(({ id, label }) => (
              <li key={id}>
                <a href={toHref(`${chapter.href}#${id}`)}>{label}</a>
              </li>
            ))}
          </ul>
        </details>
      </>
    ))
    .exec();
}
