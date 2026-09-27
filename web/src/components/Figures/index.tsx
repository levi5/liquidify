import { useLocale } from "../../i18n.tsx";
import "./style.css";

function FlowCaption({ text }: { text: string }) {
  return <p className="figure-caption">{text}</p>;
}

export function PipelineFigure() {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const steps = pt
    ? [
        { n: "1", title: "Você edita", files: ["src/app/**/*.tsx", "styles.css ao lado", "schemas + services"], note: "TSX com diretivas" },
        { n: "2", title: "Liquidify compila", files: ["lê diretivas", "gera schema", "bundles esbuild"], note: "npm run dev / build" },
        { n: "3", title: "Tema pronto", files: ["sections/*.liquid", "snippets/*.liquid", "assets/*.js"], note: "não editar à mão" },
        { n: "4", title: "Shopify serve", files: ["Theme Editor", "product / cart", "checkout"], note: "preview + publish" },
      ]
    : [
        { n: "1", title: "You edit", files: ["src/app/**/*.tsx", "colocated styles.css", "schemas + services"], note: "TSX with directives" },
        { n: "2", title: "Liquidify compiles", files: ["reads directives", "emits schema", "esbuild bundles"], note: "npm run dev / build" },
        { n: "3", title: "Theme ready", files: ["sections/*.liquid", "snippets/*.liquid", "assets/*.js"], note: "do not hand-edit" },
        { n: "4", title: "Shopify serves", files: ["Theme Editor", "product / cart", "checkout"], note: "preview + publish" },
      ];
  return (
    <figure className="figure">
      <div className="flow" role="img" aria-label={pt ? "Diagrama do pipeline de compilação" : "Compilation pipeline diagram"}>
        {steps.map((step) => (
          <div className="flow-node" key={step.n}>
            <span className="flow-n" aria-hidden="true">{step.n}</span>
            <strong>{step.title}</strong>
            <ul aria-hidden="true">
              {step.files.map((file) => (
                <li key={file}><code>{file}</code></li>
              ))}
            </ul>
            <em>{step.note}</em>
          </div>
        ))}
      </div>
      <FlowCaption text={pt ? "Figura 1 — Da edição TSX à loja no ar: só a etapa 1 é trabalho manual." : "Figure 1 — From TSX editing to live store: only step 1 is manual work."} />
    </figure>
  );
}

export function IslandFigure() {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  return (
    <figure className="figure">
      <div className="lanes" role="img" aria-label={pt ? "Diagrama do ciclo de uma ilha" : "Island lifecycle diagram"}>
        <div className="lane">
          <span className="lane-tag">{pt ? "Servidor (Liquid)" : "Server (Liquid)"}</span>
          <div className="lane-cards">
            <div className="lane-card"><strong>HTML</strong><span>{pt ? "preço, links e SEO indexável" : "price, links, indexable SEO"}</span></div>
            <div className="lane-card accent"><strong>&lt;react-island&gt;</strong><span>MiniCart + props JSON</span></div>
            <div className="lane-card"><strong>&lt;liquid-data&gt;</strong><span>{"{{ product | json }}"}</span></div>
          </div>
        </div>
        <div className="lane-arrow" aria-hidden="true">↓ runtime defer</div>
        <div className="lane">
          <span className="lane-tag">{pt ? "Navegador (Preact)" : "Browser (Preact)"}</span>
          <div className="lane-cards">
            <div className="lane-card"><strong>{pt ? "Hidrata" : "Hydrates"}</strong><span>{pt ? "lê props, monta contador" : "reads props, mounts counter"}</span></div>
            <div className="lane-card accent"><strong>{pt ? "Interativo" : "Interactive"}</strong><span>drawer · toast · Ajax</span></div>
            <div className="lane-card"><strong>Events</strong><span>cart:updated</span></div>
          </div>
        </div>
      </div>
      <FlowCaption text={pt ? "Figura 2 — O Liquid entrega HTML pronto; o JS só assume onde há estado." : "Figure 2 — Liquid delivers ready HTML; JS takes over only where state lives."} />
    </figure>
  );
}

export function EditorFigure() {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const sections = pt ? ["Hero", "Shelf · Novidades", "Categorias", "Newsletter"] : ["Hero", "Shelf · New in", "Categories", "Newsletter"];
  return (
    <figure className="figure">
      <div className="editor-mock" role="img" aria-label={pt ? "Ilustração do Theme Editor" : "Theme Editor illustration"}>
        <div className="editor-side" aria-hidden="true">
          <span className="editor-title">{pt ? "Seções da home" : "Home sections"}</span>
          {sections.map((section, i) => (
            <span className={`editor-row${i === 0 ? " active" : ""}`} key={section}>{section}</span>
          ))}
          <span className="editor-title">{pt ? "Ajustes da Hero" : "Hero settings"}</span>
          <span className="editor-field">{pt ? "Título…" : "Heading…"}</span>
          <span className="editor-field short">{pt ? "Botão: Explorar" : "Button: Shop now"}</span>
        </div>
        <div className="editor-view" aria-hidden="true">
          <span className="editor-eyebrow">● {pt ? "Nova coleção" : "New season"}</span>
          <strong>{pt ? "Vista o novo" : "Wear the new"}</strong>
          <span className="editor-btn">{pt ? "Explorar ↗" : "Shop now ↗"}</span>
        </div>
      </div>
      <FlowCaption text={pt ? "Figura 3 — O schema gerado vira painel editável: o lojista muda texto sem tocar em código." : "Figure 3 — The generated schema becomes an editable panel: merchants change copy without code."} />
    </figure>
  );
}
