import { useMemo } from "react";
import { detectLanguage, highlight } from "./highlight";
import type { Lang } from "./highlight";
import "./style.css";

export default function CodeBlock({
  code,
  path,
  lang,
  loading,
  loadingLabel,
}: {
  code: string;
  path: string;
  lang?: Lang;
  loading?: boolean;
  loadingLabel?: string;
}) {
  const tokens = useMemo(() => highlight(code, lang ?? detectLanguage(path)), [code, path, lang]);

  return (
    <pre className={loading ? "is-loading" : ""}>
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
  );
}
