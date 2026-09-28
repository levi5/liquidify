import { useEffect, useState } from "react";
import { _match, _Maybe } from "funcio";
import { useLocale } from "../../i18n.tsx";
import { toHref } from "../../lib/routes.ts";
import { APP_VERSION } from "../../lib/version.ts";
import Search from "../Search/index.tsx";
import styles from "./style.module.css";
import { cx } from "../../constants/cx.ts";

const STORAGE_KEY = "liquidify-docs-theme";

function storedTheme(): "light" | "dark" | null {
  return _Maybe.of(
    _match(window.localStorage.getItem(STORAGE_KEY))
      .with("light", () => "light" as const)
      .with("dark", () => "dark" as const)
      .exec(),
  ).getOrElse(null);
}

function systemTheme(): "light" | "dark" {
  return _match(window.matchMedia("(prefers-color-scheme: dark)").matches)
    .with(true, () => "dark" as const)
    .with(false, () => "light" as const)
    .exec();
}

function getInitialTheme(): "light" | "dark" {
  return _Maybe.of(
    _match(typeof window)
      .with("undefined", () => "light" as const)
      .exec(),
  ).getOrElse(_Maybe.of(storedTheme()).getOrElse(systemTheme()));
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
    { href: toHref("#/docs/start"), label: copy.links[0], route: "docs" },
    { href: toHref("#/api/cli"), label: copy.links[1], route: "api" },
    { href: toHref("#/example"), label: copy.links[2], route: "example" },
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
    <header className={styles.sidebar}>
      <div className={styles.sidebarInner}>
        <div>
          <a className={styles.brand} href={toHref("#/")} aria-label="Liquidify home">
            <img
              className={styles.brandLogo}
              src={`${import.meta.env.BASE_URL}assets/logo-mark.png`}
              alt=""
              width="26"
              height="26"
              fetchPriority="high"
              decoding="async"
            />
            Liquidify
          </a>
          <p className={styles.brandTag}>{copy.tagline}</p>
        </div>

        <Search />

        <div className={styles.sidebarControls}>
          <button className={cx('icon-btn', styles.themeToggle)} type="button" onClick={toggleTheme} aria-label={copy.theme} aria-pressed={theme === "dark"} title={copy.theme}>
            <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
          </button>
          <label className={styles.languageSelect}>
            <span className={styles.srOnly}>{copy.language}</span>
            <select value={locale} onChange={(event) => setLocale(event.target.value as "en" | "pt-BR")} aria-label={copy.language}>
              <option value="en">EN</option>
              <option value="pt-BR">PT-BR</option>
            </select>
          </label>
        </div>

        <nav className={styles.sideNav} aria-label={copy.nav}>
          {links.map((link) => (
            <a key={link.href} href={link.href} className={route === link.route ? styles.active : undefined}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.sidebarFoot}>
          <span className={styles.version}>v{APP_VERSION}</span>
          <a
            className={cx('btn', 'btn-small')}
            href="https://github.com/levi5/liquidify"
            target="_blank"
            rel="noopener"
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </header>
  );
}
