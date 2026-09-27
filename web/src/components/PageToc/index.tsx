import { useEffect, useState } from "react";
import { useLocale } from "../../i18n.tsx";
import { t as tr, type Chapter } from "../../docs/manifest.ts";
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
    if (present.length === 0) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      let current = present[0];
      for (const id of present) {
        const node = document.getElementById(id);
        if (node && node.getBoundingClientRect().top <= 100) current = id;
      }
      setActiveId((value) => (value === current ? value : current));
    };

    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [present.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  if (present.length === 0) return null;

  return (
    <nav className={styles.pageToc} aria-label={locale === "pt-BR" ? "Nesta página" : "On this page"}>
      <p className={styles.pageTocLabel}>{locale === "pt-BR" ? "Nesta página" : "On this page"}</p>
      <ul>
        {present.map((id) => {
          const section = chapter.sections.find((item) => item.id === id);
          if (!section) return null;
          return (
            <li key={id}>
              <a
                href={`${chapter.href}#${id}`}
                className={activeId === id ? "active" : undefined}
                aria-current={activeId === id ? "location" : undefined}
              >
                {tr(section.title, locale)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
