import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import "./style.css";

const BUILDER = `import { makeLiquidifyBuilder } from 'liquidify'

const builder = makeLiquidifyBuilder({
  componentsDir: 'src/app',
  output: '.',
})

builder.on('build:start', () => console.log('Compiling theme'))
builder.on('build:end', () => console.log('Theme ready'))
builder.on('error', (error) => console.error(error.message))

await builder.build()
builder.watch()`;

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
    ? { title: "Escolha a interface certa", intro: "A CLI é o melhor ponto de partida para um tema. Use a API quando o Liquidify precisa fazer parte de uma ferramenta, uma automação ou um pipeline próprio.", cli: "CLI: para trabalhar no tema", api: "API: para integrar no build", cliItems: ["init cria a cópia do template example", "--watch recompila durante o desenvolvimento", "--config usa outro arquivo de configuração", "npm run preview abre uma development theme"], apiItems: ["makeLiquidifyBuilder recebe o mesmo config", "build() compila uma vez", "watch() mantém o processo ativo", "Eventos permitem exibir status na sua ferramenta"], lifecycle: "Ciclo recomendado", lifecycleItems: ["Edite TSX e CSS em src/app", "Rode liquidify --watch durante a criação", "Execute typecheck e Theme Check antes da entrega", "Publique com Shopify CLI ou CI"], events: "Eventos do builder", eventRows: [["build:start", "A compilação começou"], ["build:end", "Sections, snippets e bundles terminaram"], ["file:change", "Um arquivo observado mudou; use para status de watch."], ["build:failed", "Um rebuild iniciado pelo watch falhou."], ["error", "Uma chamada direta de build falhou."], ["dispose() / disposeSync()", "Fecha o watcher ao encerrar sua ferramenta."]], eventHeaders: ["Evento", "Quando usar"], commands: "Referência de comandos", commandHeaders: ["Comando", "Uso"], commandRows: [["npx liquidify init minha-loja --template example", "Copia o tema completo que esta documentação explica."], ["liquidify", "Compila uma vez usando liquidify.config.json."], ["liquidify --watch", "Observa componentsDir e dependências descobertas; recompila ao salvar."], ["liquidify --force", "Permite sobrescrever artefatos/arquivos existentes."], ["liquidify --config caminho/config.json", "Usa outro arquivo de configuração."], ["liquidify --quiet / --no-banner", "Reduz a saída em automações e CI."], ["liquidx / liquidx --watch", "Aliases compatíveis da CLI."]], config: "Opções de configuração", configHeaders: ["Opção", "Obrigatória", "Descrição"], configRows: [["componentsDir", "Sim", "Pasta que contém sections, snippets, ilhas e código compartilhado."], ["output", "Sim", "Pasta raiz do tema que recebe sections, snippets e bundles."], ["force", "Não", "Permite que o gerador substitua arquivos de saída existentes."], ["react.strictCsp", "Não", "Controla a estratégia CSP do runtime React; o padrão é true."], ["config path", "Não", "Passe --config quando o arquivo não estiver na raiz."]], automation: "Scripts de projeto e CI", automationText: "Mantenha build, tipos e Theme Check separados. Em CI, execute-os nessa ordem antes do deploy; isso separa erro de TSX, erro do compilador e erro de estrutura Shopify." }
    : { title: "Choose the right interface", intro: "The CLI is the best starting point for a theme. Use the API when Liquidify needs to be part of a tool, automation, or custom pipeline.", cli: "CLI: to work on the theme", api: "API: to integrate into a build", cliItems: ["init creates a copy of the example template", "--watch recompiles during development", "--config uses another configuration file", "npm run preview opens a development theme"], apiItems: ["makeLiquidifyBuilder accepts the same config", "build() compiles once", "watch() keeps the process alive", "Events let your tool report progress"], lifecycle: "Recommended lifecycle", lifecycleItems: ["Edit TSX and CSS in src/app", "Run liquidify --watch while building", "Run typecheck and Theme Check before delivery", "Publish with Shopify CLI or CI"], events: "Builder events", eventRows: [["build:start", "Compilation has started"], ["build:end", "Sections, snippets, and bundles are complete"], ["file:change", "A watched file changed; use it for watch status."], ["build:failed", "A rebuild started by watch has failed."], ["error", "A direct build call failed."], ["dispose() / disposeSync()", "Closes the watcher when your tool ends."]], eventHeaders: ["Event", "Use it when"], commands: "Command reference", commandHeaders: ["Command", "Purpose"], commandRows: [["npx liquidify init my-store --template example", "Copies the complete theme explained in this documentation."], ["liquidify", "Compiles once using liquidify.config.json."], ["liquidify --watch", "Watches componentsDir and discovered dependencies; recompiles on save."], ["liquidify --force", "Allows overwriting existing output/files."], ["liquidify --config path/config.json", "Uses another configuration file."], ["liquidify --quiet / --no-banner", "Reduces output in automation and CI."], ["liquidx / liquidx --watch", "Compatible CLI aliases."]], config: "Configuration options", configHeaders: ["Option", "Required", "Description"], configRows: [["componentsDir", "Yes", "Folder containing sections, snippets, islands, and shared code."], ["output", "Yes", "Theme root that receives sections, snippets, and bundles."], ["force", "No", "Lets the generator replace existing output files."], ["react.strictCsp", "No", "Controls the React runtime CSP strategy; default is true."], ["config path", "No", "Pass --config when the file is not at the root."]], automation: "Project scripts and CI", automationText: "Keep build, types, and Theme Check separate. In CI, run them in that order before deployment; it isolates TSX, compiler, and Shopify-structure failures." };
  return (
    <section className="wrap section api-guide">
      <h2>{copy.title}</h2><p className="section-sub">{copy.intro}</p>
      <div className="api-choice-grid"><article><h3>{copy.cli}</h3><ul>{copy.cliItems.map((item) => <li key={item}>{item}</li>)}</ul></article><article><h3>{copy.api}</h3><ul>{copy.apiItems.map((item) => <li key={item}>{item}</li>)}</ul></article></div>
      <div className="api-detail-grid"><div><h3>{copy.lifecycle}</h3><ol>{copy.lifecycleItems.map((item) => <li key={item}>{item}</li>)}</ol><h3>{copy.events}</h3><div className="table-wrap"><table className="table"><thead><tr>{copy.eventHeaders.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{copy.eventRows.map((row) => <tr key={row[0]}><td><code>{row[0]}</code></td><td>{row[1]}</td></tr>)}</tbody></table></div></div><div><Snippet title="makeLiquidifyBuilder" code={BUILDER} language="tsx" /></div></div>
      <div className="api-reference-grid">
        <div><h3>{copy.commands}</h3><div className="table-wrap"><table className="table"><thead><tr>{copy.commandHeaders.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{copy.commandRows.map((row) => <tr key={row[0]}><td><code>{row[0]}</code></td><td>{row[1]}</td></tr>)}</tbody></table></div></div>
        <div><h3>{copy.config}</h3><div className="table-wrap"><table className="table"><thead><tr>{copy.configHeaders.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{copy.configRows.map((row) => <tr key={row[0]}><td><code>{row[0]}</code></td><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody></table></div></div>
      </div>
      <div className="api-automation"><div><h3>{copy.automation}</h3><p>{copy.automationText}</p></div><Snippet code={CI_SCRIPT} language="json" /></div>
    </section>
  );
}
