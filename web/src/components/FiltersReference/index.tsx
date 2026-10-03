import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import styles from "./style.module.css";
import {
  CLASSNAME_USAGE,
  CLASSNAMES,
  FILTERS_COPY,
  FORBIDDEN,
  HELPER_EX_DATE,
  HELPER_EX_DEFAULT,
  HELPER_EX_ESCAPE,
  HELPER_EX_JSON,
  HELPER_EX_MONEY,
  HELPER_EX_URLS,
  HELPER_TABLE,
  HELPER_USAGE,
  STRING_LIKE,
} from "../../cms/filters.ts";

export default function FiltersReference() {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const copy = FILTERS_COPY[locale];

  const table = (id: string, title: string, headers: string[], rows: string[][]) => (
    <div className="ref-block" key={id}>
      <h3 id={id}>{title}</h3>
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
  );

  return (
    <section className={`'wrap' 'section' styles.filtersReference`}>
      <h2>{pt ? "Filtros e helpers" : "Filters and helpers"}</h2>
      <p className="section-sub">
        {pt
          ? "Tudo que o compilador reconhece como filtro, e o helper TSX que emite cada um."
          : "Everything the compiler recognises as a filter, and the TSX helper that emits it."}
      </p>

      <div className="ref-block">
        <h3 id="string-rule">{copy.rule}</h3>
        <p className="ref-note">{copy.ruleText}</p>
      </div>

      {table("core", copy.core, copy.coreHeaders, copy.coreRows)}
      {table("collections", copy.collections, copy.collectionsHeaders, copy.collectionsRows)}
      {table("money", copy.money, copy.moneyHeaders, copy.moneyRows)}
      {table("shopify", copy.shopify, copy.shopifyHeaders, copy.shopifyRows)}

      <div className="ref-block">
        <h3 id="helpers">{copy.helpers}</h3>
        <p className="ref-note">{copy.helpersText}</p>
        <div className={styles.refCodeGrid}>
          <Snippet code={HELPER_TABLE} language="tsx" title="HELPER_TO_FILTER" />
          <Snippet code={HELPER_USAGE} language="tsx" title={pt ? "Uso" : "Usage"} />
        </div>
      </div>

      <div className="ref-block">
        <h3 id="helper-examples">{pt ? "Exemplos de todos os helpers" : "Examples of all helpers"}</h3>
        <div className={styles.refCodeGrid}>
          <Snippet code={HELPER_EX_ESCAPE} language="tsx" title="escape / escapeOnce" />
          <Snippet code={HELPER_EX_JSON} language="tsx" title="json / raw" />
          <Snippet code={HELPER_EX_DEFAULT} language="tsx" title="defaultValue / t / translate" />
          <Snippet code={HELPER_EX_URLS} language="tsx" title="assetUrl / imageUrl / urlEncode / linkTo" />
          <Snippet code={HELPER_EX_MONEY} language="tsx" title="money / moneyWithCurrency / moneyWithoutCurrency / moneyWithoutTrailingZeros / weightWithUnit" />
          <Snippet code={HELPER_EX_DATE} language="tsx" title="date" />
        </div>
      </div>

      <div className="ref-block">
        <h3 id="strings">{copy.strings}</h3>
        <p className="ref-note">{copy.stringsText}</p>
        <Snippet code={STRING_LIKE} language="tsx" title="STRING_LIKE_METHODS" />
      </div>

      <div className="ref-block">
        <h3 id="classnames">{copy.classnames}</h3>
        <p className="ref-note">{copy.classnamesText}</p>
        <div className={styles.refCodeGrid}>
          <Snippet code={CLASSNAMES} language="tsx" title="CLASSNAMES_FNS" />
          <Snippet code={CLASSNAME_USAGE} language="tsx" title={pt ? "Formas aceitas" : "Accepted forms"} />
        </div>
      </div>

      <div className="ref-block">
        <h3 id="operators">{copy.operators}</h3>
        <p className="ref-note">{copy.operatorsText}</p>
        <Snippet code={FORBIDDEN} language="tsx" title={pt ? "Proibido dentro de ilhas" : "Forbidden inside islands"} />
      </div>
    </section>
  );
}
