import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import styles from "./style.module.css";

const JSX_EVENT = `'use react'

import { useState } from 'preact/hooks'

export function Counter() {
  const [quantity, setQuantity] = useState(1)
  return (
    <button type="button" onClick={() => setQuantity(quantity + 1)}>
      Quantity: {quantity}
    </button>
  )
}
// onInput, onChange e onSubmit seguem o padrão.
// Com strictCsp, nada é interpretado de texto: sem new Function.`;

const ACTION_TSX = `'use react'

import { useLayoutEffect } from 'preact/hooks'
import { registerLiquidifyAction } from 'liquidify/runtime'

export function ActionBox({ actionName, children }) {
  useLayoutEffect(() => {
    return registerLiquidifyAction(actionName, function (event) {
      event.preventDefault()
      const button = this as HTMLButtonElement
      console.log('Selected product:', button.dataset.productId)
    })
  }, [actionName])
  return <div>{children}</div>
}`;

const ACTION_LIQUID = `{% assign buy_action = 'buy-' | append: section.id %}
<react-island component="ActionBox" data-hydrate="eager">
  <script type="application/json" data-react-props>
    {"actionName": {{ buy_action | json }}}
  </script>
  <button type="button"
    data-liquidify-on-click="{{ buy_action | escape }}"
    data-product-id="{{ product.id }}">
    Buy
  </button>
</react-island>

<!-- no layout, uma vez e nesta ordem: -->
<script src="{{ 'react-runtime.js' | asset_url }}" defer></script>
<script src="{{ 'action-box.js' | asset_url }}" defer></script>`;

const NATIVE_JS = `// theme global (dom:global): delegação sobrevive ao editor
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return
  const button = event.target.closest('button[data-product-buy]')
  if (!(button instanceof HTMLButtonElement) || button.disabled) return
  console.log('Selected product:', button.dataset.productBuy)
})`;

const BUS_TSX = `'use react'

import { useState } from 'preact/hooks'
import { emitLiquidifyEvent, useLiquidifyEvent } from 'liquidify/runtime'

export function CartNotice() {
  const [message, setMessage] = useState('')
  useLiquidifyEvent<{ message: string }>('cart:notice', (data) => {
    setMessage(data.message)
  })
  return (
    <button type="button"
      onClick={() => emitLiquidifyEvent('cart:notice', { message: 'Cart updated' })}>
      {message || 'Notify'}
    </button>
  )
}
// O hook cancela a assinatura no unmount. Eventos são globais:
// inclua o section id no nome/payload para restringir destinatários.`;

const DATA_ATTRS = `<react-island
  component="ProductDetails"
  data-liquid-title='"T-shirt"'
  data-liquid-available="false"
  data-liquid-count="0"
  data-liquid-tags='["new", "cotton"]'
  data-liquid-discount="null"
></react-island>
<!-- recebe: string, boolean, number, array, null.
     No Liquid: {{ value | json | escape }} em atributo com aspas. -->`;

export default function AdvancedIslands() {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const copy = pt
    ? {
        title: "Ilhas avançadas: eventos e editor",
        intro: "Três camadas de interação: eventos JSX dentro da ilha, actions registradas para o HTML do Liquid e listeners nativos globais. Mais o ciclo de vida no Theme Editor e as regras de tipos.",
        jsx: "1 · Eventos JSX na ilha",
        jsxText: "onClick recebe função compilada no bundle. Com strictCsp ativo (padrão), o runtime nunca transforma texto de atributo em função.",
        action: "2 · Actions: HTML do Liquid chamando React",
        actionText: "Registre a action com nome único por instância (ex. sufixo do section.id). O atributo guarda o nome — nunca código. O retorno do registro faz o cleanup no unmount.",
        allowTitle: "Eventos de ponte suportados",
        allow: ["click", "change", "input", "submit", "keydown", "keyup", "focus", "blur", "dblclick", "pointerdown", "pointerup"],
        allowNote: "A ponte atua nos nós convertidos pelo runtime — não instala listeners na página inteira.",
        native: "3 · Listeners nativos fora das ilhas",
        nativeText: "Delegação no document sobrevive a botões inseridos pelo editor depois do load. Sem reinstalar nada a cada mudança de section.",
        bus: "Conversa entre ilhas",
        busText: "useLiquidifyEvent assina (cancela no unmount); LiquidifyEvents.on manual exige guardar o cancelamento.",
        lifecycle: "Ciclo no Theme Editor",
        lifecycleRows: [["shopify:section:unload", "Desmonta roots da section na hora, cancela observers/timers e roda cleanups de efeito. Sem remontagem automática até o load."], ["shopify:section:load", "Monta ilhas e roots por ID respeitando a hidratação; espera o bundle se preciso. Repetidos não duplicam."], ["Fora do ciclo", "Outras sections seguem montadas. Mudanças de DOM têm tolerância de 100ms antes de desmontar."]],
        lifecycleHeaders: ["Evento", "Efeito"],
        lifecycleNote: "Não baixa bundles ausentes; seleção de bloco não conta como load. Listeners/timers globais precisam de cleanup em useEffect/useLayoutEffect.",
        types: "Tipos em data-liquid-*",
        typesText: "JSON preserva tipos (false, 0, null, arrays). Objetos fazem merge raso só com objetos; primitivos e null locais substituem herdados. data-liquid e data-liquid-store seguem as mesmas regras e alimentam a prop store.",
      }
    : {
        title: "Advanced islands: events and editor",
        intro: "Three interaction layers: JSX events inside the island, registered actions for Liquid HTML, and global native listeners. Plus the Theme Editor lifecycle and typing rules.",
        jsx: "1 · JSX events in the island",
        jsxText: "onClick receives a function compiled into the bundle. With strictCsp on (default), the runtime never turns attribute text into functions.",
        action: "2 · Actions: Liquid HTML calling React",
        actionText: "Register the action with a per-instance name (e.g. section.id suffix). The attribute holds the name — never code. The registration return performs unmount cleanup.",
        allowTitle: "Supported bridge events",
        allow: ["click", "change", "input", "submit", "keydown", "keyup", "focus", "blur", "dblclick", "pointerdown", "pointerup"],
        allowNote: "The bridge acts on runtime-converted nodes — it does not install listeners across the whole page.",
        native: "3 · Native listeners outside islands",
        nativeText: "Document delegation survives buttons inserted by the editor after load. Nothing to reinstall on section changes.",
        bus: "Talking across islands",
        busText: "useLiquidifyEvent subscribes (cancels on unmount); manual LiquidifyEvents.on requires keeping the cancel function.",
        lifecycle: "Theme Editor lifecycle",
        lifecycleRows: [["shopify:section:unload", "Immediately unmounts the section roots, cancels observers/timers, runs effect cleanups. No auto-remount until load."], ["shopify:section:load", "Mounts islands and roots by ID honoring hydration; waits for the bundle if needed. Repeats do not duplicate."], ["Outside the cycle", "Other sections stay mounted. DOM moves get 100ms tolerance before unmount."]],
        lifecycleHeaders: ["Event", "Effect"],
        lifecycleNote: "Does not download missing bundles; block selection is not a load. Global listeners/timers need cleanup in useEffect/useLayoutEffect.",
        types: "Types in data-liquid-*",
        typesText: "JSON keeps types (false, 0, null, arrays). Objects shallow-merge only with objects; local primitives and null replace inherited ones. data-liquid and data-liquid-store follow the same rules and feed the store prop.",
      };
  return (
    <section className={`'wrap' 'section'`}>
      <h2>{copy.title}</h2><p className="section-sub">{copy.intro}</p>
      <div className={styles.docsDeepGrid} style={{ marginTop: "2.56rem" }}>
        <article className={styles.docsDeepCard}><h3>{copy.jsx}</h3><p>{copy.jsxText}</p></article>
        <div><Snippet code={JSX_EVENT} language="tsx" /></div>
      </div>
      <div className={styles.docsDeepGrid}>
        <article className={styles.docsDeepCard}><h3>{copy.action}</h3><p>{copy.actionText}</p><h3 style={{ marginTop: "1.6rem" }}>{copy.allowTitle}</h3><ul className={styles.chipList}>{copy.allow.map((e) => <li key={e}><code>{e}</code></li>)}</ul><p>{copy.allowNote}</p></article>
        <div style={{ display: "grid", gap: "1.6rem", alignContent: "start" }}>
          <Snippet code={ACTION_TSX} language="tsx" />
          <Snippet code={ACTION_LIQUID} language="liquid" />
        </div>
      </div>
      <div className={styles.docsDeepGrid}>
        <article className={styles.docsDeepCard}><h3>{copy.native}</h3><p>{copy.nativeText}</p><h3 style={{ marginTop: "1.6rem" }}>{copy.bus}</h3><p>{copy.busText}</p></article>
        <div style={{ display: "grid", gap: "1.6rem", alignContent: "start" }}>
          <Snippet code={NATIVE_JS} language="tsx" />
          <Snippet code={BUS_TSX} language="tsx" />
        </div>
      </div>
      <div className={styles.docsDeepGrid}>
        <article className={styles.docsDeepCard}>
          <h3>{copy.lifecycle}</h3>
          <div className="table-wrap"><table className="table"><thead><tr>{copy.lifecycleHeaders.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{copy.lifecycleRows.map((row) => <tr key={row[0]}><td><code>{row[0]}</code></td><td>{row[1]}</td></tr>)}</tbody></table></div>
          <div className={styles.referenceCallout}><p>{copy.lifecycleNote}</p></div>
        </article>
        <article className={styles.docsDeepCard}>
          <h3>{copy.types}</h3>
          <p className="muted">{copy.typesText}</p>
          <Snippet code={DATA_ATTRS} language="liquid" />
        </article>
      </div>
    </section>
  );
}
