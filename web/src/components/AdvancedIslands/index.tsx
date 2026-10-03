import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import styles from "./style.module.css";
import { JSX_EVENT, ACTION_TSX, ACTION_LIQUID, NATIVE_JS, BUS_TSX, DATA_ATTRS, ISLANDS_COPY } from "../../cms/islands.ts";

export default function AdvancedIslands() {
  const { locale } = useLocale();
  const copy = ISLANDS_COPY[locale];
  return (
    <section className={`'wrap' 'section'`}>
      <h2>{copy.title}</h2><p className="section-sub">{copy.intro}</p>
      <div className={styles.docsDeepGrid} style={{ marginTop: "2.56rem" }}>
        <article className={styles.docsDeepCard}><h3>{copy.jsx}</h3><p>{copy.jsxText}</p></article>
        <div><Snippet code={JSX_EVENT} language="tsx" /></div>
      </div>
      <div className={styles.docsDeepGrid}>
        <article className={styles.docsDeepCard}><h3>{copy.action}</h3><p>{copy.actionText}</p><h3 style={{ marginTop: "1.6rem" }}>{copy.allowTitle}</h3><ul className={styles.chipList}>{copy.allow.map((e) => <li key={e}><code>{e}</code></li>)}</ul><p>{copy.allowNote}</p></article>
        <div style={{ display: "grid", gap: "1.6rem", alignContent: "start" }}>
          <Snippet code={ACTION_TSX} language="tsx" />
          <Snippet code={ACTION_LIQUID} language="liquid" />
        </div>
      </div>
      <div className={styles.docsDeepGrid}>
        <article className={styles.docsDeepCard}><h3>{copy.native}</h3><p>{copy.nativeText}</p><h3 style={{ marginTop: "1.6rem" }}>{copy.bus}</h3><p>{copy.busText}</p></article>
        <div style={{ display: "grid", gap: "1.6rem", alignContent: "start" }}>
          <Snippet code={NATIVE_JS} language="tsx" />
          <Snippet code={BUS_TSX} language="tsx" />
        </div>
      </div>
      <div className={styles.docsDeepGrid}>
        <article className={styles.docsDeepCard}>
          <h3>{copy.lifecycle}</h3>
          <div className="table-wrap"><table className="table"><thead><tr>{copy.lifecycleHeaders.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{copy.lifecycleRows.map((row) => <tr key={row[0]}><td><code>{row[0]}</code></td><td>{row[1]}</td></tr>)}</tbody></table></div>
          <div className={styles.referenceCallout}><p>{copy.lifecycleNote}</p></div>
        </article>
        <article className={styles.docsDeepCard}>
          <h3>{copy.types}</h3>
          <p className="muted">{copy.typesText}</p>
          <Snippet code={DATA_ATTRS} language="liquid" />
        </article>
      </div>
    </section>
  );
}
