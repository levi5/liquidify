import { useLocale } from "../../i18n.tsx";
import { chapterNeighbours, t as tr, type Chapter } from "../../docs/manifest.ts";
import { toHref } from "../../lib/routes.ts";
import styles from "./style.module.css";
import { cx } from "../../constants/cx.ts";

const EDIT_PATHS: Record<string, string> = {
  hello: "HelloWorld",
  concepts: "Concepts",
  faq: "Faq",
  start: "GettingStarted",
  "theme-model": "DocsGuide",
  authoring: "AuthoringGuide",
  shopify: "ShopifyGuide",
  runtime: "RuntimeGuide",
  islands: "AdvancedIslands",
  schema: "SchemaReference",
  types: "TypesReference",
  cli: "CliReference",
  config: "ConfigReference",
  builder: "ApiGuide",
  tsx: "Builtins",
  build: "BuildDeep",
  filters: "FiltersReference",
  errors: "ErrorsReference",
  plugins: "PluginGuide",
};

export default function PageNav({ chapter }: { chapter: Chapter }) {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const { previous, next } = chapterNeighbours(chapter);
  const folder = EDIT_PATHS[chapter.id] ?? "DocsGuide";
  const editHref = `https://github.com/levi5/liquidify/tree/master/web/src/components/${folder}`;

  return (
    <div className={styles.pageNavWrap}>
      <nav className={styles.pageNav} aria-label={pt ? "Navegação entre capítulos" : "Chapter navigation"}>
        {previous ? (
          <a className={cx(styles.pageNavLink, styles.pageNavPrev)} href={toHref(previous.href)} rel="prev">
            <span className={styles.pageNavDir}>{pt ? "Anterior" : "Previous"}</span>
            <span className={styles.pageNavTitle}>{tr(previous.title, locale)}</span>
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a className={cx(styles.pageNavLink, styles.pageNavNext)} href={toHref(next.href)} rel="next">
            <span className={styles.pageNavDir}>{pt ? "Próximo" : "Next"}</span>
            <span className={styles.pageNavTitle}>{tr(next.title, locale)}</span>
          </a>
        ) : (
          <span />
        )}
      </nav>
      <p className={styles.pageNavEdit}>
        <a href={editHref} target="_blank" rel="noopener">
          {pt ? "Editar esta página no GitHub ↗" : "Edit this page on GitHub ↗"}
        </a>
      </p>
    </div>
  );
}
