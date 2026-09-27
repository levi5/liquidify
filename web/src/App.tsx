import { useEffect, useRef, useState } from "react";
import { useLocale } from "./i18n.tsx";
import { API_CHAPTERS, CHAPTERS, DOCS_CHAPTERS, t as tr } from "./docs/manifest.ts";
import SectionAnchors from "./docs/anchors.ts";
import Header from "./components/Header/index.tsx";
import Hero from "./components/Hero/index.tsx";
import StoreDemo from "./components/StoreDemo/index.tsx";
import Directives from "./components/Directives/index.tsx";
import Builtins from "./components/Builtins/index.tsx";
import CliApi from "./components/CliApi/index.tsx";
import DocsGuide from "./components/DocsGuide/index.tsx";
import ApiGuide from "./components/ApiGuide/index.tsx";
import AuthoringGuide from "./components/AuthoringGuide/index.tsx";
import GuideNav from "./components/GuideNav/index.tsx";
import GettingStarted from "./components/GettingStarted/index.tsx";
import ShopifyGuide from "./components/ShopifyGuide/index.tsx";
import RuntimeGuide from "./components/RuntimeGuide/index.tsx";
import AdvancedIslands from "./components/AdvancedIslands/index.tsx";
import BuildDeep from "./components/BuildDeep/index.tsx";
import CliReference from "./components/CliReference/index.tsx";
import ConfigReference from "./components/ConfigReference/index.tsx";
import SchemaReference from "./components/SchemaReference/index.tsx";
import RuntimeReference from "./components/RuntimeReference/index.tsx";
import FiltersReference from "./components/FiltersReference/index.tsx";
import ErrorsReference from "./components/ErrorsReference/index.tsx";
import PageToc from "./components/PageToc/index.tsx";
import PageNav from "./components/PageNav/index.tsx";
import Footer from "./components/Footer/index.tsx";

type Area = "home" | "docs" | "api" | "example";
type Route = { area: Area; chapter: string; anchor: string };

const DOCS_IDS = new Set(DOCS_CHAPTERS.map((chapter) => chapter.id));
const API_IDS = new Set(API_CHAPTERS.map((chapter) => chapter.id));

function getRoute(): Route {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const split = raw.indexOf("#");
  const path = split === -1 ? raw : raw.slice(0, split);
  const anchor = split === -1 ? "" : raw.slice(split + 1);
  const [area, chapter] = path.split("/");

  if (area === "docs") {
    return { area, chapter: DOCS_IDS.has(chapter) ? chapter : "start", anchor };
  }
  if (area === "api") {
    return { area, chapter: API_IDS.has(chapter) ? chapter : "cli", anchor };
  }
  if (area === "example") return { area, chapter: "", anchor };
  return { area: "home", chapter: "", anchor };
}

function PageIntro({ kicker, title, description }: { kicker: string; title: string; description: string }) {
  return (
    <header className="wrap page-intro">
      <p className="kicker">{kicker}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

function DocsPage({ chapter }: { chapter: string }) {
  switch (chapter) {
    case "start":
      return <GettingStarted />;
    case "theme-model":
      return <DocsGuide />;
    case "authoring":
      return (
        <>
          <AuthoringGuide />
          <Directives />
        </>
      );
    case "shopify":
      return (
        <>
          <ShopifyGuide />
          <Builtins />
        </>
      );
    case "runtime":
      return <RuntimeGuide />;
    case "islands":
      return <AdvancedIslands />;
    case "schema":
      return <SchemaReference />;
    default:
      return <GettingStarted />;
  }
}

function ApiPage({ chapter }: { chapter: string }) {
  switch (chapter) {
    case "config":
      return <ConfigReference />;
    case "builder":
      return <ApiGuide />;
    case "tsx":
      return <Builtins islands />;
    case "build":
      return <BuildDeep />;
    case "runtime":
      return <RuntimeReference />;
    case "filters":
      return <FiltersReference />;
    case "errors":
      return <ErrorsReference />;
    case "cli":
    default:
      return (
        <>
          <CliReference />
          <CliApi />
        </>
      );
  }
}

export default function App() {
  const [route, setRoute] = useState<Route>(getRoute);
  const { locale } = useLocale();
  const mainRef = useRef<HTMLElement>(null);
  const copy = locale === "pt-BR"
    ? {
        docs: ["Documentação", "Liquidify para temas Shopify", "Guias técnicos para criar sections, integrar dados Shopify e gerar Liquid a partir de TSX."],
        api: ["Referência", "API e linha de comando", "Assinaturas, opções, eventos e comportamento real da CLI, do builder e do runtime."],
        skip: "Ir para o conteúdo",
        nav: "Navegação",
      }
    : {
        docs: ["Documentation", "Liquidify for Shopify themes", "Technical guides for creating sections, integrating Shopify data, and generating Liquid from TSX."],
        api: ["Reference", "API and command line", "Signatures, options, events, and real CLI, builder, and runtime behavior."],
        skip: "Skip to content",
        nav: "Navigation",
      };

  useEffect(() => {
    const updateRoute = () => setRoute(getRoute());
    window.addEventListener("hashchange", updateRoute);
    return () => window.removeEventListener("hashchange", updateRoute);
  }, []);

  useEffect(() => {
    const target = route.anchor ? document.getElementById(route.anchor) : null;
    if (target) {
      target.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [route.area, route.chapter, route.anchor]);

  const chapters = route.area === "docs" ? DOCS_CHAPTERS : API_CHAPTERS;
  const active = CHAPTERS.find((chapter) => chapter.href === `#/${route.area}/${route.chapter}`);
  const showShell = route.area === "docs" || route.area === "api";
  const withToc = Boolean(active && active.sections.length > 0);

  return (
    <div className="layout">
      <a className="skip-link" href="#content">
        {copy.skip}
      </a>
      <Header route={route.area} />
      <div className="content">
        <main id="content" ref={mainRef} tabIndex={-1}>
          {route.area === "home" && <Hero />}
          {showShell && (
            <div className={`guide-shell${withToc ? " guide-shell-toc" : ""}`}>
              <GuideNav
                title={route.area === "docs" ? "Docs" : "API"}
                active={`#/${route.area}/${route.chapter}`}
                links={chapters.map((chapter) => ({ href: chapter.href, label: tr(chapter.title, locale) }))}
                ariaLabel={copy.nav}
              />
              <div className="guide-main">
                <SectionAnchors chapter={active} />
                {route.area === "docs" ? (
                  <>
                    <PageIntro kicker={copy.docs[0]} title={copy.docs[1]} description={copy.docs[2]} />
                    <DocsPage chapter={route.chapter} />
                  </>
                ) : (
                  <>
                    <PageIntro kicker={copy.api[0]} title={copy.api[1]} description={copy.api[2]} />
                    <ApiPage chapter={route.chapter} />
                  </>
                )}
                {active && <PageNav chapter={active} />}
              </div>
              {active && withToc && <PageToc chapter={active} />}
            </div>
          )}
          {route.area === "example" && <StoreDemo />}
        </main>
        <Footer />
      </div>
    </div>
  );
}
