import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import styles from "./style.module.css";

const BUILDER = `import { makeLiquidifyBuilder } from 'liquidify'

const builder = makeLiquidifyBuilder({
  componentsDir: 'src/app',
  output: '.',
})

builder.on('build:start', () => console.log('Compiling theme'))
builder.on('build:end', () => console.log('Theme ready'))
builder.on('build:failed', (error) => console.error(error.message))
builder.on('file:change', (file) => console.log('Changed:', file))
builder.on('error', (error) => console.error(error.message))

await builder.build() // lança LiquidifyError em falha direta
builder.watch()       // falhas no watch emitem 'build:failed'
// await builder.dispose() // encerra o watcher`;

const CI_SCRIPT = `{
  "scripts": {
    "dev": "liquidify --watch",
    "build": "liquidify",
    "typecheck": "tsc --noEmit",
    "check": "shopify theme check",
    "preview": "shopify theme dev"
  }
}`;

export default function ApiGuide() {
  const { locale } = useLocale();
  const copy = locale === "pt-BR"
    ? { title: "Escolha a interface certa", intro: "A CLI é o melhor ponto de partida para um tema. Use a API quando o Liquidify precisa fazer parte de uma ferramenta, uma automação ou um pipeline próprio.", cli: "CLI: para trabalhar no tema", api: "API: para integrar no build", cliItems: ["init cria a cópia do template example", "--watch recompila durante o desenvolvimento", "--config usa outro arquivo de configuração", "npm run preview abre uma development theme"], apiItems: ["makeLiquidifyBuilder recebe o mesmo config", "build() compila uma vez", "watch() mantém o processo ativo", "Eventos permitem exibir status na sua ferramenta"], lifecycle: "Ciclo recomendado", lifecycleItems: ["Edite TSX e CSS em src/app", "Rode liquidify --watch durante a criação", "Execute typecheck e Theme Check antes da entrega", "Publique com Shopify CLI ou CI"], events: "Eventos do builder", eventRows: [["build:start", "A compilação começou."], ["build:end", "Sections, snippets e bundles terminaram."], ["file:change", "Um arquivo observado mudou; recebe o path como payload."], ["build:failed", "Um rebuild iniciado pelo watch falhou (no watch, erro vira evento)."], ["error", "Falha fora do watch. build() direto também lança LiquidifyError."]], eventHeaders: ["Evento", "Quando usar"], methods: "Métodos do builder", methodHeaders: ["Método", "Comportamento"], methodRows: [["build()", "Compila uma vez; em falha direta lança LiquidifyError."], ["watch()", "Observa com chokidar (debounce 200ms); rebuild incremental em memória."], ["on(event, fn)", "Assina eventos (é um EventEmitter)."], ["dispose()", "Fecha o watcher (assíncrono)."], ["disposeSync()", "Fecha o watcher (compat, fire-and-forget)."]], incremental: "Build incremental", incrementalText: "O watch mantém cache em memória e grafo de dependências: só o afetado recompila. Mudança no registry dispara rebuild completo. Veja o capítulo Build & watch para o contrato do manifest.", commands: "Referência de comandos", commandHeaders: ["Comando", "Uso"], commandRows: [["npx liquidify init minha-loja --template example", "Copia o tema completo que esta documentação explica."], ["liquidify", "Compila uma vez usando liquidify.config.json (build é o padrão)."], ["liquidify --watch", "Observa componentsDir e dependências descobertas; recompila ao salvar."], ["liquidify --force", "Permite sobrescrever artefatos/arquivos existentes."], ["liquidify --config caminho/config.json", "Usa outro arquivo de configuração (--config= também vale)."], ["liquidify --quiet / --no-banner", "Reduz a saída em automações e CI."], ["liquidx · liquidx-watch · liquidify-watch", "Bins/aliases compatíveis da CLI."]], config: "Opções de configuração", configHeaders: ["Opção", "Obrigatória", "Descrição"], configRows: [["componentsDir", "Sim", "Pasta que contém sections, snippets, ilhas e código compartilhado."], ["output", "Sim", "Pasta raiz do tema que recebe sections, snippets e bundles."], ["force", "Não", "Permite que o gerador substitua arquivos de saída existentes."], ["react.strictCsp", "Não", "Controla a estratégia CSP do runtime React; o padrão é true."]], automation: "Scripts de projeto e CI", automationText: "Mantenha build, tipos e Theme Check separados. Em CI, execute-os nessa ordem antes do deploy; isso separa erro de TSX, erro do compilador e erro de estrutura Shopify." }
    : { title: "Choose the right interface", intro: "The CLI is the best starting point for a theme. Use the API when Liquidify needs to be part of a tool, automation, or custom pipeline.", cli: "CLI: to work on the theme", api: "API: to integrate into a build", cliItems: ["init creates a copy of the example template", "--watch recompiles during development", "--config uses another configuration file", "npm run preview opens a development theme"], apiItems: ["makeLiquidifyBuilder accepts the same config", "build() compiles once", "watch() keeps the process alive", "Events let your tool report progress"], lifecycle: "Recommended lifecycle", lifecycleItems: ["Edit TSX and CSS in src/app", "Run liquidify --watch while building", "Run typecheck and Theme Check before delivery", "Publish with Shopify CLI or CI"], events: "Builder events", eventRows: [["build:start", "Compilation has started."], ["build:end", "Sections, snippets, and bundles are complete."], ["file:change", "A watched file changed; receives the path as payload."], ["build:failed", "A watch-triggered rebuild failed (in watch, errors become events)."], ["error", "Failure outside watch. Direct build() also throws LiquidifyError."]], eventHeaders: ["Event", "Use it when"], methods: "Builder methods", methodHeaders: ["Method", "Behavior"], methodRows: [["build()", "Compiles once; direct failures throw LiquidifyError."], ["watch()", "Watches with chokidar (200ms debounce); in-memory incremental rebuild."], ["on(event, fn)", "Subscribes to events (it is an EventEmitter)."], ["dispose()", "Closes the watcher (async)."], ["disposeSync()", "Closes the watcher (compat, fire-and-forget)."]], incremental: "Incremental build", incrementalText: "Watch keeps an in-memory cache and dependency graph: only affected files recompile. Registry changes trigger a full rebuild. See the Build & watch chapter for the manifest contract.", commands: "Command reference", commandHeaders: ["Command", "Purpose"], commandRows: [["npx liquidify init my-store --template example", "Copies the complete theme explained in this documentation."], ["liquidify", "Compiles once using liquidify.config.json (build is the default)."], ["liquidify --watch", "Watches componentsDir and discovered dependencies; recompiles on save."], ["liquidify --force", "Allows overwriting existing output/files."], ["liquidify --config path/config.json", "Uses another configuration file (--config= also works)."], ["liquidify --quiet / --no-banner", "Reduces output in automation and CI."], ["liquidx · liquidx-watch · liquidify-watch", "Compatible CLI bins/aliases."]], config: "Configuration options", configHeaders: ["Option", "Required", "Description"], configRows: [["componentsDir", "Yes", "Folder containing sections, snippets, islands, and shared code."], ["output", "Yes", "Theme root that receives sections, snippets, and bundles."], ["force", "No", "Lets the generator replace existing output files."], ["react.strictCsp", "No", "Controls the React runtime CSP strategy; default is true."]], automation: "Project scripts and CI", automationText: "Keep build, types, and Theme Check separate. In CI, run them in that order before deployment; it isolates TSX, compiler, and Shopify-structure failures." };
  return (
    <section className={`'wrap' 'section' styles.apiGuide`}>
      <h2>{copy.title}</h2><p className="section-sub">{copy.intro}</p>
      <div className={styles.apiChoiceGrid}><article><h3>{copy.cli}</h3><ul>{copy.cliItems.map((item) => <li key={item}>{item}</li>)}</ul></article><article><h3>{copy.api}</h3><ul>{copy.apiItems.map((item) => <li key={item}>{item}</li>)}</ul></article></div>
      <div className={styles.apiDetailGrid}><div><h3>{copy.lifecycle}</h3><ol>{copy.lifecycleItems.map((item) => <li key={item}>{item}</li>)}</ol><h3>{copy.events}</h3><div className="table-wrap"><table className="table"><thead><tr>{copy.eventHeaders.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{copy.eventRows.map((row) => <tr key={row[0]}><td><code>{row[0]}</code></td><td>{row[1]}</td></tr>)}</tbody></table></div></div><div><Snippet title="makeLiquidifyBuilder" code={BUILDER} language="tsx" /></div></div>
      <div className={styles.apiDetailGrid}><div><h3>{copy.methods}</h3><div className="table-wrap"><table className="table"><thead><tr>{copy.methodHeaders.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{copy.methodRows.map((row) => <tr key={row[0]}><td><code>{row[0]}</code></td><td>{row[1]}</td></tr>)}</tbody></table></div></div><div className={styles.referenceCallout}><strong>{copy.incremental}</strong><p>{copy.incrementalText}</p></div></div>
      <div className={styles.apiReferenceGrid}>
        <div><h3>{copy.commands}</h3><div className="table-wrap"><table className="table"><thead><tr>{copy.commandHeaders.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{copy.commandRows.map((row) => <tr key={row[0]}><td><code>{row[0]}</code></td><td>{row[1]}</td></tr>)}</tbody></table></div></div>
        <div><h3>{copy.config}</h3><div className="table-wrap"><table className="table"><thead><tr>{copy.configHeaders.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{copy.configRows.map((row) => <tr key={row[0]}><td><code>{row[0]}</code></td><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody></table></div></div>
      </div>
      <div className={styles.apiAutomation}><div><h3>{copy.automation}</h3><p>{copy.automationText}</p></div><Snippet code={CI_SCRIPT} language="json" /></div>
    </section>
  );
}
