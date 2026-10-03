import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import styles from "./style.module.css";
import {
  IMPORT,
  IMPORT_LOGIC,
  IMPORT_RUNTIME,
  RUNTIME_TSX,
  RUNTIME_OUT,
  INTRINSICS,
  FORBIDDEN,
  BUILTINS_COPY,
  BUILTINS_EXAMPLES,
  BUILTINS_EXAMPLES2,
} from "../../cms/builtins.ts";

export default function Builtins({ islands = false }: { islands?: boolean } = {}) {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const copy = BUILTINS_COPY[locale];
  const examples = BUILTINS_EXAMPLES;
  const examples2 = BUILTINS_EXAMPLES2;

  return (
    <section id="componentes" className={`'wrap' 'section' styles.builtinsPage`}>
      <p className="kicker">Native Liquid, typed TSX</p>
      <h2>{copy.title}</h2>
      <p className="section-sub">
        {copy.intro} <code>liquidify</code>.
      </p>
      <Snippet code={IMPORT} language="tsx" />
      <h3 id="composition" className={styles.builtinSectionTitle}>{copy.compositionTitle}</h3>
      <div className={styles.builtinList}>
        {copy.cards.map(([name, subtitle, text], i) => (
          <article className={styles.builtinCard} key={name} id={`primitivo-${name}`}>
            <header className={styles.builtinHead}>
              <code className={styles.builtinName}>{name}</code>
              <span className={styles.builtinSub}>{subtitle}</span>
            </header>
            <p className={styles.builtinText}>{text}</p>
            <div className="dir-cols">
              <Snippet title={`${name} (TSX)`} code={examples[i].tsx} language="tsx" />
              <Snippet title={`${name} (${pt ? "Liquid gerado" : "generated Liquid"})`} code={examples[i].liquid} language="liquid" />
            </div>
          </article>
        ))}
      </div>

      <h2 className={styles.builtinSectionTitle} id="logic">{copy.logicTitle}</h2>
      <p className="section-sub">{copy.logicIntro}</p>
      <Snippet code={IMPORT_LOGIC} language="tsx" />
      <div className={styles.builtinList}>
        {copy.cards2.map(([name, subtitle, text], i) => (
          <article className={styles.builtinCard} key={name} id={`primitivo-${name}`}>
            <header className={styles.builtinHead}>
              <code className={styles.builtinName}>{name}</code>
              <span className={styles.builtinSub}>{subtitle}</span>
            </header>
            <p className={styles.builtinText}>{text}</p>
            <div className="dir-cols">
              <Snippet title={`${name} (TSX)`} code={examples2[i].tsx} language="tsx" />
              <Snippet title={`${name} (${pt ? "Liquid gerado" : "generated Liquid"})`} code={examples2[i].liquid} language="liquid" />
            </div>
          </article>
        ))}
      </div>

      <h2 className={styles.builtinSectionTitle}>{copy.runtimeTitle}</h2>
      <p className="section-sub">{copy.runtimeIntro}</p>
      <Snippet code={IMPORT_RUNTIME} language="tsx" />
      <div className={styles.builtinList}>
        <article className={styles.builtinCard}>
          <div className="dir-cols">
            <Snippet title="runtime (TS)" code={RUNTIME_TSX} language="tsx" />
            <Snippet title={pt ? "como se conecta" : "how it connects"} code={RUNTIME_OUT} language="plain" />
          </div>
        </article>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>API</th>
              <th>{pt ? "Papel" : "Role"}</th>
            </tr>
          </thead>
          <tbody>
            {copy.runtimeCards.map(([name, text]) => (
              <tr key={name}>
                <td><code>{name}</code></td>
                <td>{text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {islands && (
        <>
          <h2 className={styles.builtinSectionTitle} id="intrinsics">{copy.intrinsicsTitle}</h2>
          <p className="section-sub">{copy.intrinsicsIntro}</p>
          <Snippet code={INTRINSICS} language="tsx" />

          <h2 className={styles.builtinSectionTitle} id="forbidden">{copy.forbiddenTitle}</h2>
          <p className="section-sub">{copy.forbiddenIntro}</p>
          <Snippet code={FORBIDDEN} language="tsx" />
        </>
      )}
    </section>
  );
}
