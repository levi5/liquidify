import { useLocale } from "../../i18n.tsx";
import { PipelineFigure } from "../Figures/index.tsx";
import { toHref } from "../../lib/routes.ts";
import styles from "./style.module.css";
import { cx } from "../../constants/cx.ts";

export default function Concepts() {
  const { locale } = useLocale();
  const copy = locale === "pt-BR" ? {
    title: "Cinco ideias explicam cada arquivo",
    intro: "Tudo na lib deriva de uma diretiva no topo do arquivo, dos dados que ela recebe e de onde o resultado roda: servidor Shopify ou navegador.",
    modes: "Uma diretiva, um resultado",
    modesText: "A primeira linha do arquivo escolhe o modo. Ela decide quais arquivos o compilador emite e se existe JavaScript no navegador.",
    modeHeaders: ["Diretiva", "O compilador emite", "JS no navegador"],
    modeRows: [
      ["\"use snippets\"", "snippets/*.liquid, sem schema", "Nenhum"],
      ["\"use sections\"", "sections/*.liquid + {% schema %}", "Nenhum"],
      ["\"use blocks\"", "blocks/*.liquid para o editor", "Nenhum"],
      ["\"use react\"", "Liquid + <react-island> com props", "assets/*.js (só a ilha)"],
      ["\"use dom\"", "Liquid + script do componente", "assets/*.js (vanilla)"],
      ["\"use script\"", "Nada de Liquid", "assets/*.js (só o script)"],
    ],
    glossary: "Glossário",
    terms: [
      ["Section", "Bloco de página que o lojista arrasta e configura no Theme Editor. Vira sections/*.liquid com {% schema %}."],
      ["Snippet", "Pedaço reutilizável de Liquid, sem painel no editor. Vira snippets/*.liquid via {% render %}."],
      ["Block", "Sub-bloco dentro de uma section no editor. Vira blocks/*.liquid."],
      ["Schema", "JSON dentro de {% schema %} que descreve settings, blocks e presets. É o que desenha o painel do Theme Editor."],
      ["Template", "JSON em templates/ que diz quais sections compõem cada página e em que ordem."],
      ["Island", "Componente \"use react\" que hidrata no navegador. O HTML indexável vem do Liquid; o JS assume só a parte interativa."],
      ["liquid-data", "Tag que serializa dados do Liquid em JSON para a ilha ler sem new Function (CSP estrito)."],
      ["react-island", "Elemento host emitido pelo compilador onde a ilha monta no navegador."],
    ],
    pipeline: "Do TSX à vitrine",
    pipelineText: "O caminho completo: você edita TSX em src/, o compilador emite Liquid + schema + bundles, e a loja serve HTML do servidor com ilhas hidratando no navegador.",
    more: "Ver o ciclo na prática",
  } : {
    title: "Five ideas explain every file",
    intro: "Everything in the lib derives from one directive at the top of the file, the data it receives, and where the result runs: Shopify servers or the browser.",
    modes: "One directive, one output",
    modesText: "The first line of the file picks the mode. It decides which files the compiler emits and whether any JavaScript runs in the browser.",
    modeHeaders: ["Directive", "The compiler emits", "Browser JS"],
    modeRows: [
      ["\"use snippets\"", "snippets/*.liquid, no schema", "None"],
      ["\"use sections\"", "sections/*.liquid + {% schema %}", "None"],
      ["\"use blocks\"", "blocks/*.liquid for the editor", "None"],
      ["\"use react\"", "Liquid + <react-island> with props", "assets/*.js (the island only)"],
      ["\"use dom\"", "Liquid + component script", "assets/*.js (vanilla)"],
      ["\"use script\"", "No Liquid at all", "assets/*.js (script only)"],
    ],
    glossary: "Glossary",
    terms: [
      ["Section", "Page block the merchant drags and configures in the Theme Editor. Becomes sections/*.liquid with {% schema %}."],
      ["Snippet", "Reusable Liquid chunk with no editor panel. Becomes snippets/*.liquid via {% render %}."],
      ["Block", "Sub-block inside a section in the editor. Becomes blocks/*.liquid."],
      ["Schema", "JSON inside {% schema %} describing settings, blocks, and presets. It draws the Theme Editor panel."],
      ["Template", "JSON in templates/ saying which sections compose each page and in which order."],
      ["Island", "A \"use react\" component that hydrates in the browser. Indexable HTML comes from Liquid; JS takes over only the interactive part."],
      ["liquid-data", "Tag serializing Liquid data as JSON for the island to read without new Function (strict CSP)."],
      ["react-island", "Host element emitted by the compiler where the island mounts in the browser."],
    ],
    pipeline: "From TSX to storefront",
    pipelineText: "The full path: you edit TSX in src/, the compiler emits Liquid + schema + bundles, and the store serves server HTML with islands hydrating in the browser.",
    more: "See the loop in practice",
  };
  return (
    <section className={cx("wrap", "section", styles.concepts)}>
      <h2>{copy.title}</h2>
      <p className="section-sub">{copy.intro}</p>
      <h3>{copy.modes}</h3>
      <p className="section-sub">{copy.modesText}</p>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {copy.modeHeaders.map((header) => (
                <th key={header} scope="col">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {copy.modeRows.map(([directive, output, js]) => (
              <tr key={directive}>
                <td><code>{directive}</code></td>
                <td>{output}</td>
                <td>{js}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>{copy.glossary}</h3>
      <div className="table-wrap">
        <table className="table">
          <tbody>
            {copy.terms.map(([term, meaning]) => (
              <tr key={term}>
                <td><strong>{term}</strong></td>
                <td>{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>{copy.pipeline}</h3>
      <p className="section-sub">{copy.pipelineText}</p>
      <PipelineFigure />
      <div className="row">
        <a className={cx("btn", "btn-primary")} href={toHref("#/docs/hello")}>{copy.more} →</a>
      </div>
    </section>
  );
}
