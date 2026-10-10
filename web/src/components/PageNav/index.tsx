import { useLocale } from "../../i18n.tsx";
import { chapterNeighbours, t as tr, type Chapter } from "../../docs/manifest.ts";
import { toHref } from "../../lib/routes.ts";
import styles from "./style.module.css";
import { cx } from "../../constants/cx.ts";

const EDIT_PATHS: Record<string, { docs: string; api: string }> = {
  hello: { docs: "HelloWorld", api: "RuntimeReference" },
  concepts: { docs: "Concepts", api: "RuntimeReference" },
  faq: { docs: "Faq", api: "RuntimeReference" },
  start: { docs: "GettingStarted", api: "RuntimeReference" },
  "theme-model": { docs: "DocsGuide", api: "RuntimeReference" },
  authoring: { docs: "AuthoringGuide", api: "RuntimeReference" },
  shopify: { docs: "ShopifyGuide", api: "RuntimeReference" },
  runtime: { docs: "RuntimeGuide", api: "RuntimeReference" },
  islands: { docs: "AdvancedIslands", api: "RuntimeReference" },
  schema: { docs: "SchemaReference", api: "RuntimeReference" },
  types: { docs: "TypesReference", api: "RuntimeReference" },
  cli: { docs: "CliReference", api: "CliReference" },
  config: { docs: "ConfigReference", api: "ConfigReference" },
  builder: { docs: "ApiGuide", api: "ApiGuide" },
  tsx: { docs: "Builtins", api: "Builtins" },
  build: { docs: "BuildDeep", api: "BuildDeep" },
  filters: { docs: "FiltersReference", api: "FiltersReference" },
  errors: { docs: "ErrorsReference", api: "ErrorsReference" },
  plugins: { docs: "PluginGuide", api: "PluginGuide" },
};

export default function PageNav({ chapter }: { chapter: Chapter }) {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const { previous, next } = chapterNeighbours(chapter);
  const editKey = EDIT_PATHS[chapter.id] ?? { docs: "DocsGuide", api: "RuntimeReference" };
  const folder = editKey[chapter.area];
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
