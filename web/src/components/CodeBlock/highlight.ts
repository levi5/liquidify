import { _match, _Maybe } from "funcio";

export type Lang = "tsx" | "json" | "liquid" | "css" | "yaml" | "md" | "plain";

export type Token = { text: string; cls?: string };

const TS_EXTS = new Set(["ts", "tsx", "js", "jsx", "mjs", "cjs", "html"]);

export function detectLanguage(path: string): Lang {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return _Maybe.of(
    _match(ext)
      .with("json", () => "json" as Lang)
      .with("liquid", () => "liquid" as Lang)
      .with("css", () => "css" as Lang)
      .with("scss", () => "css" as Lang)
      .with("md", () => "md" as Lang)
      .with("yml", () => "yaml" as Lang)
      .with("yaml", () => "yaml" as Lang)
      .exec(),
  ).getOrElse(_match(TS_EXTS.has(ext)).with(true, () => "tsx" as Lang).with(false, () => "plain" as Lang).exec());
}

const TS_KEYWORDS =
  "import|export|from|default|const|let|var|function|return|if|else|for|of|in|while|do|new|typeof|as|type|interface|extends|implements|await|async|try|catch|finally|throw|switch|case|break|continue|true|false|null|undefined|this|void|delete|enum|satisfies|keyof|infer";

const LIQUID_KEYWORDS =
  "if|elsif|else|endif|unless|endunless|for|endfor|break|continue|in|assign|capture|endcapture|render|include|section|sections|schema|endschema|form|endform|paginate|endpaginate|liquid|echo|comment|endcomment|raw|endraw|style|endstyle|javascript|endjavascript|stylesheet|case|when|endcase|tablerow|endtablerow|limit|offset|reversed|with|as";

type Rule = { re: RegExp; cls?: string };

const RULES: Record<Lang, Rule[]> = {
  tsx: [
    { re: /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/, cls: "tok-com" },
    {
      re: /'(?:[^'\\\n]|\\.)*(?:'|$)|"(?:[^"\\\n]|\\.)*(?:"|$)|`(?:[^`\\]|\\.)*(?:`|$)/,
      cls: "tok-str",
    },
    { re: new RegExp("\\b(?:" + TS_KEYWORDS + ")\\b"), cls: "tok-kw" },
    { re: /\b\d[\d_]*(?:\.\d+)?\b/, cls: "tok-num" },
    { re: /<\/?[A-Za-z][\w$.]*(?=[\s/>])|\/?>/, cls: "tok-tag" },
    { re: /\{%-?|-?%\}|\{\{-?|-?\}\}/, cls: "tok-tag" },
    { re: /[A-Z][\w$]*/, cls: "tok-comp" },
    { re: /[a-zA-Z_$][\w$]*(?=\s*\()/, cls: "tok-fn" },
  ],
  json: [
    { re: /"(?:[^"\\]|\\.)*"(?=\s*:)/, cls: "tok-key" },
    { re: /"(?:[^"\\]|\\.)*"/, cls: "tok-str" },
    { re: /\b(?:true|false|null)\b/, cls: "tok-kw" },
    { re: /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/, cls: "tok-num" },
  ],
  liquid: [
    { re: /\{%\s*comment\s*%\}[\s\S]*?\{%\s*endcomment\s*%\}/, cls: "tok-com" },
    { re: /'(?:[^'\\]|\\.)*(?:'|$)|"(?:[^"\\]|\\.)*(?:"|$)/, cls: "tok-str" },
    { re: /\{%-?|-?%\}|\{\{-?|-?\}\}/, cls: "tok-tag" },
    { re: new RegExp("\\b(?:" + LIQUID_KEYWORDS + ")\\b"), cls: "tok-kw" },
    { re: /\|\s*[a-zA-Z_][\w]*/, cls: "tok-fn" },
    { re: /-?\b\d+(?:\.\d+)?\b/, cls: "tok-num" },
    { re: /<\/?[A-Za-z][^<>\n]*?\/?>/, cls: "tok-tag" },
  ],
  css: [
    { re: /\/\*[\s\S]*?(?:\*\/|$)/, cls: "tok-com" },
    { re: /'(?:[^'\\\n]|\\.)*(?:'|$)|"(?:[^"\\\n]|\\.)*(?:"|$)/, cls: "tok-str" },
    { re: /@[\w-]+/, cls: "tok-kw" },
    { re: /#[0-9a-fA-F]{3,8}\b/, cls: "tok-num" },
    { re: /\b\d[\d.]*(?:px|rem|em|%|vh|vw|s|ms|deg|fr)?\b/, cls: "tok-num" },
    { re: /[a-zA-Z-]+(?=\s*:)/, cls: "tok-attr" },
  ],
  yaml: [
    { re: /#[^\n]*/, cls: "tok-com" },
    { re: /'(?:[^'\\\n]|\\.)*(?:'|$)|"(?:[^"\\\n]|\\.)*(?:"|$)/, cls: "tok-str" },
    { re: /\b(?:true|false|null|yes|no|on|off)\b/, cls: "tok-kw" },
    { re: /-?\b\d+(?:\.\d+)?\b/, cls: "tok-num" },
    { re: /[\w./-]+(?=\s*:)/, cls: "tok-key" },
  ],
  md: [
    { re: /^#{1,6}\s+[^\n]*/, cls: "tok-kw" },
    { re: /`[^`\n]*`/, cls: "tok-str" },
    { re: /\[[^\]\n]*\]\([^)\n]*\)/, cls: "tok-tag" },
    { re: /\*\*[^*\n]+\*\*|__[^_\n]+__/, cls: "tok-fn" },
  ],
  plain: [{ re: /'(?:[^'\\\n]|\\.)*(?:'|$)|"(?:[^"\\\n]|\\.)*(?:"|$)/, cls: "tok-str" }],
};

type Compiled = { re: RegExp; cls?: string };

const CACHE = new Map<Lang, Compiled[]>();

function withSticky(re: RegExp): RegExp {
  const flags = re.flags.includes("y") ? re.flags : re.flags + "y";
  return new RegExp(re.source, flags);
}

function compiled(lang: Lang): Compiled[] {
  const hit = CACHE.get(lang);
  if (hit) return hit;
  const list = RULES[lang].map((rule) => ({ re: withSticky(rule.re), cls: rule.cls }));
  CACHE.set(lang, list);
  return list;
}

const MAX_HIGHLIGHT = 120_000;

export function highlight(code: string, lang: Lang): Token[] | null {
  if (code.length > MAX_HIGHLIGHT) return null;
  const rules = compiled(lang);
  const tokens: Token[] = [];
  let pos = 0;
  let plainStart = 0;

  while (pos < code.length) {
    let matched = false;
    for (const rule of rules) {
      rule.re.lastIndex = pos;
      const m = rule.re.exec(code);
      if (m && m[0]) {
        if (pos > plainStart) tokens.push({ text: code.slice(plainStart, pos) });
        tokens.push({ text: m[0], cls: rule.cls });
        pos += m[0].length;
        plainStart = pos;
        matched = true;
        break;
      }
    }
    if (!matched) pos += 1;
  }
  if (plainStart < code.length) tokens.push({ text: code.slice(plainStart) });
  return tokens;
}
