import { useMemo, useState } from "react";
import { detectLanguage, highlight } from "./highlight";
import type { Lang } from "./highlight";
import "./style.css";

export default function CodeBlock({
  code,
  path,
  lang,
  loading,
  loadingLabel,
  showCopy,
  copyLabel,
  copiedLabel,
}: {
  code: string;
  path: string;
  lang?: Lang;
  loading?: boolean;
  loadingLabel?: string;
  showCopy?: boolean;
  copyLabel?: string;
  copiedLabel?: string;
}) {
  const tokens = useMemo(() => highlight(code, lang ?? detectLanguage(path)), [code, path, lang]);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const area = document.createElement("textarea");
      area.value = code;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="codeblock-wrap">
      {showCopy && code && (
        <button type="button" className="codeblock-copy icon-btn" onClick={copy} aria-live="polite">
          {copied ? (copiedLabel ?? "Copied ✓") : (copyLabel ?? "Copy")}
        </button>
      )}
      <pre className={loading ? "is-loading" : ""} tabIndex={0} aria-label={path}>
        <code>
          {loading && !code ? (
            loadingLabel ?? "Loading…"
          ) : tokens ? (
            tokens.map((token, index) =>
              token.cls ? (
                <span key={index} className={token.cls}>
                  {token.text}
                </span>
              ) : (
                <span key={index}>{token.text}</span>
              ),
            )
          ) : (
            code
          )}
        </code>
      </pre>
    </div>
  );
}
