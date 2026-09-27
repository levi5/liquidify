import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import "./style.css";

const ERROR_CLASSES = `export class LiquidifyError extends Error {
  constructor(
    public readonly message: string,
    public readonly filePath?: string,
    public readonly location?: { line: number; column: number },
  ) {
    super(message)
    this.name = 'LiquidifyError'
  }
}

export class ValidationError extends LiquidifyError {
  constructor(message: string, filePath?: string, location?: Location) {
    super(message, filePath, location)
    this.name = 'ValidationError'
  }
}`;

const NAMING = `export function pascalToKebab(str = '') {
  return _pipe(
    str,
    (value) => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2'),
    (value) => value.toLowerCase(),
  )
}

const SAFE_FILE_NAME = /^[a-z0-9][a-z0-9-_]*$/`;

const LIMITS = `MAX_CSS_BYTES        = 1024 * 1024   // 1 MiB
MANIFEST_VERSION     = 1
Transpile cache      = 1000 entries, FIFO eviction
Watch debounce       = 200 ms
Lazy-hydration root  = '200px'
Detached-node unmount = 100 ms`;

const RESERVED = `export const OUTPUT_RESERVED = new Set([
  'assets/react-runtime.js',
  'snippets/script-global.liquid',
])

export const COMPONENT_TYPES = new Set(['sections', 'blocks', 'snippets'])`;

const RUNTIME_MESSAGES = `[Liquidify] An action requires a name and a function.
[Liquidify] Unsupported action event: <eventName>
[Liquidify] Action is not registered. Call registerLiquidifyAction before interaction: <name>
[Liquidify] Invalid JSON in <attribute>. Generate JSON with the Liquid json filter and escape attribute values.
[Liquidify] Failed to register <Component>. Check the component export and runtime load order.
[Liquidify] Root unmount failed. Check effect cleanup functions.
[Liquidify] Load react-runtime.js before component scripts.`;

export default function ErrorsReference() {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const copy = pt
    ? {
        intro:
          "O compilador falha de propósito e cedo: cada mensagem abaixo aponta o arquivo, a linha e a coluna, e nenhuma delas exige que você leia o código-fonte do compilador para entender o conserto.",
        unsupported: "Sintaxe não suportada",
        unsupportedHeaders: ["Você escreveu", "Mensagem", "Como corrigir"],
        unsupportedRows: [
          ["<div {...props} />", "JSX spread attributes are not supported in Liquid output. List props explicitly.", "Nomeie cada prop."],
          ["<div ns:attr={x} />", "Namespaced JSX attribute is not supported in Liquid output.", "Use data-*."],
          ["<div className={a && b} />", "Liquid block tags cannot live inside an attribute value.", "Suba a condição para fora da tag."],
          ["<div style={a ? x : y} />", "Liquid block tags are not supported inside style=\"...\".", "Isto é uma escolha deliberada: style é uma string."],
          ["for (const k in obj)", "for...in iterates keys, not values.", "Use for...of, ou passe as entradas como array."],
          ["JSON.parse(s)", "JSON.parse() has no Liquid equivalent.", "Passe os dados já parseados como prop."],
          ["Object.keys(o)", "Object.keys() has no direct Liquid filter.", "Passe as chaves como array."],
          ["styles[dynamicKey]", "CSS module access requires a static key.", "A chave precisa ser literal."],
        ],
        primitive: "Atributos obrigatórios ausentes",
        primitiveHeaders: ["Componente", "Prop obrigatória", "Mensagem"],
        primitiveRows: [
          ["RenderSnippet", "slot (estático)", "requires a static \"slot\". Dynamic expressions are not supported."],
          ["RenderSvg", "name", "requires a \"name\" attribute."],
          ["FormBlock", "name", "requires a \"name\" attribute."],
          ["PaginateByLiquid", "collection e by", "requires \"collection\" and \"by\"."],
          ["UnlessBlock", "condition", "requires a \"condition\" attribute."],
          ["CaptureBlock", "as", "requires an \"as\" attribute."],
          ["TablerowByLiquid", "collection", "requires a \"collection\" attribute."],
          ["Raw", "html", "requires an \"html\" attribute."],
          ["DynamicBlock", "slot (array estática)", "\"slot\" must be a static string, identifier, or array."],
        ],
        loops: "Limites de loop e expressão",
        loopsText:
          "O padrão é sempre o mesmo: o que a saída precisa mostrar tem de ser visível no código gerado, então callbacks inline são obrigatórios. A mensagem sempre mostra a forma exata que compila.",
        configErrors: "Erros de config e manifest",
        configHeaders: ["Causa", "Mensagem"],
        configRows: [
          ["JSON inválido", "Invalid JSON in <file>"],
          ["Chave desconhecida", "Unknown configuration key \"x\". Did you mean \"y\"?"],
          ["Path vazio", "Configuration requires non-empty string componentsDir and output."],
          ["force inválido", "Configuration force must be a boolean."],
          ["react inválido", "Configuration react must be an object."],
          ["strictCsp inválido", "Configuration react.strictCsp must be a boolean."],
          ["Versão do manifest", "Invalid output manifest: expected version 1 and an entries object."],
          ["Path reservado", "Output path is reserved by Liquidify: <path>"],
          ["Conflito de saída", "Output conflict: <path> is also generated by <owner>."],
          ["Nome inseguro", "Unsafe component name: expected kebab-case [a-z0-9-_]."],
        ],
        naming: "Regras de nome",
        namingText:
          "O nome do arquivo de saída vem do nome do componente em kebab-case. O padrão de segurança exige que o nome comece com letra ou dígito e contenha apenas [a-z0-9-_] — é isso que impede escrever fora do diretório alvo.",
        limits: "Limites rígidos",
        limitsText:
          "Estes números estão no código, não em documentação, e podem mudar sem aviso. Nenhum deles é surprising o bastante para você precisar contornar.",
        runtimeConsole: "Mensagens de console do runtime",
        runtimeConsoleText:
          "Estas vão para o console do navegador, não para o build. As duas últimas são as que mais confundem: a primeira porque a ordem dos scripts importa, a segunda porque um effect sem cleanup derruba a ilha inteira.",
      }
    : {
        intro:
          "The compiler fails early and on purpose: every message below names the file, line, and column, and none of them requires you to read the compiler source to know the fix.",
        unsupported: "Unsupported syntax",
        unsupportedHeaders: ["You wrote", "Message", "How to fix it"],
        unsupportedRows: [
          ["<div {...props} />", "JSX spread attributes are not supported in Liquid output. List props explicitly.", "Name each prop."],
          ["<div ns:attr={x} />", "Namespaced JSX attribute is not supported in Liquid output.", "Use data-*."],
          ["<div className={a && b} />", "Liquid block tags cannot live inside an attribute value.", "Hoist the condition outside the tag."],
          ["<div style={a ? x : y} />", "Liquid block tags are not supported inside style=\"...\".", "Deliberate: style is a string."],
          ["for (const k in obj)", "for...in iterates keys, not values.", "Use for...of, or pass entries as an array."],
          ["JSON.parse(s)", "JSON.parse() has no Liquid equivalent.", "Pass already-parsed data as a prop."],
          ["Object.keys(o)", "Object.keys() has no direct Liquid filter.", "Pass the keys as an array."],
          ["styles[dynamicKey]", "CSS module access requires a static key.", "The key must be a literal."],
        ],
        primitive: "Missing primitive attributes",
        primitiveHeaders: ["Component", "Required prop", "Message"],
        primitiveRows: [
          ["RenderSnippet", "slot (static)", "requires a static \"slot\". Dynamic expressions are not supported."],
          ["RenderSvg", "name", "requires a \"name\" attribute."],
          ["FormBlock", "name", "requires a \"name\" attribute."],
          ["PaginateByLiquid", "collection and by", "requires \"collection\" and \"by\"."],
          ["UnlessBlock", "condition", "requires a \"condition\" attribute."],
          ["CaptureBlock", "as", "requires an \"as\" attribute."],
          ["TablerowByLiquid", "collection", "requires a \"collection\" attribute."],
          ["Raw", "html", "requires an \"html\" attribute."],
          ["DynamicBlock", "slot (static array)", "\"slot\" must be a static string, identifier, or array."],
        ],
        loops: "Loop and expression limits",
        loopsText:
          "The pattern is always the same: whatever the output must show has to be visible in the generated code, so inline callbacks are mandatory. The message always shows the exact shape that compiles.",
        configErrors: "Config and manifest errors",
        configHeaders: ["Cause", "Message"],
        configRows: [
          ["Invalid JSON", "Invalid JSON in <file>"],
          ["Unknown key", "Unknown configuration key \"x\". Did you mean \"y\"?"],
          ["Empty path", "Configuration requires non-empty string componentsDir and output."],
          ["Bad force", "Configuration force must be a boolean."],
          ["Bad react", "Configuration react must be an object."],
          ["Bad strictCsp", "Configuration react.strictCsp must be a boolean."],
          ["Manifest version", "Invalid output manifest: expected version 1 and an entries object."],
          ["Reserved path", "Output path is reserved by Liquidify: <path>"],
          ["Output conflict", "Output conflict: <path> is also generated by <owner>."],
          ["Unsafe name", "Unsafe component name: expected kebab-case [a-z0-9-_]."],
        ],
        naming: "Naming rules",
        namingText:
          "The output filename comes from the kebab-cased component name. The safety pattern requires a leading letter or digit and only [a-z0-9-_] after it — that is what makes writing outside the target directory impossible.",
        limits: "Hard limits",
        limitsText:
          "These numbers live in the code, not in prose, and may change without notice. None of them is surprising enough for you to need to work around it.",
        runtimeConsole: "Runtime console messages",
        runtimeConsoleText:
          "These go to the browser console, not to the build. The last two are the ones that confuse people: the first because script order matters, the second because one effect without a cleanup takes the whole island down.",
      };

  const rowTable = (id: string, title: string, headers: string[], rows: string[][], text?: string) => (
    <div className="ref-block" key={id}>
      <h3 id={id}>{title}</h3>
      {text && <p className="ref-note">{text}</p>}
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
              <tr key={row.join("|")}>
                {row.map((cell, index) => (
                  <td key={cell}>
                    {index === 0 ? <code>{cell}</code> : <code className="muted-code">{cell}</code>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <section className="wrap section errors-reference">
      <h2>{pt ? "Erros e limites" : "Errors and limits"}</h2>
      <p className="section-sub">{copy.intro}</p>
      <Snippet code={ERROR_CLASSES} language="tsx" title={pt ? "Classes de erro" : "Error classes"} />

      {rowTable("unsupported", copy.unsupported, copy.unsupportedHeaders, copy.unsupportedRows)}
      {rowTable("primitive-attrs", copy.primitive, copy.primitiveHeaders, copy.primitiveRows)}

      <div className="ref-block">
        <h3 id="loops">{copy.loops}</h3>
        <p className="ref-note">{copy.loopsText}</p>
        <div className="table-wrap">
          <table className="table">
            <tbody>
              {[
                ["items.map(item => item.title)", "{% for %} com interpolação"],
                ["items.filter(item => item.available)", "{% if %} dentro do for"],
                ["items.find(item => item.available)", "{% assign %} + {% if %}"],
                ["items.some(item => item.available)", "mesma forma de .find()"],
                ["classNames(a, b && c)", "lista estática de classes"],
                ["styles.button", "acesso estático a CSS module"],
                ["a + b * c", "aritmética simples, sem parênteses aninhados"],
                ["Math.max(a, b)", "dois argumentos simples, sem spread"],
              ].map((row) => (
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

      {rowTable("config-errors", copy.configErrors, copy.configHeaders, copy.configRows)}

      <div className="ref-block">
        <h3 id="naming">{copy.naming}</h3>
        <p className="ref-note">{copy.namingText}</p>
        <Snippet code={NAMING} language="tsx" title="lib/shared/string.ts" />
        <Snippet code={RESERVED} language="tsx" title={pt ? "Reservas do output" : "Output reservations"} />
      </div>

      <div className="ref-block">
        <h3 id="limits">{copy.limits}</h3>
        <p className="ref-note">{copy.limitsText}</p>
        <Snippet code={LIMITS} language="tsx" title="limites" />
      </div>

      <div className="ref-block">
        <h3 id="runtime-console">{copy.runtimeConsole}</h3>
        <p className="ref-note">{copy.runtimeConsoleText}</p>
        <Snippet code={RUNTIME_MESSAGES} language="plain" title="console" />
      </div>
    </section>
  );
}
