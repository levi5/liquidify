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
    const ids = chapter.sections
      .map((section) => section.id)
      .filter((id) => document.getElementById(id) !== null);
    setPresent(ids);
    setActiveId("");
  }, [chapter, locale]);

  useEffect(() => {
    return _match(present.length === 0)
      .with(true, () => undefined)
      .with(false, () => {
        let frame = 0;

        const measure = () => {
          frame = 0;
          let current = present[0];
          for (const id of present) {
            _Maybe.of(document.getElementById(id)).map((node) => {
              const target = node as HTMLElement;
              _match(target.getBoundingClientRect().top <= 100)
                .with(true, () => {
                  current = id;
                })
                .with(false, () => undefined)
                .exec();
            });
          }
          setActiveId((value) => (value === current ? value : current));
        };

        const onScroll = () => {
          _match(frame === 0)
            .with(true, () => {
              frame = window.requestAnimationFrame(measure);
            })
            .with(false, () => undefined)
            .exec();
        };

        measure();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
          _match(frame !== 0)
            .with(true, () => window.cancelAnimationFrame(frame))
            .with(false, () => undefined)
            .exec();
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
        };
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
