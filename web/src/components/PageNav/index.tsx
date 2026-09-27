import { useLocale } from "../../i18n.tsx";
import { chapterNeighbours, t as tr, type Chapter } from "../../docs/manifest.ts";
import styles from "./style.module.css";
import { cx } from "../../constants/cx.ts";

export default function PageNav({ chapter }: { chapter: Chapter }) {
  const { locale } = useLocale();
  const { previous, next } = chapterNeighbours(chapter);
  if (!previous && !next) return null;

  return (
    <nav className={styles.pageNav} aria-label={locale === "pt-BR" ? "Navegação entre capítulos" : "Chapter navigation"}>
      {previous ? (
        <a className={cx(styles.pageNavLink, styles.pageNavPrev)} href={previous.href}>
          <span className={styles.pageNavDir}>{locale === "pt-BR" ? "Anterior" : "Previous"}</span>
          <span className={styles.pageNavTitle}>{tr(previous.title, locale)}</span>
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a className={cx(styles.pageNavLink, styles.pageNavNext)} href={next.href}>
          <span className={styles.pageNavDir}>{locale === "pt-BR" ? "Próximo" : "Next"}</span>
          <span className={styles.pageNavTitle}>{tr(next.title, locale)}</span>
        </a>
      ) : (
        <span />
      )}
    </nav>
  );
}
