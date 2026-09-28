import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import styles from "./style.module.css";

const HELPER_TABLE = `// lib/shared/tsx-helper-filters.ts
escape                -> escape
escapeOnce            -> escape_once
stripHtml             -> strip_html
strip                 -> strip
downcase              -> downcase
upcase                -> upcase
handleize             -> handleize
markdownify           -> markdownify
append                -> append
prepend               -> prepend
replace               -> replace
remove                -> remove
truncate              -> truncate
truncateWords         -> truncatewords
split                 -> split
join                  -> join
slice                 -> slice
sort                  -> sort
reverse               -> reverse
uniq                  -> uniq
compact               -> compact
sum                   -> sum
first                 -> first
last                  -> last
size                  -> size
money                 -> money
moneyWithCurrency     -> money_with_currency
moneyWithoutCurrency  -> money_without_currency
moneyWithoutTrailingZeros -> money_without_trailing_zeros
weightWithUnit        -> weight_with_unit
assetUrl              -> asset_url
imageUrl              -> image_url
linkTo                -> link_to
date                  -> date
urlEncode             -> url_encode`;

const HELPER_USAGE = `import { downcase, handleize, moneyWithCurrency } from "liquidify";

<p>{downcase(product.title)}</p>
<a href={"/blogs/" + handleize(blog.title)}>{blog.title}</a>
<span>{moneyWithCurrency(product.price)}</span>`;

const FORBIDDEN = `const FORBIDDEN_REACT_FILTERS = new Set([
  'markdownify',
  'handleize',
  'downcase',
  'upcase',
  'strip',
  'strip_html',
  'money',
  'money_without_currency',
])`;

const STRING_LIKE = `const STRING_LIKE_METHODS = new Set([
  'toString', 'join', 'toLowerCase', 'toUpperCase', 'trim',
  'markdownify', 'handleize', 'strip', 'strip_html',
  'money', 'money_without_currency',
])`;

const CLASSNAMES = `const CLASSNAMES_FNS = new Set(['classNames', 'classnames', 'clsx'])`;

const CLASSNAME_USAGE = `<div className={classNames("card", isActive && "is-active")} />
<div className={styles.button} />
<div className={clsx(styles.card, "p-4", { "is-wide": wide })} />`;

export default function FiltersReference() {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const copy = pt
    ? {
        rule: "A única regra sobre filtros",
        ruleText:
          "Filtro é coisa de Liquid. O compilador nunca inventa um filtro a partir de um método JS: quando você escreve um método que não tem filtro, o build falha em vez de emitir Liquid quebrado. O motivo é simples — um filtro roda no servidor Shopify, então ele precisa existir lá.",
        core: "Filtros core",
        coreHeaders: ["Filtro", "O que faz"],
        coreRows: [
          ["escape", "Escapa a string para HTML. Já é aplicado por padrão na interpolação."],
          ["escape_once", "Escapa sem reaplicar em entidades que já estão escapadas."],
          ["strip_html", "Remove todas as tags HTML."],
          ["strip", "Remove quebras de linha e espaços extras."],
          ["downcase / upcase", "Minúsculas e maiúsculas."],
          ["handleize", "Gera slug."],
          ["markdownify", "Renderiza Markdown. Indisponível dentro de ilhas."],
          ["append / prepend", "Concatena sufixo ou prefixo."],
          ["replace / remove", "Substitui ou apaga todas as ocorrências."],
          ["truncate", "Corta num limite de tamanho."],
          ["truncatewords", "Corta em fronteiras de palavra. Vem de truncateWords()."],
          ["split / join", "String para array e de volta."],
          ["slice", "Fatia array ou string."],
          ["url_encode", "Codifica percentualmente."],
        ],
        collections: "Filtros de coleção",
        collectionsHeaders: ["Filtro", "O que faz"],
        collectionsRows: [
          ["sort / reverse", "Ordena e inverte um array."],
          ["uniq / compact", "Remove duplicados e entradas nil."],
          ["sum", "Soma uma propriedade ao longo da coleção."],
          ["first / last", "Primeiro e último item."],
          ["size", "Tamanho de array ou string."],
          ["at_least / at_most", "Limita um número por baixo e por cima."],
          ["where / where_exp", "Emissão automática de .filter() e .map() com comparação."],
        ],
        money: "Dinheiro e peso",
        moneyHeaders: ["Filtro", "O que faz"],
        moneyRows: [
          ["money", "Formata como moeda, na moeda da loja."],
          ["money_with_currency", "Inclui o código da moeda."],
          ["money_without_currency", "Remove o código da moeda."],
          ["money_without_trailing_zeros", "Remove as casas decimais à direita."],
          ["weight_with_unit", "Formata um peso com sua unidade."],
        ],
        shopify: "Globais Shopify",
        shopifyHeaders: ["Filtro", "O que faz"],
        shopifyRows: [
          ["asset_url", "Resolve um arquivo em assets/."],
          ["image_url", "Redimensiona uma imagem. Args nomeados definem o tamanho."],
          ["image_tag / img_url", "Renderiza uma tag img completa."],
          ["stylesheet_tag / script_tag", "Renderizam as tags de CSS e JS."],
          ["link_to", "Renderiza uma tag de link."],
          ["t / translate", "Busca de tradução do Theme Editor."],
          ["date", "Formata uma data."],
          ["default", "Valor de reserva quando o valor é nil ou false."],
          ["default_errors", "Renderiza form.errors."],
          ["format_address", "Renderiza um endereço Shopify."],
          ["json", "Serializa em JSON, com < escapado como \\u003c."],
        ],
        helpers: "Helpers TSX",
        helpersText:
          "O caminho idiomático é chamar o helper em camelCase, não digitar o filtro. A tabela é fixa e verificada em tempo de build.",
        strings: "Métodos string-like",
        stringsText:
          "Estes dez métodos são tratados como filtro em posição de saída, porque o equivalente Liquid existe e o resultado é o mesmo.",
        classnames: "classNames / clsx",
        classnamesText:
          "Os três nomes são reconhecidos e compilados para uma lista estática de classes. Por isso precisam ser constantes: um valor calculado em runtime não pode virar Liquid estático.",
        operators: "Operadores",
        operatorsText:
          "Estes operadores são reescritos para a forma equivalente em Liquid, incluindo a guarda de nil que impede o erro clássico de objeto vazio.",
      }
    : {
        rule: "The one rule about filters",
        ruleText:
          "Filters belong to Liquid. The compiler never invents a filter out of a JS method: when you write a method with no filter behind it, the build fails instead of emitting broken Liquid. The reason is simple — a filter runs on the Shopify server, so it has to exist there.",
        core: "Core filters",
        coreHeaders: ["Filter", "What it does"],
        coreRows: [
          ["escape", "Escapes a string for HTML. Already applied to interpolation by default."],
          ["escape_once", "Escapes without double-escaping existing entities."],
          ["strip_html", "Removes every HTML tag."],
          ["strip", "Strips newlines and extra whitespace."],
          ["downcase / upcase", "Lowercases and uppercases."],
          ["handleize", "Slugifies."],
          ["markdownify", "Renders Markdown. Unavailable inside islands."],
          ["append / prepend", "Concatenates a suffix or a prefix."],
          ["replace / remove", "Replaces or deletes every occurrence."],
          ["truncate", "Cuts at a length limit."],
          ["truncatewords", "Cuts on word boundaries. Emitted by truncateWords()."],
          ["split / join", "String to array and back."],
          ["slice", "Slices an array or string."],
          ["url_encode", "Percent-encodes."],
        ],
        collections: "Collection filters",
        collectionsHeaders: ["Filter", "What it does"],
        collectionsRows: [
          ["sort / reverse", "Sorts and reverses an array."],
          ["uniq / compact", "Removes duplicates and nil entries."],
          ["sum", "Adds a property across the collection."],
          ["first / last", "First and last entry."],
          ["size", "Length of an array or string."],
          ["at_least / at_most", "Clamps a number from below and above."],
          ["where / where_exp", "Emitted automatically by .filter() and .map() with a comparison."],
        ],
        money: "Money and weight",
        moneyHeaders: ["Filter", "What it does"],
        moneyRows: [
          ["money", "Formats as currency, in the store's currency."],
          ["money_with_currency", "Includes the currency code."],
          ["money_without_currency", "Drops the currency code."],
          ["money_without_trailing_zeros", "Drops trailing decimals."],
          ["weight_with_unit", "Formats a weight with its unit."],
        ],
        shopify: "Shopify globals",
        shopifyHeaders: ["Filter", "What it does"],
        shopifyRows: [
          ["asset_url", "Resolves a file in assets/."],
          ["image_url", "Resizes an image. Named args set the size."],
          ["image_tag / img_url", "Renders a complete img tag."],
          ["stylesheet_tag / script_tag", "Render the CSS and JS tags."],
          ["link_to", "Renders an anchor tag."],
          ["t / translate", "Theme Editor translation lookup."],
          ["date", "Formats a date."],
          ["default", "Fallback when the value is nil or false."],
          ["default_errors", "Renders form.errors."],
          ["format_address", "Renders a Shopify address."],
          ["json", "Serializes as JSON, with < escaped as \\u003c."],
        ],
        helpers: "TSX helpers",
        helpersText:
          "The idiomatic path is calling the camelCase helper rather than typing the filter. The table is fixed and checked at build time.",
        strings: "String-like methods",
        stringsText:
          "These ten methods are treated as filters in output position, because the Liquid equivalent exists and the result is the same.",
        classnames: "classNames / clsx",
        classnamesText:
          "All three names are recognised and compiled to a static class list. That is why they must be constant: a value computed at runtime cannot become static Liquid.",
        operators: "Operators",
        operatorsText:
          "These operators are rewritten to their Liquid equivalent, including the nil guard that prevents the classic empty-object bug.",
      };

  const table = (id: string, title: string, headers: string[], rows: string[][]) => (
    <div className="ref-block" key={id}>
      <h3 id={id}>{title}</h3>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]}>
                <td>
                  <code>{row[0]}</code>
                </td>
                <td>{row[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <section className={`'wrap' 'section' styles.filtersReference`}>
      <h2>{pt ? "Filtros e helpers" : "Filters and helpers"}</h2>
      <p className="section-sub">
        {pt
          ? "Tudo que o compilador reconhece como filtro, e o helper TSX que emite cada um."
          : "Everything the compiler recognises as a filter, and the TSX helper that emits it."}
      </p>

      <div className="ref-block">
        <h3 id="string-rule">{copy.rule}</h3>
        <p className="ref-note">{copy.ruleText}</p>
      </div>

      {table("core", copy.core, copy.coreHeaders, copy.coreRows)}
      {table("collections", copy.collections, copy.collectionsHeaders, copy.collectionsRows)}
      {table("money", copy.money, copy.moneyHeaders, copy.moneyRows)}
      {table("shopify", copy.shopify, copy.shopifyHeaders, copy.shopifyRows)}

      <div className="ref-block">
        <h3 id="helpers">{copy.helpers}</h3>
        <p className="ref-note">{copy.helpersText}</p>
        <div className={styles.refCodeGrid}>
          <Snippet code={HELPER_TABLE} language="tsx" title="HELPER_TO_FILTER" />
          <Snippet code={HELPER_USAGE} language="tsx" title={pt ? "Uso" : "Usage"} />
        </div>
      </div>

      <div className="ref-block">
        <h3 id="helper-examples">{pt ? "Exemplos de todos os helpers" : "Examples of all helpers"}</h3>
        <div className={styles.refCodeGrid}>
          <Snippet code={`// Escape e sanitização
import { escape, escapeOnce } from "liquidify";
<p>{escape(userInput)}</p>
<p>{escapeOnce(mixedContent)}</p>`} language="tsx" title="escape / escapeOnce" />
          <Snippet code={`// JSON e dados
import { json, raw } from "liquidify";
<script type="application/json">{json(data)}</script>
<Raw html={trustedHtml} />`} language="tsx" title="json / raw" />
          <Snippet code={`// Default e tradução
import { defaultValue, t, translate } from "liquidify";
<span>{defaultValue(product.title, "Sem título")}</span>
<span>{t('products.product.sale')}</span>
<span>{translate('products.product.new')}</span>`} language="tsx" title="defaultValue / t / translate" />
          <Snippet code={`// URLs e assets
import { assetUrl, imageUrl, urlEncode, linkTo } from "liquidify";
<img src={imageUrl(product.image, { width: 800 })} />
<link rel="stylesheet" href={assetUrl("theme.css")} />
<a href={urlEncode(searchTerm)}>Buscar</a>
<a href={linkTo("/products/" + product.handle, product.title)} />`} language="tsx" title="assetUrl / imageUrl / urlEncode / linkTo" />
          <Snippet code={`// Dinheiro e peso
import { money, moneyWithCurrency, moneyWithoutCurrency, moneyWithoutTrailingZeros, weightWithUnit } from "liquidify";
<span>{money(product.price)}</span>
<span>{moneyWithCurrency(product.price)}</span>
<span>{moneyWithoutCurrency(product.price)}</span>
<span>{moneyWithoutTrailingZeros(product.price)}</span>
<span>{weightWithUnit(variant.weight)}</span>`} language="tsx" title="money / moneyWithCurrency / moneyWithoutCurrency / moneyWithoutTrailingZeros / weightWithUnit" />
          <Snippet code={`// Data
import { date } from "liquidify";
<time>{date(product.published_at, "%d/%m/%Y")}</time>`} language="tsx" title="date" />
        </div>
      </div>

      <div className="ref-block">
        <h3 id="strings">{copy.strings}</h3>
        <p className="ref-note">{copy.stringsText}</p>
        <Snippet code={STRING_LIKE} language="tsx" title="STRING_LIKE_METHODS" />
      </div>

      <div className="ref-block">
        <h3 id="classnames">{copy.classnames}</h3>
        <p className="ref-note">{copy.classnamesText}</p>
        <div className={styles.refCodeGrid}>
          <Snippet code={CLASSNAMES} language="tsx" title="CLASSNAMES_FNS" />
          <Snippet code={CLASSNAME_USAGE} language="tsx" title={pt ? "Formas aceitas" : "Accepted forms"} />
        </div>
      </div>

      <div className="ref-block">
        <h3 id="operators">{copy.operators}</h3>
        <p className="ref-note">{copy.operatorsText}</p>
        <Snippet code={FORBIDDEN} language="tsx" title={pt ? "Proibido dentro de ilhas" : "Forbidden inside islands"} />
      </div>
    </section>
  );
}
