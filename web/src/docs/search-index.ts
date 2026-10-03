import { CHAPTERS, type Chapter, type Section, type T } from "./manifest.ts";

export type NameEntry = {
  name: string;
  aliases?: string[];
  group: NameGroup;
  href: string;
  note: T;
};

export type NameGroup =
  | "directive"
  | "primitive"
  | "filter"
  | "runtime"
  | "event"
  | "config"
  | "flag"
  | "error"
  | "element";

const t = (en: string, pt: string): T => ({ en, "pt-BR": pt });

const DIRECTIVES: NameEntry[] = [
  { name: "use sections", group: "directive", href: "#/docs/authoring#directives", note: t("Emits sections/<name>.liquid plus {% schema %}.", "Emite sections/<name>.liquid e {% schema %}.") },
  { name: "use snippets", group: "directive", href: "#/docs/authoring#directives", note: t("Emits snippets/<name>.liquid, no browser JS.", "Emite snippets/<name>.liquid, sem JS de browser.") },
  { name: "use blocks", group: "directive", href: "#/docs/authoring#directives", note: t("Emits blocks/<name>.liquid for Theme Editor blocks.", "Emite blocks/<name>.liquid para blocks do Theme Editor.") },
  { name: "use react", group: "directive", href: "#/docs/authoring#directives", note: t("Emits a <react-island> host plus assets/<name>.js.", "Emite o host <react-island> e assets/<name>.js.") },
  { name: "use react(id)", group: "directive", href: "#/docs/authoring#directives", note: t("Island owns its own <div id> instead of <react-island>.", "A ilha usa o próprio <div id> em vez de <react-island>.") },
  { name: "use context", group: "directive", href: "#/docs/authoring#directives", note: t("Bridges React context across separate esbuild bundles.", "Conecta o contexto React entre bundles separados do esbuild.") },
  { name: "use dom", group: "directive", href: "#/docs/authoring#directives", note: t("Component script plus snippets/<name>.liquid.", "Script do componente e snippets/<name>.liquid.") },
  { name: "use dom:global", group: "directive", href: "#/docs/authoring#directives", note: t("Global script, registered in snippets/script-global.liquid.", "Script global, registrado em snippets/script-global.liquid.") },
  { name: "use script", group: "directive", href: "#/docs/authoring#directives", note: t("Web-component script only, no Liquid emitted.", "Apenas script de web component, sem Liquid emitido.") },
];

const PRIMITIVES: NameEntry[] = [
  { name: "RenderSnippet", group: "primitive", href: "#/api/tsx#composition", note: t("Becomes {% render 'name', ...props %}.", "Vira {% render 'name', ...props %}.") },
  { name: "RenderSvg", group: "primitive", href: "#/api/tsx#composition", note: t("Inlines an SVG with | inline_asset_content.", "Inlinea um SVG com | inline_asset_content.") },
  { name: "DynamicBlock", group: "primitive", href: "#/api/tsx#composition", note: t("Becomes {% content_for 'blocks' %}.", "Vira {% content_for 'blocks' %}.") },
  { name: "PaginateByLiquid", group: "primitive", href: "#/api/tsx#composition", note: t("Wraps children in {% paginate %}.", "Envolve os filhos em {% paginate %}.") },
  { name: "FormBlock", group: "primitive", href: "#/api/tsx#composition", note: t("Becomes {% form 'type', id: ... %}.", "Vira {% form 'type', id: ... %}.") },
  { name: "Raw", group: "primitive", href: "#/api/tsx#logic", note: t("Unescaped {{ html }}.", "{{ html }} sem escape.") },
  { name: "Fallback", group: "primitive", href: "#/api/tsx#logic", note: t("Value or plan B via | default:, nil or blank checks.", "Valor ou plano B via | default:, checagens nil ou blank.") },
  { name: "UnlessBlock", group: "primitive", href: "#/api/tsx#logic", note: t("Becomes {% unless condition %}.", "Vira {% unless condition %}.") },
  { name: "CaptureBlock", group: "primitive", href: "#/api/tsx#logic", note: t("Becomes {% capture name %}.", "Vira {% capture name %}.") },
  { name: "TablerowByLiquid", group: "primitive", href: "#/api/tsx#logic", note: t("Becomes {% tablerow item in collection cols: n %}.", "Vira {% tablerow item in collection cols: n %}.") },
  { name: "StylesheetBlock", group: "primitive", href: "#/api/tsx#logic", note: t("Emits a literal {% stylesheet %} block.", "Emite um bloco literal {% stylesheet %}.") },
  { name: "JavascriptBlock", group: "primitive", href: "#/api/tsx#logic", note: t("Emits a literal {% javascript %} block.", "Emite um bloco literal {% javascript %}.") },
];

const ELEMENTS: NameEntry[] = [
  { name: "react-island", group: "element", href: "#/api/tsx#intrinsics", note: t("Island host element emitted by use react.", "Elemento host da ilha emitido por use react.") },
  { name: "liquid-data", group: "element", href: "#/api/tsx#intrinsics", note: t("Serializes Liquid data for islands via data-liquid-store.", "Serializa dados Liquid para ilhas via data-liquid-store.") },
  { name: "product-provider", group: "element", href: "#/api/tsx#intrinsics", note: t("Example provider island shipped by the template.", "Ilha provider de exemplo do template.") },
  { name: "data-react-props", group: "element", href: "#/docs/runtime#bridge", note: t("JSON script tag carrying island props.", "Tag script JSON que carrega as props da ilha.") },
  { name: "data-react-hydrated", group: "element", href: "#/docs/runtime#lifecycle", note: t("Set by the runtime once an island mounts.", "Definido pelo runtime quando a ilha monta.") },
  { name: "data-hydrate", group: "element", href: "#/docs/runtime#lifecycle", note: t("eager skips the IntersectionObserver and hydrates at once.", "eager pula o IntersectionObserver e hidrata na hora.") },
  { name: "data-liquidify-on", group: "element", href: "#/docs/islands#actions", note: t("Prefix for bridge attributes: click, input, submit, ...", "Prefixo de atributos de ponte: click, input, submit, ...") },
];

const FILTERS: NameEntry[] = [
  { name: "escape", group: "filter", href: "#/api/filters#core", note: t("Escapes a string for HTML output. Applied by default.", "Escapa uma string para HTML. Aplicado por padrão.") },
  { name: "escape_once", group: "filter", href: "#/api/filters#core", note: t("Escapes without double-escaping existing entities.", "Escapa sem reaplicar em entidades já escapadas."), aliases: ["escapeOnce"] },
  { name: "strip_html", group: "filter", href: "#/api/filters#core", note: t("Removes every HTML tag.", "Remove todas as tags HTML."), aliases: ["stripHtml"] },
  { name: "strip", group: "filter", href: "#/api/filters#core", note: t("Strips newlines and extra whitespace.", "Remove quebras de linha e espaços extras.") },
  { name: "downcase", group: "filter", href: "#/api/filters#core", note: t("Lowercases a string.", "Converte para minúsculas.") },
  { name: "upcase", group: "filter", href: "#/api/filters#core", note: t("Uppercases a string.", "Converte para maiúsculas.") },
  { name: "handleize", group: "filter", href: "#/api/filters#core", note: t("Slugifies a string.", "Gera um slug da string.") },
  { name: "markdownify", group: "filter", href: "#/api/filters#core", note: t("Renders Markdown. Not available inside islands.", "Renderiza Markdown. Indisponível dentro de ilhas.") },
  { name: "append", group: "filter", href: "#/api/filters#core", note: t("Concatenates a suffix.", "Concatena um sufixo.") },
  { name: "prepend", group: "filter", href: "#/api/filters#core", note: t("Concatenates a prefix.", "Concatena um prefixo.") },
  { name: "replace", group: "filter", href: "#/api/filters#core", note: t("Replaces every occurrence.", "Substitui todas as ocorrências.") },
  { name: "remove", group: "filter", href: "#/api/filters#core", note: t("Deletes every occurrence.", "Remove todas as ocorrências.") },
  { name: "truncate", group: "filter", href: "#/api/filters#core", note: t("Cuts a string at a length.", "Corta a string num limite.") },
  { name: "truncatewords", group: "filter", href: "#/api/filters#core", note: t("Cuts on word boundaries. Emitted by the truncateWords helper.", "Corta em fronteiras de palavra. Emitido pelo helper truncateWords."), aliases: ["truncateWords"] },
  { name: "where", group: "filter", href: "#/api/filters#collections", note: t("Keeps entries matching a value comparison.", "Mantém entradas que casam com uma comparação."), aliases: ["where_exp"] },
  { name: "split", group: "filter", href: "#/api/filters#core", note: t("Splits a string into an array.", "Divide a string num array.") },
  { name: "join", group: "filter", href: "#/api/filters#core", note: t("Joins an array back into a string.", "Junta um array de volta numa string.") },
  { name: "slice", group: "filter", href: "#/api/filters#core", note: t("Slices an array or string.", "Fatia um array ou string.") },
  { name: "sort", group: "filter", href: "#/api/filters#collections", note: t("Sorts a collection.", "Ordena uma coleção.") },
  { name: "reverse", group: "filter", href: "#/api/filters#collections", note: t("Reverses an array.", "Inverte um array.") },
  { name: "uniq", group: "filter", href: "#/api/filters#collections", note: t("Removes duplicates.", "Remove duplicados.") },
  { name: "compact", group: "filter", href: "#/api/filters#collections", note: t("Drops nil entries.", "Remove entradas nil.") },
  { name: "sum", group: "filter", href: "#/api/filters#collections", note: t("Adds a property across a collection.", "Soma uma propriedade da coleção.") },
  { name: "first", group: "filter", href: "#/api/filters#collections", note: t("First entry of a collection.", "Primeiro item da coleção.") },
  { name: "last", group: "filter", href: "#/api/filters#collections", note: t("Last entry of a collection.", "Último item da coleção.") },
  { name: "size", group: "filter", href: "#/api/filters#collections", note: t("Length of an array or string.", "Tamanho de um array ou string.") },
  { name: "money", group: "filter", href: "#/api/filters#money", note: t("Formats a number as currency.", "Formata um número como moeda.") },
  { name: "money_with_currency", group: "filter", href: "#/api/filters#money", note: t("Currency code included.", "Inclui o código da moeda."), aliases: ["moneyWithCurrency"] },
  { name: "money_without_currency", group: "filter", href: "#/api/filters#money", note: t("Drops the currency code.", "Remove o código da moeda."), aliases: ["moneyWithoutCurrency"] },
  { name: "money_without_trailing_zeros", group: "filter", href: "#/api/filters#money", note: t("Drops trailing decimals.", "Remove casas decimais à direita."), aliases: ["moneyWithoutTrailingZeros"] },
  { name: "weight_with_unit", group: "filter", href: "#/api/filters#money", note: t("Formats a weight with its unit.", "Formata um peso com sua unidade."), aliases: ["weightWithUnit"] },
  { name: "asset_url", group: "filter", href: "#/api/filters#shopify", note: t("Resolves a file in assets/.", "Resolve um arquivo em assets/."), aliases: ["assetUrl"] },
  { name: "image_url", group: "filter", href: "#/api/filters#shopify", note: t("Resizes an image. Named args set the size.", "Redimensiona uma imagem. Args nomeados definem o tamanho."), aliases: ["imageUrl"] },
  { name: "image_tag", group: "filter", href: "#/api/filters#shopify", note: t("Renders a full <img> tag.", "Renderiza uma tag <img> completa."), aliases: ["img_url"] },
  { name: "stylesheet_tag", group: "filter", href: "#/api/filters#shopify", note: t("Renders a stylesheet tag.", "Renderiza uma tag de stylesheet.") },
  { name: "script_tag", group: "filter", href: "#/api/filters#shopify", note: t("Renders a script tag.", "Renderiza uma tag de script.") },
  { name: "link_to", group: "filter", href: "#/api/filters#shopify", note: t("Renders an anchor tag.", "Renderiza uma tag de link."), aliases: ["linkTo"] },
  { name: "t", group: "filter", href: "#/api/filters#shopify", note: t("Theme Editor translation lookup.", "Busca de tradução do Theme Editor."), aliases: ["translate"] },
  { name: "json", group: "filter", href: "#/api/filters#shopify", note: t("Serializes a value as JSON, with < escaped.", "Serializa um valor em JSON, com < escapado."), aliases: ["liquidJsonOutput"] },
  { name: "date", group: "filter", href: "#/api/filters#shopify", note: t("Formats a date.", "Formata uma data.") },
  { name: "default", group: "filter", href: "#/api/filters#shopify", note: t("Fallback when the value is nil or false.", "Valor padrão quando nil ou false.") },
  { name: "default_errors", group: "filter", href: "#/api/filters#shopify", note: t("Renders form.errors.", "Renderiza form.errors.") },
  { name: "format_address", group: "filter", href: "#/api/filters#shopify", note: t("Renders a Shopify address.", "Renderiza um endereço Shopify.") },
  { name: "url_encode", group: "filter", href: "#/api/filters#shopify", note: t("Percent-encodes a string.", "Codifica a string percentualmente."), aliases: ["urlEncode"] },
  { name: "at_least", group: "filter", href: "#/api/filters#collections", note: t("Clamps a number to a minimum.", "Limita um número a um mínimo.") },
  { name: "at_most", group: "filter", href: "#/api/filters#collections", note: t("Clamps a number to a maximum.", "Limita um número a um máximo.") },
];

const RUNTIME: NameEntry[] = [
  { name: "registerLiquidifyAction", group: "runtime", href: "#/api/runtime#module", note: t("Binds a name to a handler; returns an unregister function.", "Liga um nome a um handler; retorna a função de desregistro.") },
  { name: "registerLiquidIsland", group: "runtime", href: "#/api/runtime#module", note: t("Registers a component outside the compile pipeline.", "Registra um componente fora do pipeline de compilação.") },
  { name: "useLiquidifyEvent", group: "runtime", href: "#/api/runtime#module", note: t("React hook that subscribes and cancels on unmount.", "Hook React que assina e cancela no unmount.") },
  { name: "emitLiquidifyEvent", group: "runtime", href: "#/api/runtime#module", note: t("Emits a payload on the global bus.", "Emite um payload no bus global.") },
  { name: "LiquidifyEvents", group: "runtime", href: "#/api/runtime#module", note: t("Manual bus: on, off, emit.", "Bus manual: on, off, emit.") },
  { name: "LiquidifyTakePendingEvents", group: "runtime", href: "#/api/runtime#bus", note: t("Drains events queued before any subscriber existed.", "Consome os eventos enfileirados antes de existir assinante.") },
  { name: "LiquidifyMount", group: "runtime", href: "#/api/runtime#globals", note: t("Window global that mounts an island container.", "Global de window que monta o container de uma ilha.") },
  { name: "LiquidifyUnmount", group: "runtime", href: "#/api/runtime#globals", note: t("Window global that unmounts and cleans up.", "Global de window que desmonta e limpa.") },
  { name: "LiquidifyCanMount", group: "runtime", href: "#/api/runtime#globals", note: t("False while the container is disconnected or its section suspended.", "False enquanto o container está desconectado ou a section suspensa.") },
  { name: "LiquidifyParseProps", group: "runtime", href: "#/api/runtime#globals", note: t("Reads data-liquid-* attributes into typed props.", "Lê atributos data-liquid-* em props tipadas.") },
  { name: "LiquidifyParseJSON", group: "runtime", href: "#/api/runtime#globals", note: t("Safe JSON parse that reports the offending node.", "Parse JSON seguro que aponta o nó problemático.") },
  { name: "LiquidifyRegisterRoot", group: "runtime", href: "#/api/runtime#globals", note: t("Binds a root id to a component name.", "Liga um id de root a um nome de componente.") },
  { name: "LiquidifyHydrate", group: "runtime", href: "#/api/runtime#globals", note: t("Hydration entry point per component, keyed by name.", "Ponto de hidratação por componente, indexado por nome.") },
  { name: "LiquidifyTry", group: "runtime", href: "#/api/runtime#globals", note: t("Result wrapper used to report registration failures.", "Wrapper de resultado usado para reportar falhas de registro.") },
  { name: "LiquidxEvents", group: "runtime", href: "#/api/runtime#bus", note: t("Legacy alias of LiquidifyEvents.", "Alias legado de LiquidifyEvents.") },
  { name: "strictCsp", group: "runtime", href: "#/api/config#strictcsp", note: t("Refuses to build functions from attribute text. Default true.", "Recusa criar funções a partir de texto de atributo. Padrão true.") },
  { name: "makeLiquidifyBuilder", group: "runtime", href: "#/api/builder#interface", note: t("Creates a builder from a config object.", "Cria um builder a partir de um config.") },
  { name: "loadConfig", group: "runtime", href: "#/api/config#discovery", note: t("Discovers and validates the config file.", "Descobre e valida o arquivo de config.") },
  { name: "transpileFile", group: "runtime", href: "#/api/build#imports", note: t("Compiles one file and returns its result.", "Compila um arquivo e devolve o resultado.") },
  { name: "LiquidifyError", group: "runtime", href: "#/api/errors#config-errors", note: t("Base error, carries filePath and location.", "Erro base, carrega filePath e location.") },
  { name: "ValidationError", group: "runtime", href: "#/api/errors#config-errors", note: t("Thrown for anything the author must fix.", "Lançado para tudo que o autor precisa corrigir.") },
];

const EVENTS: NameEntry[] = [
  { name: "liquidify:ready:<Component>", group: "event", href: "#/api/runtime#events", note: t("Fired when an island bundle finishes registering.", "Disparado quando o bundle da ilha termina de registrar.") },
  { name: "liquidx:ready:<Component>", group: "event", href: "#/api/runtime#events", note: t("Legacy alias of liquidify:ready.", "Alias legado de liquidify:ready.") },
  { name: "shopify:section:load", group: "event", href: "#/api/runtime#events", note: t("Remounts the islands inside a section.", "Remonta as ilhas de uma section.") },
  { name: "shopify:section:unload", group: "event", href: "#/api/runtime#events", note: t("Unmounts them and runs effect cleanups.", "Desmonta e roda os cleanups de efeito.") },
];

const CONFIG: NameEntry[] = [
  { name: "componentsDir", group: "config", href: "#/api/config#options", note: t("Folder scanned for TSX and JS. Default src/components.", "Pasta varrida por TSX e JS. Padrão src/components.") },
  { name: "output", group: "config", href: "#/api/config#options", note: t("Theme root that receives the generated files. Default liquidify.", "Raiz do tema que recebe os arquivos gerados. Padrão liquidify.") },
  { name: "force", group: "config", href: "#/api/config#options", note: t("Lets the generator replace existing output files.", "Permite que o gerador substitua arquivos existentes.") },
  { name: "react.strictCsp", group: "config", href: "#/api/config#options", note: t("CSP strategy for the island runtime.", "Estratégia de CSP do runtime das ilhas.") },
  { name: "liquidify.config.json", group: "config", href: "#/api/config#discovery", note: t("First filename checked during discovery.", "Primeiro nome verificado na descoberta.") },
  { name: ".liquidifyrc.json", group: "config", href: "#/api/config#discovery", note: t("Second filename checked.", "Segundo nome verificado.") },
  { name: ".liquidifyrc", group: "config", href: "#/api/config#discovery", note: t("Third filename checked.", "Terceiro nome verificado.") },
  { name: "liquidx.config.json", group: "config", href: "#/api/config#discovery", note: t("Legacy filename, still accepted.", "Nome legado, ainda aceito.") },
  { name: ".liquidxrc.json", group: "config", href: "#/api/config#discovery", note: t("Legacy filename, still accepted.", "Nome legado, ainda aceito.") },
  { name: ".liquidxrc", group: "config", href: "#/api/config#discovery", note: t("Last filename checked.", "Último nome verificado.") },
  { name: ".liquidify-manifest.json", group: "config", href: "#/api/build#manifest", note: t("Build manifest: version 1 plus a SHA-256 per file.", "Manifest de build: versão 1 e um SHA-256 por arquivo.") },
  { name: "pascalToKebab", group: "config", href: "#/api/build#output", note: t("ComponentName becomes component-name for the output file.", "ComponentName vira component-name no arquivo de saída.") },
];

const ERRORS: NameEntry[] = [
  { name: "spread", group: "error", href: "#/api/errors#unsupported", note: t("Unsupported: <div {...props} />.", "Não suportado: <div {...props} />."), aliases: ["{...props}"] },
  { name: "namespaced attribute", group: "error", href: "#/api/errors#unsupported", note: t("Unsupported: <div ns:attr={x} />.", "Não suportado: <div ns:attr={x} />."), aliases: ["ns:attr", "namespace"] },
  { name: "ternary className", group: "error", href: "#/api/errors#unsupported", note: t("className={a && b} and style={a ? x : y} are not supported.", "className={a && b} e style={a ? x : y} não são suportados."), aliases: ["className", "ternary"] },
  { name: "for...in", group: "error", href: "#/api/errors#unsupported", note: t("Unsupported: for (const k in obj). Use Object.keys.", "Não suportado: for (const k in obj). Use Object.keys.") },
  { name: "JSON.parse", group: "error", href: "#/api/errors#unsupported", note: t("Unsupported: JSON.parse(s).", "Não suportado: JSON.parse(s).") },
  { name: "Object.keys", group: "error", href: "#/api/errors#unsupported", note: t("Unsupported: Object.keys(o).", "Não suportado: Object.keys(o).") },
  { name: "dynamic css module", group: "error", href: "#/api/errors#unsupported", note: t("styles[dynamicKey] is not supported.", "styles[dynamicKey] não é suportado."), aliases: ["css module"] },
  { name: "PaginateByLiquid", group: "error", href: "#/api/errors#primitive-attrs", note: t("Requires the paginateByLiquid prop.", "Exige a prop paginateByLiquid.") },
  { name: "TablerowByLiquid", group: "error", href: "#/api/errors#primitive-attrs", note: t("Requires the tablerowByLiquid prop.", "Exige a prop tablerowByLiquid.") },
  { name: "DynamicBlock", group: "error", href: "#/api/errors#primitive-attrs", note: t("Requires the blocks prop.", "Exige a prop blocks.") },
  { name: ".find()", group: "error", href: "#/api/errors#loops", note: t("Only inline single-param arrows with an expression body.", "Apenas arrow inline de 1 parâmetro com corpo de expressão.") },
  { name: "Invalid JSON", group: "error", href: "#/api/errors#config-errors", note: t("The config file is not valid JSON.", "O arquivo de config não é JSON válido."), aliases: ["invalid json", "json inválido"] },
  { name: "Bad strictCsp", group: "error", href: "#/api/errors#config-errors", note: t("strictCsp must be a boolean.", "strictCsp deve ser booleano."), aliases: ["strictCsp"] },
  { name: "Manifest version", group: "error", href: "#/api/errors#config-errors", note: t("Unsupported .liquidify-manifest.json version.", "Versão de manifest não suportada.") },
  { name: "Reserved path", group: "error", href: "#/api/errors#config-errors", note: t("react-runtime.js and script-global.liquid are reserved.", "react-runtime.js e script-global.liquid são reservados."), aliases: ["reserved"] },
  { name: "Output conflict", group: "error", href: "#/api/errors#config-errors", note: t("Two components resolve to the same output name.", "Dois componentes resolvem para o mesmo nome de saída."), aliases: ["collision"] },
  { name: "Unsafe filename", group: "error", href: "#/api/errors#naming", note: t("The generated filename is not safe.", "O nome de arquivo gerado não é seguro."), aliases: ["safe filename"] },
  { name: "console.error", group: "error", href: "#/api/errors#runtime-console", note: t("Runtime console messages: unmount failed, registration failed, action requires.", "Mensagens de console do runtime: unmount failed, registration failed, action requires.") },
];

const FLAGS: NameEntry[] = [
  { name: "--watch", group: "flag", href: "#/api/cli#commands", note: t("Recompile on save. Alias -w.", "Recompila ao salvar. Alias -w."), aliases: ["-w"] },
  { name: "--force", group: "flag", href: "#/api/cli#commands", note: t("Overwrite existing output. Alias -f.", "Sobrescreve a saída existente. Alias -f."), aliases: ["-f"] },
  { name: "--config", group: "flag", href: "#/api/cli#commands", note: t("Explicit config file. Also --config=path.", "Arquivo de config explícito. Também --config=path.") },
  { name: "--quiet", group: "flag", href: "#/api/cli#commands", note: t("Minimal output, implies --no-banner. Alias -q.", "Saída mínima, implica --no-banner. Alias -q."), aliases: ["-q"] },
  { name: "--no-banner", group: "flag", href: "#/api/cli#commands", note: t("Skips the startup banner.", "Pula o banner inicial.") },
  { name: "--version", group: "flag", href: "#/api/cli#commands", note: t("Prints the version. Alias -V.", "Imprime a versão. Alias -V."), aliases: ["-V"] },
  { name: "--help", group: "flag", href: "#/api/cli#commands", note: t("Prints usage. Alias -h.", "Imprime o uso. Alias -h."), aliases: ["-h"] },
  { name: "--template", group: "flag", href: "#/api/cli#init", note: t("init template. Only example ships. Alias -t.", "Template do init. Só example existe. Alias -t."), aliases: ["-t"] },
  { name: "liquidify init", group: "flag", href: "#/api/cli#init", note: t("Scaffolds a theme into a directory.", "Cria um tema em um diretório.") },
  { name: "build:start", group: "event", href: "#/api/cli#builder-events", note: t("Builder event: compilation began.", "Evento do builder: compilação começou.") },
  { name: "build:end", group: "event", href: "#/api/cli#builder-events", note: t("Builder event: outputs are complete.", "Evento do builder: saídas concluídas.") },
  { name: "build:failed", group: "event", href: "#/api/cli#builder-events", note: t("Builder event: a watch rebuild failed.", "Evento do builder: um rebuild do watch falhou.") },
  { name: "file:change", group: "event", href: "#/api/cli#builder-events", note: t("Builder event: a watched file changed.", "Evento do builder: um arquivo vigiado mudou.") },
];

export const NAME_INDEX: NameEntry[] = [
  ...DIRECTIVES,
  ...PRIMITIVES,
  ...ELEMENTS,
  ...FILTERS,
  ...RUNTIME,
  ...EVENTS,
  ...CONFIG,
  ...FLAGS,
  ...ERRORS,
];

export type SearchDoc = {
  key: string;
  kind: "page" | "section" | "name";
  group?: NameGroup;
  title: string;
  titleT?: T;
  noteT?: T;
  href: string;
  haystack: string;
  terms: string[];
};

export function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.\-_'`]/g, " ");
}

function buildDocs(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const chapter of CHAPTERS as Chapter[]) {
    docs.push({
      key: `page:${chapter.href}`,
      kind: "page",
      title: chapter.title.en,
      titleT: chapter.title,
      noteT: chapter.summary,
      href: chapter.href,
      haystack: "",
      terms: [chapter.id, ...chapter.sections.map((s) => s.id)],
    });

    for (const section of chapter.sections as Section[]) {
      docs.push({
        key: `section:${chapter.href}#${section.id}`,
        kind: "section",
        title: section.title.en,
        titleT: section.title,
        noteT: chapter.title,
        href: `${chapter.href}#${section.id}`,
        haystack: "",
        terms: [section.id, ...(section.terms ?? [])],
      });
    }
  }

  for (const entry of NAME_INDEX) {
    docs.push({
      key: `name:${entry.name}`,
      kind: "name",
      group: entry.group,
      title: entry.name,
      noteT: entry.note,
      href: entry.href,
      haystack: "",
      terms: [entry.name, ...(entry.aliases ?? [])],
    });
  }

  for (const doc of docs) {
    const parts = [
      doc.title,
      doc.titleT?.en ?? "",
      doc.titleT?.["pt-BR"] ?? "",
      doc.noteT?.en ?? "",
      doc.noteT?.["pt-BR"] ?? "",
      ...doc.terms,
    ].filter(Boolean);
    doc.haystack = fold(parts.join(" "));
  }
  return docs;
}

export const SEARCH_DOCS: SearchDoc[] = buildDocs();

export type SearchResult = SearchDoc & { score: number };

export function search(query: string, limit = 24): SearchResult[] {
  const normalized = fold(query).trim();
  if (!normalized) return [];
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const results: SearchResult[] = [];

  for (const doc of SEARCH_DOCS) {
    let score = 0;
    let matchedAll = true;

    for (const token of tokens) {
      const foldedTerms = doc.terms.map((term) => fold(term).trim());
      const inTerms = foldedTerms.some((flat) => flat === token || flat.startsWith(token));
      const exactTerm = foldedTerms.some((flat) => flat === token);
      const inHaystack = doc.haystack.includes(token);
      const tokenIndex = doc.haystack.indexOf(token);

      if (!inTerms && !inHaystack) {
        matchedAll = false;
        break;
      }
      if (exactTerm) score += 60;
      else if (inTerms) score += 30;
      if (tokenIndex === 0) score += 25;
      score += Math.max(0, 18 - Math.floor(tokenIndex / 24));
    }

    if (!matchedAll) continue;
    if (doc.kind === "page") score += 8;
    if (doc.kind === "name") score += 12;
    score -= Math.max(0, doc.haystack.length - 400) / 400;
    results.push({ ...doc, score });
  }

  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}

export function highlight(text: string, query: string): { text: string; match: boolean }[] {
  const tokens = fold(query)
    .split(/\s+/)
    .map((token) => token.replace(/\s+/g, ""))
    .filter(Boolean);
  if (tokens.length === 0 || text.length === 0) return [{ text, match: false }];

  const map: number[] = [];
  let foldedIndex = 0;
  for (let i = 0; i < text.length; i += 1) {
    const piece = fold(text[i]);
    for (let k = 0; k < piece.length; k += 1) map[foldedIndex++] = i;
  }
  const folded = fold(text);

  const marks = new Array<boolean>(text.length).fill(false);
  for (const token of tokens) {
    let from = 0;
    while (from <= folded.length - token.length) {
      const at = folded.indexOf(token, from);
      if (at === -1) break;
      const start = map[at] ?? 0;
      const end = (map[at + token.length - 1] ?? start) + 1;
      for (let i = start; i < end; i += 1) marks[i] = true;
      from = at + token.length;
    }
  }

  const runs: { text: string; match: boolean }[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const match = marks[i];
    const last = runs[runs.length - 1];
    if (last && last.match === match) last.text += text[i];
    else runs.push({ text: text[i], match });
  }
  return runs;
}
