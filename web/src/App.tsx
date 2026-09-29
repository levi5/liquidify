import { Suspense, lazy, useEffect, useRef, useState, type ReactElement } from "react";
import { _match, _Maybe } from "funcio";
import { useLocale, type Locale } from "./i18n.tsx";
import { API_CHAPTERS, CHAPTERS, DOCS_CHAPTERS, t as tr, type Chapter } from "./docs/manifest.ts";
import SectionAnchors from "./docs/anchors.ts";
import { basePath, getRoute, navigate, toHref, type Route } from "./lib/routes.ts";
import Header from "./components/Header/index.tsx";
import Hero from "./components/Hero/index.tsx";
import GuideNav from "./components/GuideNav/index.tsx";
import PageToc from "./components/PageToc/index.tsx";
import PageNav from "./components/PageNav/index.tsx";
import BackToTop from "./components/BackToTop/index.tsx";
import Loading from "./components/Loading/index.tsx";
import Footer from "./components/Footer/index.tsx";

const StoreDemo = lazy(() => import("./components/StoreDemo/index.tsx"));
const Playground = lazy(() => import("./components/Playground/index.tsx"));
const NotFound = lazy(() => import("./components/NotFound/index.tsx"));
const Directives = lazy(() => import("./components/Directives/index.tsx"));
const Builtins = lazy(() => import("./components/Builtins/index.tsx"));
const CliApi = lazy(() => import("./components/CliApi/index.tsx"));
const DocsGuide = lazy(() => import("./components/DocsGuide/index.tsx"));
const ApiGuide = lazy(() => import("./components/ApiGuide/index.tsx"));
const AuthoringGuide = lazy(() => import("./components/AuthoringGuide/index.tsx"));
const GettingStarted = lazy(() => import("./components/GettingStarted/index.tsx"));
const HelloWorld = lazy(() => import("./components/HelloWorld/index.tsx"));
const Concepts = lazy(() => import("./components/Concepts/index.tsx"));
const Faq = lazy(() => import("./components/Faq/index.tsx"));
const ShopifyGuide = lazy(() => import("./components/ShopifyGuide/index.tsx"));
const RuntimeGuide = lazy(() => import("./components/RuntimeGuide/index.tsx"));
const AdvancedIslands = lazy(() => import("./components/AdvancedIslands/index.tsx"));
const BuildDeep = lazy(() => import("./components/BuildDeep/index.tsx"));
const CliReference = lazy(() => import("./components/CliReference/index.tsx"));
const ConfigReference = lazy(() => import("./components/ConfigReference/index.tsx"));
const SchemaReference = lazy(() => import("./components/SchemaReference/index.tsx"));
const RuntimeReference = lazy(() => import("./components/RuntimeReference/index.tsx"));
const FiltersReference = lazy(() => import("./components/FiltersReference/index.tsx"));
const ErrorsReference = lazy(() => import("./components/ErrorsReference/index.tsx"));
const PluginGuide = lazy(() => import("./components/PluginGuide/index.tsx"));
const TypesReference = lazy(() => import("./components/TypesReference/index.tsx"));

function PageIntro({ kicker, title, description }: { kicker: string; title: string; description: string }) {
  return (
    <header className="wrap page-intro">
      <p className="kicker">{kicker}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

const DOCS_PAGES: Record<string, () => ReactElement> = {
  hello: () => <HelloWorld />,
  concepts: () => <Concepts />,
  faq: () => <Faq />,
  start: () => <GettingStarted />,
  "theme-model": () => <DocsGuide />,
  authoring: () => (
    <>
      <AuthoringGuide />
      <Directives />
    </>
  ),
  shopify: () => (
    <>
      <ShopifyGuide />
      <Builtins />
    </>
  ),
  runtime: () => <RuntimeGuide />,
  islands: () => <AdvancedIslands />,
  schema: () => <SchemaReference />,
  types: () => <TypesReference />,
};

function DocsPage({ chapter }: { chapter: string }) {
  const Page = DOCS_PAGES[chapter] ?? DOCS_PAGES.start;
  return <Page />;
}

const API_PAGES: Record<string, (props: { islands: boolean }) => ReactElement> = {
  config: () => <ConfigReference />,
  builder: () => <ApiGuide />,
  tsx: ({ islands }) => <Builtins islands={islands} />,
  build: () => <BuildDeep />,
  runtime: () => <RuntimeReference />,
  filters: () => <FiltersReference />,
  errors: () => <ErrorsReference />,
  plugins: () => <PluginGuide />,
  cli: () => (
    <>
      <CliReference />
      <CliApi />
    </>
  ),
};

function ApiPage({ chapter, islands }: { chapter: string; islands: boolean }) {
  const Page = API_PAGES[chapter] ?? API_PAGES.cli;
  return <Page islands={islands} />;
}

function chapterMeta(route: Route, locale: Locale): { title: string; description: string } {
  const chapter = CHAPTERS.find((c) => c.area === route.area && c.id === route.chapter);
  return _Maybe
    .of(chapter)
    .map((c) => {
      const found = c as Chapter;
      return {
        title: `${tr(found.title, locale)} — Liquidify ${_match(route.area === "docs").with(true, () => "Docs").with(false, () => "API").exec()}`,
        description: tr(found.summary, locale),
      };
    })
    .getOrElse({ title: "Liquidify Docs", description: "Liquidify documentation." });
}

function routeMeta(route: Route, locale: Locale): { title: string; description: string } {
  const pt = locale === "pt-BR";
  return _Maybe.of(
    _match(route.area)
      .with("home", () => ({
        title: "Liquidify — Complete Shopify Store in TSX",
        description: pt
          ? "Escreva sections e snippets Shopify em TSX e compile para Liquid com schema, stylesheet e bundles gerados juntos."
          : "Write Shopify sections and snippets in TSX and compile to Liquid with schema, stylesheet, and bundles generated together.",
      }))
      .with("example", () => ({
        title: pt ? "Loja de exemplo — Liquidify" : "Example store — Liquidify",
        description: pt
          ? "Fashion store completa gerada pelo template example: 6 peças reais com TSX, Liquid e CSS."
          : "Complete fashion store from the example template: 6 real pieces with TSX, Liquid, and CSS.",
      }))
      .with("not-found", () => ({ title: "Not found — Liquidify", description: "Page not found." }))
      .exec(),
  ).getOrElse(chapterMeta(route, locale));
}

function ignoredClick(event: MouseEvent, link: HTMLAnchorElement | null): boolean {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    link === null ||
    link.target === "_blank" ||
    link.hasAttribute("download")
  );
}

function externalHref(href: string): boolean {
  return href === "" || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
}

function samePageAnchor(href: string): boolean {
  return href.startsWith("#") && !href.startsWith("#/");
}

function appRouteKey(href: string): string {
  const baseNoSlash = basePath().replace(/\/+$/, "");
  return _Maybe.of(
    _match(true)
      .with(href.startsWith("#/"), () => href.slice(2).split("#")[0].split("/")[0] ?? "")
      .with(
        href === baseNoSlash || href.startsWith(`${baseNoSlash}/`),
        () => href.slice(baseNoSlash.length).replace(/^\/+/, "").split("/")[0] ?? "",
      )
      .exec(),
  ).getOrElse("other");
}

function isAppRouteKey(key: string): boolean {
  return _Maybe.of(
    _match(key)
      .with("", () => true)
      .with("docs", () => true)
      .with("api", () => true)
      .with("example", () => true)
      .exec(),
  ).getOrElse(false);
}

function followAppLink(event: MouseEvent, link: HTMLAnchorElement): void {
  const href = link.getAttribute("href") ?? "";
  _match(externalHref(href) || samePageAnchor(href))
    .with(true, () => undefined)
    .with(false, () =>
      _match(isAppRouteKey(appRouteKey(href)))
        .with(true, () => {
          event.preventDefault();
          navigate(href);
        })
        .with(false, () => undefined)
        .exec(),
    )
    .exec();
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
    window.addEventListener("popstate", updateRoute);
    return () => window.removeEventListener("popstate", updateRoute);
  }, []);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const link = (event.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      _match(ignoredClick(event, link))
        .with(true, () => undefined)
        .with(false, () => followAppLink(event, link as HTMLAnchorElement))
        .exec();
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const meta = routeMeta(route, locale);
    document.title = meta.title;
    _Maybe.of(document.querySelector('meta[name="description"]')).map((desc) => (desc as Element).setAttribute("content", meta.description));
    const canonical =
      (document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null) ??
      (() => {
        const el = document.createElement("link");
        el.rel = "canonical";
        document.head.appendChild(el);
        return el;
      })();
    const path = window.location.pathname + window.location.search;
    canonical.href = `${window.location.origin}${path}`;
    const setMeta = (selector: string, content: string) => {
      _Maybe.of(document.querySelector(selector)).map((el) => (el as Element).setAttribute("content", content));
    };
    setMeta('meta[property="og:title"]', meta.title);
    setMeta('meta[name="twitter:title"]', meta.title);
    setMeta('meta[property="og:description"]', meta.description);
    setMeta('meta[name="twitter:description"]', meta.description);
    setMeta('meta[property="og:url"]', `${window.location.origin}${path}`);
  }, [route.area, route.chapter, locale]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = route.anchor ? document.getElementById(route.anchor) : null;
    _match(target === null)
      .with(true, () => window.scrollTo({ top: 0, behavior: "auto" }))
      .with(false, () => (target as HTMLElement).scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" }))
      .exec();
    _match(Boolean(route.anchor) && target !== null)
      .with(true, () => {
        const el = target as HTMLElement;
        const prev = el.getAttribute("tabindex");
        el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
        if (prev === null) el.removeAttribute("tabindex");
        else el.setAttribute("tabindex", prev);
      })
      .with(false, () => mainRef.current?.focus({ preventScroll: true }))
      .exec();
  }, [route.area, route.chapter, route.anchor]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const enhance = () => {
      if (cancelled) return;
      const root = document.querySelector(".guide-main") ?? document;
      const tables = root.querySelectorAll("table.table");
      tables.forEach((table) => {
        _match(table.querySelector("caption") === null)
          .with(true, () => table.setAttribute("role", "table"))
          .with(false, () => undefined)
          .exec();
        table.querySelectorAll("thead th").forEach((th) => {
          _match(th.hasAttribute("scope"))
            .with(true, () => undefined)
            .with(false, () => th.setAttribute("scope", "col"))
            .exec();
        });
      });
      attempts += 1;
      if (tables.length === 0 && attempts < 5) window.requestAnimationFrame(enhance);
    };
    const frame = window.requestAnimationFrame(enhance);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [route.area, route.chapter, locale]);

  const chapters = route.area === "docs" ? DOCS_CHAPTERS : API_CHAPTERS;
  const active = CHAPTERS.find((chapter) =>
    route.area === "docs" || route.area === "api"
      ? chapter.area === route.area && chapter.id === route.chapter
      : false,
  );
  const showShell = route.area === "docs" || route.area === "api";
  const withToc = Boolean(active && active.sections.length > 0);
  const islands = route.area === "api" && route.chapter === "tsx";

  return (
    <div className="layout">
      <a className="skip-link" href="#content">
        {copy.skip}
      </a>
      <Header route={route.area} chapter={route.chapter} />
      <div className="content">
        <main id="content" ref={mainRef} tabIndex={-1}>
          <Suspense fallback={<Loading />}>
            {route.area === "home" && (
              <>
                <Hero />
                <Playground />
              </>
            )}
            {showShell && (
              <div className={`guide-shell${withToc ? " guide-shell-toc" : ""}`}>
                <GuideNav
                  title={route.area === "docs" ? "Docs" : "API"}
                  active={active ? toHref(active.href) : ""}
                  links={chapters.map((chapter) => ({ href: toHref(chapter.href), label: tr(chapter.title, locale) }))}
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
                      <ApiPage chapter={route.chapter} islands={islands} />
                    </>
                  )}
                  {active && <PageNav chapter={active} />}
                </div>
                {active && withToc && <PageToc chapter={active} />}
              </div>
            )}
            {route.area === "example" && <StoreDemo />}
            {route.area === "not-found" && <NotFound path={route.chapter} />}
          </Suspense>
        </main>
        <BackToTop label={locale === "pt-BR" ? "Voltar ao topo" : "Back to top"} />
        <Footer />
      </div>
    </div>
  );
}
