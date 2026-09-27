import { useLocale } from "../../i18n.tsx";
import "./style.css";

export default function Hero() {
  const { locale } = useLocale();
  const copy = locale === "pt-BR"
    ? {
        eyebrow: "Liquidify · TSX para Shopify Liquid",
        title: <>Documentação técnica<br />para temas <span>Shopify</span>.</>,
        description: <>O <strong>Liquidify</strong> compila <strong>TSX</strong> em <strong>sections, snippets e islands</strong> que o Shopify entende. Leia os guias, consulte a referência da CLI/API e reconstrua o tema <strong>example</strong> arquivo por arquivo.</>,
        action: "Começar pela documentação",
        secondary: "Reconstruir o example",
        install: "npx liquidify init minha-loja --template example",
        cards: [["#/docs/start", "Docs", "Instalação, modelo do tema, autoria TSX, Shopify e runtime."], ["#/api/cli", "API", "CLI, configuração, builder, eventos e primitivos TSX."], ["#/example/bootstrap", "Example", "10 fases com os arquivos reais do template e checkpoints."]],
      }
    : {
        eyebrow: "Liquidify · TSX to Shopify Liquid",
        title: <>Technical docs<br />for <span>Shopify</span> themes.</>,
        description: <> <strong>Liquidify</strong> compiles <strong>TSX</strong> into <strong>sections, snippets, and islands</strong> Shopify understands. Read the guides, check the CLI/API reference, and rebuild the <strong>example</strong> theme file by file.</>,
        action: "Start with the docs",
        secondary: "Rebuild example",
        install: "npx liquidify init my-store --template example",
        cards: [["#/docs/start", "Docs", "Setup, theme model, TSX authoring, Shopify, and runtime."], ["#/api/cli", "API", "CLI, configuration, builder, events, and TSX primitives."], ["#/example/bootstrap", "Example", "10 phases with real template files and checkpoints."]],
      };

  return (
    <section className="doc-hero">
      <div className="wrap">
        <p className="crumb">
          {copy.eyebrow}
        </p>
        <h1>{copy.title}</h1>
        <p className="lede">{copy.description}</p>
        <div className="hero-cta">
          <a className="btn btn-primary" href="#/docs/start">
            {copy.action} →
          </a>
          <a className="btn" href="#/example/bootstrap">
            {copy.secondary} →
          </a>
          <code className="install">{copy.install}</code>
        </div>
        <div className="shortcut-grid">
          {copy.cards.map(([href, title, text]) => (
            <a className="shortcut" key={href} href={href}>
              <strong>{title} →</strong>
              <span>{text}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
