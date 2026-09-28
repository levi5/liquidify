import { useMemo, useState } from "react";
import { useLocale } from "../../i18n.tsx";
import CodeBlock from "../CodeBlock/index.tsx";
import styles from "./style.module.css";
import { cx } from "../../constants/cx.ts";

const STARTER = `"use snippets"

export function Badge({ label }: { label: string }) {
  return <span className="badge">{label}</span>
}`;

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
  const [tsx, setTsx] = useState(STARTER);
  const liquid = useMemo(() => naiveTsxToLiquid(tsx), [tsx]);
  const [copied, setCopied] = useState(false);

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
      <div className={styles.grid}>
        <label className={styles.field}>
          <span className="code-title">Badge.tsx</span>
          <textarea
            value={tsx}
            onChange={(e) => setTsx(e.target.value)}
            spellCheck={false}
            rows={12}
            aria-label={pt ? "Código TSX editável" : "Editable TSX code"}
          />
        </label>
        <div className={styles.out}>
          <span className="code-title">badge.liquid (preview)</span>
          <CodeBlock code={liquid} path="badge.liquid" />
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
