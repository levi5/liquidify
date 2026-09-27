import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import "./style.css";

const DISPOSE_TS = `// Para o watcher e espera os observers fecharem:
await builder.dispose()

// Compat (CLI): fecha sem esperar.
builder.disposeSync()`;

const MANIFEST_JSON = `// .liquidify-manifest.json (na pasta output — não publique nem versione)
{
  "version": 1,
  "entries": {
    "src/app/components/Card/index.tsx": {
      "files": { "snippets/card.liquid": "<hash>" },
      "scripts": ["assets/card.js"]
    }
  }
}`;

export default function BuildDeep() {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const copy = pt
    ? {
        title: "Build & watch por dentro",
        intro: "O que o watch observa, o que o manifest garante e como imports, erros e limpeza se comportam. Direto de docs/compiler-build.md da lib.",
        incr: "Build incremental",
        incrItems: ["Após o primeiro build(), a instância reaproveita o runtime e recompila só o que mudou (conteúdo ou dependências).", "Rastreia imports/exports locais, import() dinâmico com path literal, require() literal e CSS/SCSS.", "Dependências fora de componentsDir também entram no watch.", "Mudança no registry pode exigir rebuild completo para atualizar referências e scripts.", "Cache só em memória: nova instância = build completo. Paths computados e node_modules não são seguidos.", "Tsconfigs com erro continuam observados — corrigir o arquivo dispara nova tentativa."],
        manifest: "Manifest e limpeza",
        manifestItems: ["Cada build registra gerados em .liquidify-manifest.json dentro do output. Não publique nem versione.", "Manifest inválido (JSON, hashes, paths) aborta o build com diagnóstico antes de tocar nas saídas.", "Componente removido/renomeado: próximo build apaga saídas antigas — só se o conteúdo ainda for o gerado (editado à mão preserva).", "Scripts globais e CSS compartilhado usam cercas liquidify:start/end: fora delas, preservado; dentro, não edite.", "Writes adiados: nada é escrito até todos compilarem e validarem. Erro preserva saídas anteriores (não é transação de FS)."],
        imports: "Resolução de imports",
        importRows: [["Relativos + extensões", ".ts/.tsx/.js/.jsx e index resolvidos junto com o parser e o extrator de schema."], ["Aliases", "paths e baseUrl do tsconfig mais próximo; extends relativo herdado."], ["Re-exports", "Named, default, export * e reexports nomeados; ciclos viram diagnóstico."], ["Estático apenas", "Objetos/arrays, identificadores, spreads, as const. Funções não executam; bundler JS não é substituído."], ["Fora do suporte", "extends por nome de pacote e namespace exports."]],
        importHeaders: ["Caso", "Comportamento"],
        output: "Contrato de saída",
        outputRows: [["sections/<nome>.liquid", "sections, com {% schema %} embutido"], ["snippets/<nome>.liquid", "snippets, sem {% schema %}"], ["blocks/<nome>.liquid", "blocks"], ["assets/<nome>.js", "scripts de use dom e use react"], ["assets/react-runtime.js", "runtime compartilhado, sempre escrito"], ["assets/global.css", "CSS agregado, dentro das cercas liquidify:start/end"], ["snippets/script-global.liquid", "scripts de use dom:global, nas mesmas cercas"], [".gitkeep", "criado em cada diretório gerado"]],
        outputHeaders: ["Caminho", "Conteúdo"],
        outputNote: "O nome do arquivo é o nome do componente em kebab-case: ProductCard vira product-card.liquid. Dois componentes que resultam no mesmo nome são erro, não overwrite.",
        diag: "Expressões e diagnósticos",
        diagItems: ["Strings mantêm pontuação; aritmética aninhada usa temporárias para preservar ordem.", "&& com || vira condições Liquid aninhadas.", ".find() só aceita arrow inline de 1 parâmetro simples com corpo de expressão ou return único.", "Erros de sintaxe e .find() trazem filePath:linha:coluna (1-based); a CLI imprime a posição.", "Nomes de componente em colisão e arquivos reservados (assets/react-runtime.js, snippets/script-global.liquid) viram erro, nunca overwrite silencioso."],
      }
    : {
        title: "Build & watch internals",
        intro: "What watch observes, what the manifest guarantees, and how imports, errors, and cleanup behave. Straight from the lib's docs/compiler-build.md.",
        incr: "Incremental build",
        incrItems: ["After the first build(), the instance reuses the runtime and recompiles only what changed (content or dependencies).", "Tracks local imports/exports, literal-path dynamic import(), literal require(), and CSS/SCSS.", "Dependencies outside componentsDir are watched too.", "Registry changes may require a full rebuild to refresh references and scripts.", "Memory-only cache: new instance = full build. Computed paths and node_modules are not followed.", "Broken tsconfigs stay watched — fixing the file retries compilation."],
        manifest: "Manifest and cleanup",
        manifestItems: ["Each build records outputs in .liquidify-manifest.json inside output. Do not publish or version it.", "Invalid manifest (JSON, hashes, paths) aborts the build with a diagnostic before touching outputs.", "Removed/renamed component: next build deletes old outputs — only if content still matches generated (hand-edited files preserved).", "Global scripts and shared CSS use liquidify:start/end fences: outside preserved, inside do not edit.", "Deferred writes: nothing is written until everything compiles and validates. Errors preserve previous outputs (not an FS transaction)."],
        imports: "Import resolution",
        importRows: [["Relatives + extensions", ".ts/.tsx/.js/.jsx and index resolved with parser and schema extractor."], ["Aliases", "paths and baseUrl from nearest tsconfig; inherited relative extends."], ["Re-exports", "Named, default, export *, named re-exports; cycles become diagnostics."], ["Static only", "Objects/arrays, identifiers, spreads, as const. Functions don't run; JS bundler not replaced."], ["Out of support", "Package-name extends and namespace exports."]],
        importHeaders: ["Case", "Behavior"],
        output: "Emitted output contract",
        outputRows: [["sections/<name>.liquid", "sections, with the {% schema %} inline"], ["snippets/<name>.liquid", "snippets, without {% schema %}"], ["blocks/<name>.liquid", "blocks"], ["assets/<name>.js", "scripts for use dom and use react"], ["assets/react-runtime.js", "shared runtime, always written"], ["assets/global.css", "aggregated CSS, inside the liquidify:start/end fences"], ["snippets/script-global.liquid", "use dom:global scripts, same fences"], [".gitkeep", "created in every generated directory"]],
        outputHeaders: ["Path", "Contents"],
        outputNote: "The filename is the kebab-cased component name: ProductCard becomes product-card.liquid. Two components that resolve to the same name are an error, never a silent overwrite.",
        diag: "Expressions and diagnostics",
        diagItems: ["Strings keep punctuation; nested arithmetic uses temporaries to preserve order.", "&& with || becomes nested Liquid conditions.", ".find() only accepts inline single-param arrows with expression or single-return bodies.", "Syntax and .find() errors carry filePath:line:column (1-based); the CLI prints positions.", "Colliding component names and reserved files (assets/react-runtime.js, snippets/script-global.liquid) error instead of silently overwriting."],
      };
  return (
    <section className="wrap section">
      <h2>{copy.title}</h2><p className="section-sub">{copy.intro}</p>
      <div className="docs-deep-grid" style={{ marginTop: "2.56rem" }}>
        <article className="docs-deep-card"><h3>{copy.incr}</h3><ul>{copy.incrItems.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <div style={{ display: "grid", gap: "1.6rem", alignContent: "start" }}>
          <Snippet code={DISPOSE_TS} language="tsx" />
          <Snippet code={MANIFEST_JSON} language="json" />
        </div>
      </div>
      <div className="docs-deep-grid">
        <article className="docs-deep-card"><h3>{copy.manifest}</h3><ul>{copy.manifestItems.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <div>
          <h3>{copy.imports}</h3>
          <div className="table-wrap"><table className="table"><thead><tr>{copy.importHeaders.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{copy.importRows.map((row) => <tr key={row[0]}><td><code>{row[0]}</code></td><td>{row[1]}</td></tr>)}</tbody></table></div>
        </div>
      </div>
      <div className="docs-deep-grid docs-deep-grid-bottom">
        <article className="docs-deep-card"><h3>{copy.diag}</h3><ul>{copy.diagItems.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <div>
          <h3>{copy.output}</h3>
          <div className="table-wrap"><table className="table"><thead><tr>{copy.outputHeaders.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{copy.outputRows.map((row) => <tr key={row[0]}><td><code>{row[0]}</code></td><td>{row[1]}</td></tr>)}</tbody></table></div>
          <p className="ref-note">{copy.outputNote}</p>
        </div>
      </div>
    </section>
  );
}
