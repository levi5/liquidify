import { useRef, useState, type KeyboardEvent } from "react";
import { _match, _Maybe } from "funcio";
import { useLocale } from "../../i18n.tsx";
import { toHref } from "../../lib/routes.ts";
import CodeBlock from "../CodeBlock/index.tsx";
import styles from "./style.module.css";
import { cx } from "../../constants/cx.ts";
import { HERO_TSX, HERO_LIQUID, HERO_COPY } from "../../cms/hero.ts";

export default function Hero() {
  const { locale } = useLocale();
  const [tab, setTab] = useState<"tsx" | "liquid">("tsx");
  const [copied, setCopied] = useState(false);
  const tsxTabRef = useRef<HTMLButtonElement>(null);
  const liquidTabRef = useRef<HTMLButtonElement>(null);
  const copy = HERO_COPY[locale];

  const installCmd = copy.install;

  async function copyInstall() {
    try {
      await navigator.clipboard.writeText(installCmd);
    } catch {
      const area = document.createElement("textarea");
      area.value = installCmd;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function focusTab(next: "tsx" | "liquid") {
    setTab(next);
    window.requestAnimationFrame(() => {
      _match(next)
        .with("tsx", () => tsxTabRef.current?.focus())
        .with("liquid", () => liquidTabRef.current?.focus())
        .exec();
    });
  }

  function onTabKeyDown(event: KeyboardEvent) {
    _Maybe.of(
      _match(event.key)
        .with("ArrowRight", () => focusTab("liquid"))
        .with("ArrowLeft", () => focusTab("tsx"))
        .exec(),
    ).getOrElse(undefined);
    _match(event.key === "ArrowRight" || event.key === "ArrowLeft")
      .with(true, () => event.preventDefault())
      .with(false, () => undefined)
      .exec();
  }

  return (
    <section className={styles.docHero}>
      <div className={cx('wrap', styles.heroLayout)}>
        <div className={styles.heroCopy}>
          <p className={styles.crumb}>
            <span className={styles.crumbDot} aria-hidden="true" /> {copy.eyebrow}
          </p>
          <h1>
            {copy.titleA}
            <br />
            <span>{copy.titleB}</span>
          </h1>
          <p className={styles.lede}>{copy.description}</p>
          <div className={styles.heroCta}>
            <a className={cx('btn', 'btn-primary')} href={toHref("#/docs/hello")}>
              {copy.tutorial} →
            </a>
            <a className="btn" href={toHref("#/docs/start")}>
              {copy.action} →
            </a>
            <a className="btn" href={toHref("#/example")}>
              {copy.secondary} →
            </a>
          </div>
          <div className={styles.installRow}>
            <code className={styles.install}>{installCmd}</code>
            <button type="button" className="icon-btn" onClick={copyInstall} aria-live="polite">
              {copied ? (locale === "pt-BR" ? "Copiado ✓" : "Copied ✓") : (locale === "pt-BR" ? "Copiar" : "Copy")}
            </button>
          </div>
          <ul className={styles.firstAnswers}>
            {copy.answers.map(([q, a, href]) => (
              <li key={q}>
                <a href={toHref(href)}>
                  <strong>{q}</strong>
                  <span>{a}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.heroDemo}>
          <div className={styles.demoWindow}>
            <div className={styles.demoBar}>
              <span className={styles.demoDots} aria-hidden="true">
                <i /> <i /> <i />
              </span>
              <span className={styles.demoLabel}>{copy.demoLabel}</span>
              <div className={styles.demoTabs} role="tablist" aria-label={copy.demoLabel} onKeyDown={onTabKeyDown}>
                <button
                  ref={tsxTabRef}
                  type="button"
                  role="tab"
                  id="hero-tab-tsx"
                  aria-selected={tab === "tsx"}
                  aria-controls="hero-panel"
                  tabIndex={tab === "tsx" ? 0 : -1}
                  className={tab === "tsx" ? styles.active : ""}
                  onClick={() => setTab("tsx")}
                >
                  ProductCard.tsx
                </button>
                <button
                  ref={liquidTabRef}
                  type="button"
                  role="tab"
                  id="hero-tab-liquid"
                  aria-selected={tab === "liquid"}
                  aria-controls="hero-panel"
                  tabIndex={tab === "liquid" ? 0 : -1}
                  className={tab === "liquid" ? styles.active : ""}
                  onClick={() => setTab("liquid")}
                >
                  card.liquid
                </button>
              </div>
            </div>
            <div id="hero-panel" role="tabpanel" aria-labelledby={tab === "tsx" ? "hero-tab-tsx" : "hero-tab-liquid"}>
            <CodeBlock
              code={tab === "tsx" ? HERO_TSX : HERO_LIQUID}
              path={tab === "tsx" ? "ProductCard.tsx" : "card.liquid"}
            />
            </div>
            <p className={styles.demoFoot}>{copy.demoFoot}</p>
          </div>
        </div>
      </div>

      <div className="wrap">
        <ol className={styles.heroPipeline}>
          {copy.pipeline.map(([n, title, text, href]) => (
            <li className={styles.heroPipelineStep} key={title}>
              <a href={toHref(href)}>
                <span className={styles.heroPipelineN} aria-hidden="true">{n}</span>
                <div>
                  <strong>{title} →</strong>
                  <span>{text}</span>
                </div>
              </a>
            </li>
          ))}
        </ol>
        <div className={styles.featureGrid}>
          {copy.features.map(([title, text, href]) => (
            <a className={styles.featureCard} key={title} href={toHref(href)}>
              <strong>{title} →</strong>
              <span>{text}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
