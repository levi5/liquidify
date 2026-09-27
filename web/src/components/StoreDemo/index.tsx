import { useEffect, useState } from "react";
import { useLocale } from "../../i18n.tsx";
import CodeBlock from "../CodeBlock/index.tsx";
import "./style.css";

type Catalog = {
  template: string;
  version: string;
  files: Array<{ path: string; text: boolean }>;
  generatedBySource: Record<string, string[]>;
};

const STAGES = [
  ["package.json", "liquidify.config.json", "tsconfig.json", ".shopifyignore", ".theme-check.yml"],
  ["layout/theme.liquid", "config/settings_schema.json", "config/settings_data.json", "assets/global.css", "snippets/css-variables.liquid", "snippets/script-global.liquid"],
  ["locales/en.default.json", "locales/pt-BR.json", "locales/en.default.schema.json", "locales/pt-BR.schema.json", "assets/liquidify-women.jpg", "assets/liquidify-men.jpg", "assets/liquidify-bag.jpg", "assets/liquidify-editorial.jpg"],
  ["src/app/sections/Header/index.tsx", "src/app/sections/Header/User/index.tsx", "src/app/components/Bar/Top/index.tsx", "src/app/components/Menu/Desktop/index.tsx", "src/app/components/Menu/Mobile/index.tsx", "src/app/sections/Newsletter/index.tsx", "src/app/sections/Footer/index.tsx", "sections/header-group.json", "sections/footer-group.json"],
  ["src/app/components/Card/index.tsx", "src/app/components/Badges/index.tsx", "src/app/components/Button/Primary/index.tsx", "src/app/components/Icon/index.tsx", "src/app/components/Swiper/Root/index.tsx", "src/app/components/Swiper/Slide/index.tsx", "src/app/components/Swiper/Arrow/index.tsx"],
  ["src/app/sections/Home/Hero/index.tsx", "src/app/sections/Home/Categories/index.tsx", "src/app/sections/Home/InfoBanner/index.tsx", "src/app/components/Shelf/index.tsx", "templates/index.json"],
  ["src/app/sections/MainCollection/index.tsx", "src/app/sections/MainSearch/index.tsx", "src/app/components/Catalog/index.tsx", "src/app/components/Filter/Collection/index.tsx", "src/app/components/Filter/Drawer/index.tsx", "src/app/components/Search/Drawer.tsx", "templates/collection.json", "templates/search.json"],
  ["src/app/sections/ProductInfo/index.tsx", "src/app/components/Product/Preview/index.tsx", "src/app/components/Product/Thumbnails/index.tsx", "src/app/components/Selector/index.tsx", "src/app/components/Selector/Grid/index.tsx", "src/app/components/Quantity/Selector/index.tsx", "src/app/context/Product/index.tsx", "templates/product.json"],
  ["src/app/components/MiniCart/index.tsx", "src/app/components/Drawer/index.ts", "src/app/components/Portal/index.tsx", "src/app/components/Toast/index.tsx", "src/app/services/Cart/cart.service.ts", "src/app/scripts/theme.ts", "templates/cart.json", "templates/gift_card.liquid"],
  ["package.json"],
];

const STAGE_CHAPTERS = ["bootstrap", "foundation", "brand", "shell", "primitives", "home", "catalog", "product", "islands", "verify"];

const VERIFY_COMMANDS = `npm run build
npm run typecheck
npm run check
npm run preview -- --store your-store.myshopify.com`;

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function sourceCandidates(path: string) {
  const encoded = `example-source/${encodePath(path)}`;
  const base = import.meta.env.BASE_URL || "/";
  const normBase = base.endsWith("/") ? base : `${base}/`;
  const urls = [`${normBase}${encoded}`];
  // `vite dev` serves `public/` at the server root, while the production
  // build lives under BASE_URL (GitHub Pages). Try both.
  if (normBase !== "/") urls.push(`/${encoded}`);
  return urls;
}

async function fetchFirstOk(
  urls: string[],
  signal: AbortSignal,
  path: string,
): Promise<{ response: Response; url: string }> {
  const tried: string[] = [];
  for (const url of urls) {
    tried.push(url);
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) continue;
      const contentType = response.headers.get("content-type") ?? "";
      // Static hosts and vite dev/preview answer unknown paths with the SPA
      // fallback page (index.html, HTTP 200, text/html). Never mistake that
      // page for the requested file.
      if (contentType.includes("text/html") && !path.endsWith(".html")) continue;
      return { response, url };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
    }
  }
  throw new Error(`File not found (tried: ${tried.join(", ")})`);
}

function isImagePath(path: string) {
  return /\.(jpg|jpeg|png|webp|gif|svg|ico)$/i.test(path);
}

function looksLikeText(path: string) {
  return !/\.(jpg|jpeg|png|webp|gif|ico|woff2?|ttf|eot|mp4|webm|zip)$/i.test(path);
}

export default function StoreDemo({ chapter }: { chapter: string }) {
  const { locale } = useLocale();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [stage, setStage] = useState(() => Math.max(0, STAGE_CHAPTERS.indexOf(chapter)));
  const [sourceFile, setSourceFile] = useState(STAGES[0][0]);
  const [generatedFile, setGeneratedFile] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<"file" | "path" | "cmds" | null>(null);
  const copy = locale === "pt-BR"
    ? {
        title: "Construa o example, arquivo por arquivo", intro: "Cada arquivo exibido abaixo vem diretamente de resources/templates/example. Siga as fases na ordem, copie os arquivos de autoria e rode o build. No final, os JSONs, sections, snippets e ilhas formam o mesmo tema do template.",
        descriptions: ["Crie um projeto que seja, ao mesmo tempo, a origem do Liquidify e um tema Shopify válido.", "Adicione os arquivos que o Liquidify não gera: layout, settings, CSS global e ponte de runtime.", "Copie imagens, ícones e locales antes de montar as sections. Eles são os dados que reproduzem a identidade visual e os dois idiomas.", "Monte header, newsletter e footer uma única vez; section groups os colocam em todas as páginas.", "Crie os componentes que definem a linguagem visual compartilhada antes de reutilizá-los em páginas.", "Copie as sections e o JSON na mesma ordem para obter hero, shelf, categorias e banner editorial.", "Use os componentes e JSONs reais para filtros, busca, paginação e fallback sem JavaScript.", "Construa a página que combina HTML Liquid indexável e ilhas pequenas para mídia, variantes e quantidade.", "Finalize os comportamentos de navegador: carrinho Ajax, drawer, toast, busca e scripts globais.", "Compile, valide e conecte os dados que o tema precisa na loja Shopify para chegar à mesma experiência."],
        files: "Arquivos desta fase", source: "Fonte", generated: "Saída gerada", related: "Arquivos gerados por esta fonte", noGenerated: "Este arquivo não gera uma saída direta do Liquidify.", copyFile: "Copiar arquivo", copyPath: "Copiar caminho", download: "Baixar", openFile: "Abrir original", copiedFile: "Arquivo copiado", copiedPath: "Caminho copiado", inventory: "Inventário completo do template", search: "Filtre os 250 arquivos do template", noResults: "Nenhum arquivo encontrado.", binaryTitle: "Asset de mídia", binary: "Imagens, ícones e fontes não são texto — por isso o visualizador mostra uma prévia em vez do código. Baixe o arquivo para colocá-lo no seu tema com o mesmo caminho.", loadingFile: "Carregando arquivo…", loadFailed: "Não foi possível carregar este arquivo.", verifyTitle: "Rode nesta ordem", copyCommands: "Copiar comandos", copiedCommands: "Comandos copiados", finish: "Ao terminar esta fase", finishItems: ["Instale dependências e preserve os scripts do template.", "Configure a marca, cores e moeda no Theme Editor.", "Configure menus, políticas e traduções no Admin.", "Rode npm run build para gerar sections, snippets e bundles.", "Use o preview do Shopify CLI com produtos, coleção all e Search & Discovery configurados."],
      }
    : {
        title: "Build example, file by file", intro: "Every file shown below comes directly from resources/templates/example. Follow the phases in order, copy authored files, and run the build. At the end, JSON templates, sections, snippets, and islands form the same theme as the template.",
        descriptions: ["Create a project that is both Liquidify source and a valid Shopify theme.", "Add files Liquidify does not generate: layout, settings, global CSS, and the runtime bridge.", "Copy images, icons, and locales before building sections. They provide the visual identity and both languages.", "Build header, newsletter, and footer once; section groups place them around every page.", "Create the components that establish the shared visual language before reusing them on pages.", "Copy sections and JSON in the same order to obtain the hero, shelf, categories, and editorial banner.", "Use the real components and JSON files for filters, search, pagination, and the no-JavaScript fallback.", "Build the page that combines indexable Liquid HTML with small islands for media, variants, and quantity.", "Finish browser behavior: Ajax cart, drawer, toast, search, and global scripts.", "Compile, validate, and connect the store data the theme needs to reach the same experience."],
        files: "Files in this phase", source: "Source", generated: "Generated output", related: "Files generated by this source", noGenerated: "This file does not produce a direct Liquidify output.", copyFile: "Copy file", copyPath: "Copy path", download: "Download", openFile: "Open original", copiedFile: "File copied", copiedPath: "Path copied", inventory: "Complete template inventory", search: "Filter the template's 250 files", noResults: "No files found.", binaryTitle: "Media asset", binary: "Images, icons, and fonts are not text — so the viewer shows a preview instead of code. Download the file to place it in your theme under the same path.", loadingFile: "Loading file…", loadFailed: "Could not load this file.", verifyTitle: "Run in this order", copyCommands: "Copy commands", copiedCommands: "Commands copied", finish: "When you finish this phase", finishItems: ["Install dependencies and preserve the template scripts.", "Configure brand, colors, and currency in Theme Editor.", "Configure menus, policies, and translations in Admin.", "Run npm run build to generate sections, snippets, and bundles.", "Use Shopify CLI preview with products, the all collection, and Search & Discovery configured."],
      };
  const outputs = catalog?.generatedBySource[sourceFile] ?? [];
  const activeFile = generatedFile ?? sourceFile;
  // Once one candidate base answers with a real file, reuse it for
  // downloads and image previews instead of guessing again.
  const [workingBase, setWorkingBase] = useState<string | null>(null);
  const activeUrls = workingBase
    ? [`${workingBase}${encodePath(activeFile)}`, ...sourceCandidates(activeFile)]
    : sourceCandidates(activeFile);
  const activeUrl = activeUrls[0];
  const [imgFallbackIndex, setImgFallbackIndex] = useState(0);
  const fileMeta = catalog?.files.find((file) => file.path === activeFile);
  const isTextFile = fileMeta ? fileMeta.text : looksLikeText(activeFile);
  const isImage = isImagePath(activeFile);
  const filteredFiles = catalog?.files.filter((file) => file.path.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 80) ?? [];

  useEffect(() => {
    const nextStage = STAGE_CHAPTERS.indexOf(chapter);
    if (nextStage >= 0) {
      setStage(nextStage);
      setSourceFile(STAGES[nextStage][0]);
      setGeneratedFile(null);
    }
  }, [chapter]);

  useEffect(() => {
    setImgFallbackIndex(0);
  }, [activeFile]);

  useEffect(() => {
    const controller = new AbortController();
    fetchFirstOk(sourceCandidates("catalog.json"), controller.signal, "catalog.json")
      .then(({ response, url }) => {
        setWorkingBase(url.slice(0, -"catalog.json".length));
        return response.json() as Promise<Catalog>;
      })
      .then((data) => {
        setCatalog(data);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") setLoadError(error.message);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    // Clear stale content immediately so switching files always visibly updates.
    setContent("");
    setLoadError(null);
    if (!isTextFile) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    fetchFirstOk(sourceCandidates(activeFile), controller.signal, activeFile)
      .then(({ response }) => response.text())
      .then((text) => {
        setContent(text);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") setLoadError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [activeFile, isTextFile]);

  function openInventoryFile(path: string) {
    const stageIndex = STAGES.findIndex((files) => files.includes(path));
    setGeneratedFile(null);
    if (stageIndex >= 0 && stageIndex !== stage) {
      setSourceFile(path);
      window.location.hash = `/example/${STAGE_CHAPTERS[stageIndex]}`;
      return;
    }
    setSourceFile(path);
  }

  async function copyValue(value: string, type: "file" | "path" | "cmds") {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const area = document.createElement("textarea");
      area.value = value;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1500);
  }

  return (
    <section id="loja" className="wrap section example-guide">
      <h2>{copy.title}</h2>
      <p className="section-sub">{copy.intro}</p>
      <div className="example-stage-content">
          <p className="example-stage-description">{copy.descriptions[stage]}</p>
          {stage === STAGES.length - 1 && (
            <div className="verify-commands">
              <div className="verify-commands-head">
                <span>$ {copy.verifyTitle}</span>
                <button type="button" onClick={() => copyValue(VERIFY_COMMANDS, "cmds")}>
                  {copied === "cmds" ? copy.copiedCommands : copy.copyCommands}
                </button>
              </div>
              <pre>
                <code>{VERIFY_COMMANDS}</code>
              </pre>
            </div>
          )}
          <div className="example-file-tabs" role="tablist" aria-label={copy.files}>
            {STAGES[stage].map((file) => <button className={sourceFile === file && !generatedFile ? "active" : ""} key={file} type="button" onClick={() => { setSourceFile(file); setGeneratedFile(null); }}>{file}</button>)}
          </div>
          <div className="source-viewer">
            <div className="source-viewer-head"><div><span>{generatedFile ? copy.generated : copy.source}</span><code>{activeFile}</code></div><div className="source-actions"><button type="button" onClick={() => copyValue(content, "file")} disabled={!isTextFile || loading || !content}>{copied === "file" ? copy.copiedFile : copy.copyFile}</button><button type="button" onClick={() => copyValue(activeFile, "path")}>{copied === "path" ? copy.copiedPath : copy.copyPath}</button><a href={activeUrl} download>{copy.download}</a><a href={activeUrl} target="_blank" rel="noopener">{copy.openFile}</a></div></div>
            {loadError && <p className="source-error" role="alert">{copy.loadFailed} <code>{loadError}</code></p>}
            {!isTextFile && (
              <div className="binary-preview">
                <div>
                  <strong>{copy.binaryTitle}</strong>
                  <p>{copy.binary}</p>
                  <p className="binary-path"><code>{activeFile}</code></p>
                </div>
                {isImage && (
                  <img
                    src={activeUrls[Math.min(imgFallbackIndex, activeUrls.length - 1)]}
                    alt={activeFile}
                    loading="lazy"
                    onError={() => setImgFallbackIndex((i) => Math.min(i + 1, activeUrls.length - 1))}
                  />
                )}
              </div>
            )}
            {isTextFile && (
              <CodeBlock code={content} path={activeFile} loading={loading} loadingLabel={copy.loadingFile} />
            )}
          </div>
          <div className="generated-panel"><strong>{copy.related}</strong>{outputs.length > 0 ? <div>{outputs.map((file) => <button className={generatedFile === file ? "active" : ""} type="button" key={file} onClick={() => setGeneratedFile(file)}>{file}</button>)}<button type="button" onClick={() => setGeneratedFile(null)}>{copy.source}</button></div> : <p>{copy.noGenerated}</p>}</div>
      </div>
      <section className="example-finish"><h3>{copy.finish}</h3><ul>{copy.finishItems.map((item) => <li key={item}>{item}</li>)}</ul></section>
      <section className="example-inventory"><h3>{copy.inventory}</h3><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={copy.search} aria-label={copy.search} />{catalog && <div>{filteredFiles.length > 0 ? filteredFiles.map((file) => <button key={file.path} type="button" onClick={() => openInventoryFile(file.path)}>{file.text ? "TXT" : "ASSET"} <code>{file.path}</code></button>) : <p>{copy.noResults}</p>}</div>}</section>
    </section>
  );
}
