import { useState } from "react";
import { useLocale } from "../../i18n.tsx";
import CodeBlock from "../CodeBlock/index.tsx";
import type { Lang } from "../CodeBlock/highlight";
import "./style.css";

export default function Snippet({
  code,
  title,
  language,
}: {
  code: string;
  title?: string;
  language?: Lang;
}) {
  const { locale } = useLocale();
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
    <div className="snippet">
      <div className="snippet-head">
        <span>{title ?? (locale === "pt-BR" ? "Código" : "Code")}</span>
        <button type="button" onClick={copy}>
          {copied
            ? locale === "pt-BR"
              ? "Copiado"
              : "Copied"
            : locale === "pt-BR"
              ? "Copiar"
              : "Copy"}
        </button>
      </div>
      <CodeBlock code={code} path="snippet.txt" lang={language ?? "plain"} />
    </div>
  );
}
