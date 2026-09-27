import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import styles from "./style.module.css";

const CLI = `liquidify [options]          # compila (build é o padrão)
liquidify init [dir] [options]

--watch, -w     observa e recompila a cada save (debounce 200ms)
--force, -f     permite sobrescrever saída/init existentes
--config PATH   usa outro config (--config=path também vale)
--quiet, -q     saída mínima (implica --no-banner, bom p/ CI)
--no-banner     esconde o banner
--version, -V   versão
--help, -h      ajuda

init:
--template, -t  example (fashion|store normalizam p/ example)
--force, -f     init mesmo com arquivos no destino

bins: liquidify, liquidify-watch, liquidx, liquidx-watch`;

const API = `import { makeLiquidifyBuilder } from 'liquidify'

const builder = makeLiquidifyBuilder({
  componentsDir: 'src/components',
  output: '.',
})

await builder.build()
builder.watch() // opcional
// await builder.dispose() // encerra o watcher`;

const CI = `{
  "scripts": {
    "build": "liquidify --no-banner",
    "dev": "liquidify-watch",
    "typecheck": "tsc --noEmit",
    "preview": "shopify theme dev"
  }
}`;

export default function CliApi() {
  const { locale } = useLocale();
  const copy = locale === "pt-BR"
    ? {
        kicker: "Automação",
        title: "CLI e API programática",
        eventsTitle: "Eventos do builder",
        eventsHeaders: ["Evento", "Payload", "Quando"],
        eventsRows: [
          ["build:start", "—", "A compilação começou."],
          ["build:end", "—", "As saídas foram gravadas."],
          ["build:failed", "Error", "Um rebuild do watch falhou."],
          ["error", "LiquidifyError", "Falha em build(), com file e location."],
          ["file:change", "string", "Um arquivo vigiado mudou."],
        ],
        eventsNote:
          "O builder é um EventEmitter. Register build:failed e error juntos se você quiser cobrir o build avulso e o watch, porque os dois erros chegam por canais diferentes.",
        methodsTitle: "Métodos do builder",
        methodsHeaders: ["Método", "Retorno", "Nota"],
        methodsRows: [
          ["build()", "Promise<void>", "Compila uma vez. Rejeita em caso de falha."],
          ["watch()", "void", "Vigia componentsDir e o grafo de imports. Debounce de 200ms."],
          ["dispose()", "Promise<void>", "Fecha o watcher."],
          ["disposeSync()", "void", "Fecha o watcher sem await."],
          ["on(event, fn)", "this", "EventEmitter padrão."],
        ],
        ciTitle: "Scripts de projeto e CI",
        ciText:
          "Em CI, use --no-banner (ou --quiet, que já o implica). O banner também é suprimido quando CI=1 ou NO_COLOR=1 estão no ambiente, então um pipeline limpo não depende de passar a flag.",
      }
    : {
        kicker: "Automation",
        title: "CLI and programmatic API",
        eventsTitle: "Builder events",
        eventsHeaders: ["Event", "Payload", "When"],
        eventsRows: [
          ["build:start", "—", "Compilation began."],
          ["build:end", "—", "Outputs were written."],
          ["build:failed", "Error", "A watch rebuild failed."],
          ["error", "LiquidifyError", "build() failed, with file and location."],
          ["file:change", "string", "A watched file changed."],
        ],
        eventsNote:
          "The builder is an EventEmitter. Subscribe to build:failed and error together if you want to cover both the one-shot build and watch, because the two errors arrive on different channels.",
        methodsTitle: "Builder methods",
        methodsHeaders: ["Method", "Returns", "Note"],
        methodsRows: [
          ["build()", "Promise<void>", "Compiles once. Rejects on failure."],
          ["watch()", "void", "Watches componentsDir and the import graph. 200ms debounce."],
          ["dispose()", "Promise<void>", "Closes the watcher."],
          ["disposeSync()", "void", "Closes the watcher without await."],
          ["on(event, fn)", "this", "Standard EventEmitter."],
        ],
        ciTitle: "Project scripts and CI",
        ciText:
          "In CI, use --no-banner (or --quiet, which already implies it). The banner is also suppressed when CI=1 or NO_COLOR=1 is in the environment, so a clean pipeline does not depend on passing the flag.",
      };

  return (
    <section className={`'wrap' 'section' styles.cliApi`}>
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
