import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import CodeBlock from "../CodeBlock/index.tsx";
import Callout from "../Callout/index.tsx";
import { toHref } from "../../lib/routes.ts";
import styles from "./style.module.css";
import { cx } from "../../constants/cx.ts";
import {
  HELLO_TSX,
  HELLO_LIQUID,
  HELLO_CONFIG,
  HELLO_TREE,
  RUN_CMD,
  TERMINAL_OK,
  HELLO_COPY,
} from "../../cms/hello.ts";

export default function HelloWorld() {
  const { locale } = useLocale();
  const copy = HELLO_COPY[locale];
  return (
    <section className={cx("wrap", "section", styles.tutorial)}>
      <h2>{copy.title}</h2>
      <p className="section-sub">{copy.intro}</p>
      <Callout><strong>{copy.setup}</strong><p>{copy.setupText} <a href={toHref("#/docs/start")}>{copy.setupLink} →</a></p></Callout>
      <div className={styles.stepGrid}>
        <article>
          <h3>{copy.configTitle}</h3>
        </article>
        <div><Snippet title="liquidify.config.json" code={HELLO_CONFIG} language="json" /></div>
      </div>
      <div className={styles.stepGrid}>
        <article>
          <h3>{copy.write}</h3>
          <p>{copy.writeText}</p>
        </article>
        <div><Snippet title="src/components/Hello.tsx" code={HELLO_TSX} language="tsx" /></div>
      </div>
      <div className={styles.stepGrid}>
        <article>
          <h3>{copy.run}</h3>
          <p>{copy.runText}</p>
        </article>
        <div>
          <Snippet title={copy.run} code={RUN_CMD} language="plain" />
          <Snippet title="terminal" code={TERMINAL_OK} language="plain" />
        </div>
      </div>
      <div className={styles.stepGrid}>
        <article>
          <h3>{copy.output}</h3>
          <p>{copy.outputText}</p>
        </article>
        <div><CodeBlock code={HELLO_LIQUID} path="sections/hello.liquid" showCopy /></div>
      </div>
      <div className={styles.stepGrid}>
        <article>
          <h3>{copy.success}</h3>
          <ul>{copy.successItems.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <div><Snippet title="my-theme/" code={HELLO_TREE} language="plain" /></div>
      </div>
      <article className={styles.nextCard}>
        <h3>{copy.next}</h3>
        <div className="row">
          {copy.nextLinks.map(([label, href]) => (
            <a key={label} className={cx("btn", "btn-small")} href={toHref(href)}>{label} →</a>
          ))}
        </div>
      </article>
    </section>
  );
}
