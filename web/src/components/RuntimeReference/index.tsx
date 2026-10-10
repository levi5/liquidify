import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import { cx } from "../../constants/cx";
import styles from "./style.module.css";
import {
  RUNTIME_TS,
  EVENT_BUS,
  DOM_EVENTS,
  ACTION,
  WINDOW_GLOBALS,
  RUNTIME_COPY,
} from "../../cms/runtime.ts";

export default function RuntimeReference() {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const copy = RUNTIME_COPY[locale];

  return (
    <section className={cx("wrap", "section", styles.runtimeReference)}>
      <h2>Runtime API</h2>
      <p className="section-sub">{copy.intro}</p>

      <h3 id="module">{copy.module}</h3>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {copy.moduleHeaders.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {copy.moduleRows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, index) => (
                  <td key={cell}>
                    {index === 0 ? <code>{cell}</code> : <code className="muted-code">{cell}</code>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ref-note">{copy.moduleNote}</p>
      <Snippet code={RUNTIME_TS} language="tsx" title={pt ? "Uso típico" : "Typical usage"} />

      <h3 id="actions">{copy.actions}</h3>
      <p className="ref-note">{copy.actionsNote}</p>
      <Snippet code={ACTION} language="tsx" title="liquidify/runtime" />

      <h3 id="bus">{copy.bus}</h3>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {copy.busHeaders.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {copy.busRows.map((row) => (
              <tr key={row[0]}>
                <td>
                  <code>{row[0]}</code>
                </td>
                <td>{row[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ref-note">{copy.busNote}</p>
      <Snippet code={EVENT_BUS} language="tsx" title="LiquidifyEventBus" />

      <h3 id="events">{copy.events}</h3>
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
                <td>{row[1]}</td>
                <td>{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 id="dom-events">{copy.domEvents}</h3>
      <p className="ref-note">{copy.domEventsNote}</p>
      <Snippet code={DOM_EVENTS} language="tsx" title={pt ? "Mapeamento para props React" : "Mapped to React props"} />

      <h3 id="globals">{copy.globals}</h3>
      <p className="ref-note">{copy.globalsNote}</p>
      <Snippet code={WINDOW_GLOBALS} language="tsx" title="Window" />

      <h3 id="package">{copy.package}</h3>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {copy.packageHeaders.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {copy.packageRows.map((row) => (
              <tr key={row[0]}>
                <td>
                  <code>{row[0]}</code>
                </td>
                <td>
                  <code>{row[1]}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ref-note">{copy.packageNote}</p>
    </section>
  );
}
