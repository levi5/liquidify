import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import "./style.css";

const DEFAULT = `export const DEFAULT_CONFIG = {
  componentsDir: 'src/components',
  output: 'liquidify',
  react: { strictCsp: true },
}`;

const EXAMPLE = `{
  "componentsDir": "src/app",
  "output": "."
}`;

export default function ConfigReference() {
  const { locale } = useLocale();
  const copy = locale === "pt-BR" ? {
    title: "Configuração do compilador", intro: "O arquivo liquidify.config.json é pequeno por design. Ele define a fronteira entre a fonte que você escreve e a raiz Shopify que receberá o resultado da compilação.", options: "Opções", headers: ["Campo", "Tipo", "Padrão", "Efeito"], rows: [["componentsDir", "string", "src/components", "Árvore que o scanner percorre para TSX, JS e dependências."], ["output", "string", "liquidify", "Raiz onde sections, snippets e assets são escritos."], ["react.strictCsp", "boolean", "true", "Estratégia CSP usada pelo runtime das ilhas React."], ["force", "boolean", "false", "Permite substituir arquivos de saída existentes."]], defaults: "Valores padrão da biblioteca", example: "Configuração usada pelo example", paths: "Como escolher paths", pathItems: ["Use componentsDir relativo à raiz onde você executa liquidify.", "Use output . quando o próprio projeto já é um tema Shopify completo, como o example.", "Use uma pasta separada como output apenas se for copiar/empacotar o tema depois.", "Não coloque componentes dentro de output: isso mistura fonte com artefatos gerados e torna o watch ambíguo."], csp: "Sobre strictCsp", cspText: "O padrão true existe para evitar depender de scripts inline executáveis. Deixe-o ativo no tema Shopify; altere apenas se você controlar a política de conteúdo e souber como o runtime será carregado." } : {
    title: "Compiler configuration", intro: "liquidify.config.json is intentionally small. It defines the boundary between source you write and the Shopify root that receives compilation output.", options: "Options", headers: ["Field", "Type", "Default", "Effect"], rows: [["componentsDir", "string", "src/components", "Tree scanned for TSX, JS, and dependencies."], ["output", "string", "liquidify", "Root where sections, snippets, and assets are written."], ["react.strictCsp", "boolean", "true", "CSP strategy used by React island runtime."], ["force", "boolean", "false", "Allows replacing existing output files."]], defaults: "Library defaults", example: "Configuration used by example", paths: "Choosing paths", pathItems: ["Use componentsDir relative to the root where you run liquidify.", "Use output . when the project itself is already a complete Shopify theme, like example.", "Use a separate output folder only when you copy/package the theme afterward.", "Do not put components inside output: that mixes source with generated artifacts and makes watch ambiguous."], csp: "About strictCsp", cspText: "The true default avoids depending on executable inline scripts. Keep it enabled in a Shopify theme; change it only if you control content policy and understand how runtime is loaded." };
  return <section className="wrap section config-reference"><h2>{copy.title}</h2><p className="section-sub">{copy.intro}</p><h3>{copy.options}</h3><div className="table-wrap"><table className="table"><thead><tr>{copy.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{copy.rows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}><code>{cell}</code></td>)}</tr>)}</tbody></table></div><div className="config-code-grid"><div><Snippet title={copy.defaults} code={DEFAULT} language="tsx" /></div><div><Snippet title={copy.example} code={EXAMPLE} language="json" /></div></div><div className="config-guidance"><article><h3>{copy.paths}</h3><ul>{copy.pathItems.map((item) => <li key={item}>{item}</li>)}</ul></article><article><h3>{copy.csp}</h3><p>{copy.cspText}</p></article></div></section>;
}
