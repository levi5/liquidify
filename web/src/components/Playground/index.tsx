import { useMemo, useState } from "react";
import { useLocale } from "../../i18n.tsx";
import CodeBlock from "../CodeBlock/index.tsx";
import Callout from "../Callout/index.tsx";
import { toHref } from "../../lib/routes.ts";
import styles from "./style.module.css";
import { cx } from "../../constants/cx.ts";

type PresetId = "snippets" | "sections" | "react";

const PRESETS: Record<PresetId, { file: string; out: string; code: string }> = {
  snippets: {
    file: "Badge.tsx",
    out: "badge.liquid (preview)",
    code: `"use snippets"

export function Badge({ label }: { label: string }) {
  return <span className="badge">{label}</span>
}`,
  },
  sections: {
    file: "Hello.tsx",
    out: "hello.liquid (preview)",
    code: `"use sections"

export const schema = {
  name: "Hello",
  settings: [
    { type: "text", id: "heading", label: "Heading" }
  ]
}

export default function Hello() {
  return (
    <section className="hello">
      <h2>{section.settings.heading}</h2>
    </section>
  )
}`,
  },
  react: {
    file: "Counter.tsx",
    out: "counter.liquid (preview)",
    code: `"use react"

export default function Counter() {
  return (
    <react-island component="Counter">
      <button data-liquidify-on-click="increment">+</button>
    </react-island>
  )
}`,
  },
};

function naiveTsxToLiquid(tsx: string): string {
  let out = tsx;
  out = out.replace(/"use (snippets|react|dom|script)";?/g, (_m, d) => `{/* "${d}" removed by Liquidify */}`);
  out = out.replace(/className=/g, "class=");
  out = out.replace(/\{([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)\s*\|\s*([a-zA-Z_]+)\}/g, "{{ $1 | $2 }}");
  out = out.replace(/\{([a-zA-Z_$][\w$.]*)\}/g, "{{ $1 }}");
  out = out.replace(/export\s+(default\s+)?function\s+(\w+)/g, "{% snippet $2 %}");
  out = out.replace(/export\s+function\s+(\w+)/g, "{% snippet $1 %}");
  return `<* Liquid preview (simplified, real output comes from the CLI) *>\n${out}`;
}

export default function Playground() {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const [preset, setPreset] = useState<PresetId>("snippets");
  const [tsx, setTsx] = useState(PRESETS.snippets.code);
  const liquid = useMemo(() => naiveTsxToLiquid(tsx), [tsx]);
  const [copied, setCopied] = useState(false);

  function pick(next: PresetId) {
    setPreset(next);
    setTsx(PRESETS[next].code);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(liquid);
    } catch {
      const area = document.createElement("textarea");
      area.value = liquid;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className={cx("wrap", "section", styles.play)} aria-labelledby="playground-title">
      <p className="kicker">{pt ? "Playground" : "Playground"}</p>
      <h2 id="playground-title">{pt ? "Teste a ideia no browser" : "Try the idea in the browser"}</h2>
      <p className="section-sub">
        {pt
          ? "Edite o TSX à esquerda e veja uma prévia simplificada do Liquid à direita. O output real (schema, stylesheet, bundles) é gerado pela CLI."
          : "Edit the TSX on the left and see a simplified Liquid preview on the right. Real output (schema, stylesheet, bundles) comes from the CLI."}
      </p>
      <Callout>
        <strong>{pt ? "Isto é uma simulação, não o compilador." : "This is a mock, not the compiler."}</strong>
        <p>
          {pt ? "A conversão aqui é aproximada. " : "The conversion here is approximate. "}
          <a href={toHref("#/docs/hello#read-output")}>{pt ? "Ver output real de uma compilação →" : "See real output from a compile →"}</a>
        </p>
      </Callout>
      <div className={styles.presetRow} role="tablist" aria-label={pt ? "Exemplos por diretiva" : "Examples per directive"}>
        {(Object.keys(PRESETS) as PresetId[]).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={preset === id}
            className={preset === id ? styles.active : ""}
            onClick={() => pick(id)}
          >
            "{`use ${id}`}"
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span className="code-title">{PRESETS[preset].file}</span>
          <textarea
            value={tsx}
            onChange={(e) => setTsx(e.target.value)}
            spellCheck={false}
            rows={12}
            aria-label={pt ? "Código TSX editável" : "Editable TSX code"}
          />
        </label>
        <div className={styles.out}>
          <span className="code-title">{PRESETS[preset].out}</span>
          <CodeBlock code={liquid} path="preview.liquid" />
          <div className="row">
            <button type="button" className="icon-btn" onClick={copy}>
              {copied ? (pt ? "Copiado ✓" : "Copied ✓") : (pt ? "Copiar Liquid" : "Copy Liquid")}
            </button>
            <a className={cx("btn", "btn-small")} href="https://github.com/levi5/liquidify" target="_blank" rel="noopener">
              {pt ? "Rodar a CLI de verdade ↗" : "Run the real CLI ↗"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
