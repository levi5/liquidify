import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import "./style.css";

const RUNTIME_TS = `import {
  registerLiquidifyAction,
  useLiquidifyEvent,
  emitLiquidifyEvent,
} from "liquidify/runtime";

registerLiquidifyAction("add-to-cart", function (event) {
  const id = this.dataset.variantId;
  emitLiquidifyEvent("cart:add", { id });
});

useLiquidifyEvent("cart:add", ({ id }) => {
  // typed as any unless you pass a generic
});`;

const EVENT_BUS = `interface LiquidifyEventBus {
  on(event: string, callback: (data: any) => void): () => void
  off(event: string, callback: (data: any) => void): void
  emit(event: string, data?: any): void
}`;

const DOM_EVENTS = `const eventProp = {
  click: 'onClick',
  change: 'onChange',
  input: 'onInput',
  submit: 'onSubmit',
  keydown: 'onKeyDown',
  keyup: 'onKeyUp',
  focus: 'onFocus',
  blur: 'onBlur',
  dblclick: 'onDoubleClick',
  pointerdown: 'onPointerDown',
  pointerup: 'onPointerUp',
}`;

const ACTION = `export function registerLiquidifyAction(
  name: string,
  handler: (this: EventTarget, event: Event) => void,
): () => void {
  return window.registerLiquidifyAction(name, handler)
}`;

const WINDOW_GLOBALS = `LiquidifyTry: LiquidifyTry
LiquidifyParseJSON(text, node, attribute, fallback, allowText?): T | string
LiquidifyParseProps(node: Element): LiquidifyProps
LiquidifyGetProps(node: Element, propName?): LiquidifyProps
LiquidifyCreateReactElement(node: Node, index: number): unknown
LiquidifyCanMount(container: Element): boolean
LiquidifyMount(container: HTMLElement, name?): void
LiquidifyUnmount(container: HTMLElement): void
LiquidifyRegisterRoot(id: string, componentName: string): void
LiquidifyHydrate: Record<string, (container: any) => void>
LiquidifyJSXRuntime / LiquidifyJSXDevRuntime
LiquidifyEvents: LiquidifyEventBus
LiquidifyUseEvent / LiquidifyEmitEvent
LiquidifyTakePendingEvents<T>(event: string): T[]
LiquidifyActions: Map<string, (this: EventTarget, event: Event) => void>
registerLiquidifyAction(name, handler): () => void
React / ReactDOM / ReactDOMClient`;

export default function RuntimeReference() {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const copy = pt
    ? {
        intro:
          "liquidify/runtime é um módulo seguro para servidor: importá-lo em Node não faz nada. Só no navegador, com react-runtime.js carregado, as funções delegam para os globais de window.",
        module: "Exports do módulo",
        moduleHeaders: ["Export", "Assinatura", "Retorno"],
        moduleRows: [
          ["registerLiquidifyAction", "(name, handler) => void", "Função de unsubscribe"],
          ["registerLiquidIsland", "(name, component) => void", "void"],
          ["useLiquidifyEvent", "<T>(event, cb: (data: T) => void) => void", "void"],
          ["emitLiquidifyEvent", "<T>(event, data?: T) => void", "void"],
          ["LiquidifyEvents", "LiquidifyEventBus", "—"],
        ],
        moduleNote:
          "registerLiquidIsland registra um componente fora do pipeline de compilação. registerLiquidifyAction é a única função do módulo que delega para window; as outras são no-ops no servidor.",
        actions: "Registro de actions",
        actionsNote:
          "O handler roda com this apontando para event.currentTarget ou o nó que carrega o atributo. O unsubscribe é protegido por referência: só remove se o handler registrado ainda for o mesmo.",
        bus: "Semântica do event bus",
        busHeaders: ["Método", "Comportamento"],
        busRows: [
          ["on", "Registra o callback e devolve uma função de unsubscribe."],
          ["off", "Remove um callback específico."],
          ["emit", "Dispara um CustomEvent com bubbles: true e cancelable: true."],
        ],
        busNote:
          "Se ninguém está inscrito no momento do emit, o payload é guardado e replayado quando o primeiro assinante chegar. useLiquidifyEvent não expõe unsubscribe: ele usa um ref interno e cancela no unmount.",
        events: "Todos os nomes de evento",
        eventsHeaders: ["Evento", "Quem emite", "Efeito"],
        eventsRows: [
          ["liquidify:ready:<Component>", "A ilha, ao registrar", "Dispara no document quando o bundle termina de registrar."],
          ["liquidx:ready:<Component>", "A ilha (alias legado)", "Idêntico ao anterior."],
          ["shopify:section:load", "Plataforma Shopify", "Remonta as ilhas da section e tira a suspensão."],
          ["shopify:section:unload", "Plataforma Shopify", "Marca a subárvore como suspensa e roda os cleanups."],
        ],
        domEvents: "Eventos DOM suportados",
        domEventsNote:
          "data-liquidify-on-<event> só aceita estes dez nomes. Qualquer outro valor registra um aviso no console em vez de falhar.",
        globals: "Globais de window",
        globalsNote:
          "Definidos por assets/react-runtime.js, que o build sempre escreve. Eles existem para o runtime gerado, não para o seu código — exceto se você estiver escrevendo um handler de ilhas à mão.",
        package: "Exports do pacote e bins",
        packageHeaders: ["Chave", "Valor"],
        packageRows: [
          ["version", "1.1.0-alpha.4"],
          ["exports", '. e ./runtime'],
          ["main / types", "dist/index.js / dist/index.d.ts"],
          ["bin", "liquidify, liquidify-watch, liquidx, liquidx-watch"],
          ["files", "dist, resources, docs"],
        ],
        packageNote:
          "liquidify/runtime resolve para dist/types/runtime.js, que é o stub tipado. O runtime funcional do navegador é bundlado separado em assets/react-runtime.js.",
      }
    : {
        intro:
          "liquidify/runtime is a server-safe module: importing it in Node does nothing. Only in the browser, with react-runtime.js loaded, do the functions delegate to the window globals.",
        module: "Module exports",
        moduleHeaders: ["Export", "Signature", "Returns"],
        moduleRows: [
          ["registerLiquidifyAction", "(name, handler) => void", "Unsubscribe function"],
          ["registerLiquidIsland", "(name, component) => void", "void"],
          ["useLiquidifyEvent", "<T>(event, cb: (data: T) => void) => void", "void"],
          ["emitLiquidifyEvent", "<T>(event, data?: T) => void", "void"],
          ["LiquidifyEvents", "LiquidifyEventBus", "—"],
        ],
        moduleNote:
          "registerLiquidIsland registers a component outside the compile pipeline. registerLiquidifyAction is the only function in the module that delegates to window; the rest are no-ops on the server.",
        actions: "Action registry",
        actionsNote:
          "The handler runs with this bound to event.currentTarget or the node carrying the attribute. The unsubscribe is reference-guarded: it only deletes if the currently-registered handler is still the same one.",
        bus: "Event bus semantics",
        busHeaders: ["Method", "Behaviour"],
        busRows: [
          ["on", "Registers the callback and returns an unsubscribe function."],
          ["off", "Removes a specific callback."],
          ["emit", "Dispatches a CustomEvent with bubbles: true and cancelable: true."],
        ],
        busNote:
          "If nobody is subscribed at emit time, the payload is queued and replayed when the first subscriber arrives. useLiquidifyEvent exposes no unsubscribe: it holds the callback in a ref and cancels on unmount.",
        events: "Every event name",
        eventsHeaders: ["Event", "Emitted by", "Effect"],
        eventsRows: [
          ["liquidify:ready:<Component>", "The island, on registration", "Dispatched on document when the bundle finishes registering."],
          ["liquidx:ready:<Component>", "The island (legacy alias)", "Identical to the above."],
          ["shopify:section:load", "Shopify platform", "Re-mounts the section's islands and lifts the suspension."],
          ["shopify:section:unload", "Shopify platform", "Marks the subtree suspended and runs effect cleanups."],
        ],
        domEvents: "Supported DOM events",
        domEventsNote:
          "data-liquidify-on-<event> accepts only these ten names. Any other value logs a console warning instead of failing.",
        globals: "Window globals",
        globalsNote:
          "Defined by assets/react-runtime.js, which the build always writes. They exist for the generated runtime, not for your code — unless you are hand-writing an island handler.",
        package: "Package exports and bins",
        packageHeaders: ["Key", "Value"],
        packageRows: [
          ["version", "1.1.0-alpha.4"],
          ["exports", ". and ./runtime"],
          ["main / types", "dist/index.js / dist/index.d.ts"],
          ["bin", "liquidify, liquidify-watch, liquidx, liquidx-watch"],
          ["files", "dist, resources, docs"],
        ],
        packageNote:
          "liquidify/runtime resolves to dist/types/runtime.js, the typed stub. The functional browser runtime is bundled separately as assets/react-runtime.js.",
      };

  return (
    <section className="wrap section runtime-reference">
      <h2>Runtime API</h2>
      <p className="section-sub">{copy.intro}</p>

      <h3 id="module">{copy.module}</h3>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {copy.moduleHeaders.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {copy.moduleRows.map((row) => (
              <tr key={row[0]}>
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
      <p className="ref-note">{copy.moduleNote}</p>
      <Snippet code={RUNTIME_TS} language="tsx" title={pt ? "Uso típico" : "Typical usage"} />

      <h3 id="actions">{copy.actions}</h3>
      <p className="ref-note">{copy.actionsNote}</p>
      <Snippet code={ACTION} language="tsx" title="liquidify/runtime" />

      <h3 id="bus">{copy.bus}</h3>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {copy.busHeaders.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {copy.busRows.map((row) => (
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
      <p className="ref-note">{copy.busNote}</p>
      <Snippet code={EVENT_BUS} language="tsx" title="LiquidifyEventBus" />

      <h3 id="events">{copy.events}</h3>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {copy.eventsHeaders.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {copy.eventsRows.map((row) => (
              <tr key={row[0]}>
                <td>
                  <code>{row[0]}</code>
                </td>
                <td>{row[1]}</td>
                <td>{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 id="dom-events">{copy.domEvents}</h3>
      <p className="ref-note">{copy.domEventsNote}</p>
      <Snippet code={DOM_EVENTS} language="tsx" title={pt ? "Mapeamento para props React" : "Mapped to React props"} />

      <h3 id="globals">{copy.globals}</h3>
      <p className="ref-note">{copy.globalsNote}</p>
      <Snippet code={WINDOW_GLOBALS} language="tsx" title="Window" />

      <h3 id="package">{copy.package}</h3>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {copy.packageHeaders.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {copy.packageRows.map((row) => (
              <tr key={row[0]}>
                <td>
                  <code>{row[0]}</code>
                </td>
                <td>
                  <code>{row[1]}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ref-note">{copy.packageNote}</p>
    </section>
  );
}
