import { useEffect, useState } from "react";
import { useLocale } from "./i18n.tsx";
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
import CliReference from "./components/CliReference/index.tsx";
import ConfigReference from "./components/ConfigReference/index.tsx";
import Footer from "./components/Footer/index.tsx";

type Area = "home" | "docs" | "api" | "example";
type Route = { area: Area; chapter: string };

function getRoute(): Route {
  const [area, chapter] = window.location.hash.replace(/^#\/?/, "").split("/");
  if (area === "docs") return { area, chapter: chapter || "start" };
  if (area === "api") return { area, chapter: chapter || "cli" };
  if (area === "example") return { area, chapter: chapter || "bootstrap" };
  return { area: "home", chapter: "" };
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

export default function App() {
  const [route, setRoute] = useState<Route>(getRoute);
  const { locale } = useLocale();
  const copy = locale === "pt-BR"
    ? {
        docs: ["Documentação", "Liquidify para temas Shopify", "Guias técnicos para criar sections, integrar dados Shopify e gerar Liquid a partir de TSX."],
        api: ["Referência", "API e linha de comando", "Assinaturas, opções, eventos e comportamento real da CLI e do builder."],
        example: ["Implementação", "Reconstrua o tema example", "Siga cada fase, copie os arquivos reais e valide o mesmo tema em uma development store."],
        docsNav: [["#/docs/start", "Começar"], ["#/docs/theme-model", "Modelo do tema"], ["#/docs/authoring", "Escrever TSX"], ["#/docs/shopify", "Shopify e Theme Editor"], ["#/docs/runtime", "Islands e runtime"]],
        apiNav: [["#/api/cli", "CLI"], ["#/api/config", "Configuração"], ["#/api/builder", "Builder e eventos"], ["#/api/tsx", "Primitivos TSX"]],
        exampleNav: [["bootstrap", "Bootstrap"], ["foundation", "Base Shopify"], ["brand", "Marca e idiomas"], ["shell", "Shell global"], ["primitives", "Primitivos"], ["home", "Home"], ["catalog", "Coleção e busca"], ["product", "Produto"], ["islands", "Carrinho e ilhas"], ["verify", "Validar"]],
      }
    : {
        docs: ["Documentation", "Liquidify for Shopify themes", "Technical guides for creating sections, integrating Shopify data, and generating Liquid from TSX."],
        api: ["Reference", "API and command line", "Signatures, options, events, and real CLI and builder behavior."],
        example: ["Implementation", "Rebuild the example theme", "Follow every phase, copy actual files, and validate the same theme in a development store."],
        docsNav: [["#/docs/start", "Start here"], ["#/docs/theme-model", "Theme model"], ["#/docs/authoring", "Writing TSX"], ["#/docs/shopify", "Shopify and Theme Editor"], ["#/docs/runtime", "Islands and runtime"]],
        apiNav: [["#/api/cli", "CLI"], ["#/api/config", "Configuration"], ["#/api/builder", "Builder and events"], ["#/api/tsx", "TSX primitives"]],
        exampleNav: [["bootstrap", "Bootstrap"], ["foundation", "Shopify foundation"], ["brand", "Brand and languages"], ["shell", "Global shell"], ["primitives", "Primitives"], ["home", "Home"], ["catalog", "Collection and search"], ["product", "Product"], ["islands", "Cart and islands"], ["verify", "Verify"]],
      };

  useEffect(() => {
    const updateRoute = () => setRoute(getRoute());
    window.addEventListener("hashchange", updateRoute);
    return () => window.removeEventListener("hashchange", updateRoute);
  }, []);

  return (
    <div className="layout">
      <Header route={route.area} />
      <div className="content">
        <main>
          {route.area === "home" && <Hero />}
          {route.area === "docs" && <div className="guide-shell"><GuideNav title="Docs" active={`#/docs/${route.chapter}`} links={copy.docsNav.map(([href, label]) => ({ href, label }))} /><div className="guide-main"><PageIntro kicker={copy.docs[0]} title={copy.docs[1]} description={copy.docs[2]} />{route.chapter === "start" && <GettingStarted />}{route.chapter === "theme-model" && <DocsGuide />}{route.chapter === "authoring" && <><AuthoringGuide /><Directives /></>}{route.chapter === "shopify" && <><ShopifyGuide /><Builtins /></>}{route.chapter === "runtime" && <RuntimeGuide />}</div></div>}
          {route.area === "api" && <div className="guide-shell"><GuideNav title="API" active={`#/api/${route.chapter}`} links={copy.apiNav.map(([href, label]) => ({ href, label }))} /><div className="guide-main"><PageIntro kicker={copy.api[0]} title={copy.api[1]} description={copy.api[2]} />{route.chapter === "cli" && <><CliReference /><CliApi /></>}{route.chapter === "config" && <ConfigReference />}{route.chapter === "builder" && <ApiGuide />}{route.chapter === "tsx" && <Builtins />}</div></div>}
          {route.area === "example" && <div className="guide-shell"><GuideNav title="Example" active={`#/example/${route.chapter}`} links={copy.exampleNav.map(([chapter, label]) => ({ href: `#/example/${chapter}`, label }))} /><div className="guide-main"><PageIntro kicker={copy.example[0]} title={copy.example[1]} description={copy.example[2]} /><StoreDemo chapter={route.chapter} /></div></div>}
        </main>
        <Footer />
      </div>
    </div>
  );
}
