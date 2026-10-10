import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import styles from "./style.module.css";
import { cx } from "../../constants/cx";
import { SCHEMA_TSX, SCHEMA_LIQUID, VALIDATION, TRANSLATION, CONTENT_FOR, SCHEMA_COPY } from "../../cms/schema.ts";

export default function SchemaReference() {
  const { locale } = useLocale();
  const copy = SCHEMA_COPY[locale];

  return (
    <section className={cx("wrap", "section", styles.schemaReference)}>
      <h2>{locale === "pt-BR" ? "Referência de schema" : "Schema reference"}</h2>
      <p className="section-sub">{copy.intro}</p>

      <div className="ref-block">
        <h3 id="how">{copy.how}</h3>
        <p className="ref-note">{copy.howText}</p>
        <div className={styles.refCodeGrid}>
          <Snippet code={SCHEMA_TSX} language="tsx" title="schema.ts" />
          <Snippet code={SCHEMA_LIQUID} language="liquid" title="sections/hero.liquid" />
        </div>
      </div>

      <div className="ref-block">
        <h3 id="settings">{copy.types}</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {copy.typesHeaders.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {copy.typesRows.map((row) => (
                <tr key={row[0]}>
                  <td>
                    <code>{row[0]}</code>
                  </td>
                  <td>{row[1]}</td>
                  <td>
                    <code className="muted-code">{row[2]}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ref-note">{copy.typesNote}</p>
      </div>

      <div className="ref-block">
        <h3 id="presets">{copy.presets}</h3>
        <p className="ref-note">{copy.presetsText}</p>
      </div>

      <div className="ref-block">
        <h3 id="blocks">{copy.blocks}</h3>
        <p className="ref-note">{copy.blocksText}</p>
        <Snippet code={CONTENT_FOR} language="tsx" title="DynamicBlock" />
      </div>

      <div className="ref-block">
        <h3 id="translations">{copy.translations}</h3>
        <p className="ref-note">{copy.translationsText}</p>
        <Snippet code={TRANSLATION} language="json" title="locales/pt-BR.json" />
      </div>

      <div className="ref-block">
        <h3 id="limits">{copy.limits}</h3>
        <p className="ref-note">{copy.limitsText}</p>
        <Snippet code={VALIDATION} language="tsx" title="schema-validation.ts" />
      </div>
    </section>
  );
}
