import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import styles from "./style.module.css";

const HELP = `liquidify [options]
liquidify init [directory] [options]

--template, -t  Template to initialize (example)
--watch, -w     Watch components and discovered dependencies
--force, -f     Overwrite existing output/files
--config <path> Use an explicit config file
--no-banner     Skip startup banner
--quiet, -q     Minimal output; implies --no-banner
--version, -V   Show version
--help, -h      Show help`;

export default function CliReference() {
  const { locale } = useLocale();
  const copy = locale === "pt-BR" ? {
    title: "CLI: comandos e comportamento", commands: "Comandos e flags", intro: "A CLI resolve o config a partir do diretório atual, compila a árvore componentsDir e escreve na pasta output. Use init em uma pasta vazia para obter a base do example sem montar os arquivos à mão.", usage: "Uso", init: "Inicialização segura", initText: "init recusa sobrescrever caminhos existentes. Use --force apenas quando a substituição for intencional. Os nomes fashion, store e fashion-store são normalizados para o mesmo template example.", watch: "O que --watch observa", watchItems: ["A pasta componentsDir inteira.", "Imports e dependências descobertos pelo grafo de importação.", "Mudanças são agrupadas por 200ms antes de um novo build.", "Templates, layout, config e locales não são observados por si só; compile novamente após alterá-los."], failures: "Falhas e saída", failureItems: ["build() emite build:start e build:end quando tem sucesso.", "Uma falha direta propaga erro; em watch, o builder também emite build:failed.", "--quiet é adequado para CI porque remove o banner e reduz ruído.", "Use --config=path ou --config path para evitar depender de autodiscovery."]
  } : {
    title: "CLI: commands and behavior", commands: "Commands and flags", intro: "The CLI resolves configuration from the current directory, compiles the componentsDir tree, and writes to output. Use init in an empty directory to obtain the example foundation without assembling files by hand.", usage: "Usage", init: "Safe initialization", initText: "init refuses to overwrite existing paths. Use --force only when replacement is intentional. fashion, store, and fashion-store names normalize to the same example template.", watch: "What --watch observes", watchItems: ["The entire componentsDir folder.", "Imports and dependencies discovered by the import graph.", "Changes are grouped for 200ms before a new build.", "Templates, layout, config, and locales are not watched by themselves; build again after changing them."], failures: "Failures and output", failureItems: ["build() emits build:start and build:end on success.", "A direct failure throws; in watch, the builder also emits build:failed.", "--quiet is appropriate for CI because it removes banner and noise.", "Use --config=path or --config path instead of relying on autodiscovery."]
  };
  return <section className={`'wrap' 'section' styles.cliReference`}><h2>{copy.title}</h2><p className="section-sub">{copy.intro}</p><h3 id="commands">{copy.commands}</h3><div className={styles.cliGrid}><div><Snippet title={copy.usage} code={HELP} language="plain" /></div><article><h3>{copy.init}</h3><p>{copy.initText}</p><h3>{copy.watch}</h3><ul>{copy.watchItems.map((item) => <li key={item}>{item}</li>)}</ul><h3>{copy.failures}</h3><ul>{copy.failureItems.map((item) => <li key={item}>{item}</li>)}</ul></article></div></section>;
}
