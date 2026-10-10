import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import { cx } from "../../constants/cx";
import styles from "./style.module.css";
import {
  ERROR_CLASSES,
  ERROR_COLLECTOR,
  ERROR_LOOPS_ROWS,
  ERRORS_COPY,
  LIMITS,
  NAMING,
  RESERVED,
  RUNTIME_MESSAGES,
  VALIDATION_RULES,
} from "../../cms/errors.ts";

export default function ErrorsReference() {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const copy = ERRORS_COPY[locale];

  const rowTable = (id: string, title: string, headers: string[], rows: string[][], text?: string) => (
    <div className="ref-block" key={id}>
      <h3 id={id}>{title}</h3>
      {text && <p className="ref-note">{text}</p>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("|")}>
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
    </div>
  );

  return (
    <section className={cx("wrap", "section", styles.errorsReference)}>
      <h2>{pt ? "Erros e limites" : "Errors and limits"}</h2>
      <p className="section-sub">{copy.intro}</p>
      <Snippet code={ERROR_CLASSES} language="tsx" title={pt ? "Classes de erro" : "Error classes"} />

      {rowTable("unsupported", copy.unsupported, copy.unsupportedHeaders, copy.unsupportedRows)}
      {rowTable("primitive-attrs", copy.primitive, copy.primitiveHeaders, copy.primitiveRows)}

      <div className="ref-block">
        <h3 id="loops">{copy.loops}</h3>
        <p className="ref-note">{copy.loopsText}</p>
        <div className="table-wrap">
          <table className="table">
            <tbody>
              {ERROR_LOOPS_ROWS.map((row) => (
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
      </div>

      {rowTable("config-errors", copy.configErrors, copy.configHeaders, copy.configRows)}

      <div className="ref-block">
        <h3 id="naming">{copy.naming}</h3>
        <p className="ref-note">{copy.namingText}</p>
        <Snippet code={NAMING} language="tsx" title="lib/shared/string.ts" />
        <Snippet code={RESERVED} language="tsx" title={pt ? "Reservas do output" : "Output reservations"} />
      </div>

      <div className="ref-block">
        <h3 id="limits">{copy.limits}</h3>
        <p className="ref-note">{copy.limitsText}</p>
        <Snippet code={LIMITS} language="tsx" title="limites" />
      </div>

      <div className="ref-block">
        <h3 id="error-collector">ErrorCollector</h3>
        <Snippet code={ERROR_COLLECTOR} language="tsx" title="lib/core/errors/error-collector.ts" />
      </div>

      <div className="ref-block">
        <h3 id="validation-rules">Regras de validação</h3>
        <Snippet code={VALIDATION_RULES} language="tsx" title="ValidationService" />
      </div>

      <div className="ref-block">
        <h3 id="runtime-console">{copy.runtimeConsole}</h3>
        <p className="ref-note">{copy.runtimeConsoleText}</p>
        <Snippet code={RUNTIME_MESSAGES} language="plain" title="console" />
      </div>
    </section>
  );
}
