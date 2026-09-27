import { useEffect, useState } from "react";
import { useLocale } from "../../i18n.tsx";
import Search from "../Search/index.tsx";
import "./style.css";

const STORAGE_KEY = "liquidify-docs-theme";

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function Header({ route }: { route: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { locale, setLocale } = useLocale();
  const copy = locale === "pt-BR"
    ? {
        links: ["Docs", "API", "Example"],
        theme: "Alternar tema",
        light: "Claro",
        dark: "Escuro",
        nav: "Navegação principal",
        language: "Idioma",
        tagline: "Shopify em TSX",
      }
    : {
        links: ["Docs", "API", "Example"],
        theme: "Toggle theme",
        light: "Light",
        dark: "Dark",
        nav: "Primary navigation",
        language: "Language",
        tagline: "Build Shopify in TSX",
      };
  const links = [
    { href: "#/docs", label: copy.links[0], route: "docs" },
    { href: "#/api", label: copy.links[1], route: "api" },
    { href: "#/example", label: copy.links[2], route: "example" },
  ];

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <div>
          <a className="brand" href="#/">
            <img
              className="brand-logo"
              src={`${import.meta.env.BASE_URL}assets/logo-mark.png`}
              alt="Liquidify"
              width="26"
              height="26"
            />
            Liquidify
          </a>
          <p className="brand-tag">{copy.tagline}</p>
        </div>

        <Search />

        <div className="sidebar-controls">
          <button className="icon-btn theme-toggle" type="button" onClick={toggleTheme} aria-label={copy.theme} aria-pressed={theme === "dark"} title={copy.theme}>
            <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
          </button>
          <label className="language-select">
            <span className="sr-only">{copy.language}</span>
            <select value={locale} onChange={(event) => setLocale(event.target.value as "en" | "pt-BR")} aria-label={copy.language}>
              <option value="en">EN</option>
              <option value="pt-BR">PT-BR</option>
            </select>
          </label>
        </div>

        <nav className="side-nav" aria-label={copy.nav}>
          {links.map((link) => (
            <a key={link.href} href={link.href} className={route === link.route ? "active" : undefined}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className="version">v1.1.0-alpha.4</span>
          <a
            className="btn btn-small"
            href="https://github.com/levi5/liquidify"
            target="_blank"
            rel="noopener"
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </aside>
  );
}
