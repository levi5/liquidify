import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import styles from "./style.module.css";
import { cx } from "../../constants/cx";
import { CLI, API, CI, CLI_COPY } from "../../cms/cli.ts";

export default function CliApi() {
  const { locale } = useLocale();
  const copy = CLI_COPY[locale];

  return (
    <section className={cx("wrap", "section", styles.cliApi)}>
      <p className="kicker">{copy.kicker}</p>
      <h2>{copy.title}</h2>
      <div className={styles.cliGrid}>
        <div>
          <Snippet title="CLI" code={CLI} language="plain" />
        </div>
        <div>
          <Snippet title="API" code={API} language="tsx" />
        </div>
      </div>

      <h3 id="builder-events">{copy.eventsTitle}</h3>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {copy.eventsHeaders.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {copy.eventsRows.map((row) => (
              <tr key={row[0]}>
                <td>
                  <code>{row[0]}</code>
                </td>
                <td>
                  <code className="muted-code">{row[1]}</code>
                </td>
                <td>{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ref-note">{copy.eventsNote}</p>

      <h3 id="builder-methods">{copy.methodsTitle}</h3>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {copy.methodsHeaders.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {copy.methodsRows.map((row) => (
              <tr key={row[0]}>
                <td>
                  <code>{row[0]}</code>
                </td>
                <td>
                  <code className="muted-code">{row[1]}</code>
                </td>
                <td>{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 id="ci">{copy.ciTitle}</h3>
      <p className="ref-note">{copy.ciText}</p>
      <Snippet code={CI} language="json" title="package.json" />
    </section>
  );
}
