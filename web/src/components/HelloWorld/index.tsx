import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import CodeBlock from "../CodeBlock/index.tsx";
import Callout from "../Callout/index.tsx";
import { toHref } from "../../lib/routes.ts";
import styles from "./style.module.css";
import { cx } from "../../constants/cx.ts";

const HELLO_TSX = `"use sections"

export const schema = {
  name: "Hello",
  settings: [
    { type: "text", id: "heading", label: "Heading", default: "Hello, Shopify" }
  ],
  presets: [{ name: "Hello" }]
}

export default function Hello() {
  return (
    <section className="hello">
      <h2>{section.settings.heading}</h2>
    </section>
  )
}`;

const HELLO_LIQUID = `<section class="hello">
  <h2>
    {{ section.settings.heading | escape }}
  </h2>
</section>

{% schema %}
{
  "name": "Hello",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Hello, Shopify"
    }
  ],
  "presets": [
    {
      "name": "Hello"
    }
  ]
}
{% endschema %}`;

const HELLO_CONFIG = `{
  "componentsDir": "src/components",
  "output": "."
}`;

const HELLO_TREE = `my-theme/
├── liquidify.config.json
├── src/components/Hello.tsx
└── sections/hello.liquid   # generated: do not hand-edit`;

const RUN_CMD = `npx liquidify`;

const TERMINAL_OK = `✔ Configuration loaded (src: src/components, out: .)
- Building...
New file created: sections/hello.liquid
✔ Build completed successfully!`;

export default function HelloWorld() {
  const { locale } = useLocale();
  const copy = locale === "pt-BR" ? {
    title: "Escreva um arquivo, rode um comando, leia o Liquid",
    intro: "Este tutorial compila de verdade: o TSX abaixo e o Liquid ao lado saíram de uma execução real do compilador. Cinco minutos e você entende o ciclo inteiro da lib.",
    setup: "Antes de começar",
    setupText: "Você precisa de uma pasta de tema com liquidify.config.json. Ainda não tem? Gere o template completo primeiro.",
    setupLink: "Começar pelo template",
    configTitle: "liquidify.config.json mínimo",
    write: "Escreva o arquivo",
    writeText: "Crie src/components/Hello.tsx. A primeira linha, \"use sections\", diz ao compilador o que emitir: um arquivo sections/hello.liquid com {% schema %}. O export const schema vira o painel do Theme Editor.",
    run: "Rode o compilador",
    runText: "Um comando, sem flags. O terminal deve imprimir exatamente isto:",
    output: "Leia o resultado",
    outputText: "Abra sections/hello.liquid. Repare nas três transformações: className virou class, {section.settings.heading} virou {{ section.settings.heading | escape }}, e o objeto schema virou {% schema %} JSON. Você nunca edita este arquivo à mão — ele é apagado e regerado a cada build.",
    success: "Confira se funcionou",
    successItems: ["sections/hello.liquid existe na raiz do tema.", "O terminal imprimiu Build completed successfully!.", "Nada dentro de sections/ foi editado à mão."],
    next: "Próximos passos",
    nextLinks: [
      ["Entender os cinco conceitos", "#/docs/concepts"],
      ["Escrever TSX de verdade", "#/docs/authoring"],
      ["Algo deu errado? Veja o FAQ", "#/docs/faq"],
      ["Ver a loja example completa", "#/example"],
    ],
  } : {
    title: "Write one file, run one command, read the Liquid",
    intro: "This tutorial compiles for real: the TSX below and the Liquid beside it came from an actual compiler run. Five minutes and you understand the whole lib loop.",
    setup: "Before you start",
    setupText: "You need a theme folder with liquidify.config.json. Don't have one yet? Generate the full template first.",
    setupLink: "Start from the template",
    configTitle: "Minimal liquidify.config.json",
    write: "Write the file",
    writeText: "Create src/components/Hello.tsx. The first line, \"use sections\", tells the compiler what to emit: a sections/hello.liquid file with {% schema %}. The exported schema object becomes the Theme Editor panel.",
    run: "Run the compiler",
    runText: "One command, no flags. The terminal must print exactly this:",
    output: "Read the output",
    outputText: "Open sections/hello.liquid. Notice the three transformations: className became class, {section.settings.heading} became {{ section.settings.heading | escape }}, and the schema object became {% schema %} JSON. You never hand-edit this file — it is deleted and regenerated on every build.",
    success: "Check it worked",
    successItems: ["sections/hello.liquid exists at the theme root.", "The terminal printed Build completed successfully!.", "Nothing inside sections/ was hand-edited."],
    next: "Next steps",
    nextLinks: [
      ["Understand the five concepts", "#/docs/concepts"],
      ["Write real TSX", "#/docs/authoring"],
      ["Something broke? See the FAQ", "#/docs/faq"],
      ["See the full example store", "#/example"],
    ],
  };
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
