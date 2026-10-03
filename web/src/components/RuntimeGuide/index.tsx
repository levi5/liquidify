import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import { IslandFigure } from "../Figures/index.tsx";
import styles from "./style.module.css";

const BRIDGE = `<liquid-data data-liquid-store="{{ product | json }}">
  <react-island id="product-provider" component="ProductProvider">
    <script type="application/json" data-react-props>
      {"elementId":"product-provider","selectFirstVariant":false}
    </script>
  </react-island>
</liquid-data>

// Browser events used by the example:
window.dispatchEvent(new CustomEvent('product:add-to-cart:success'))
window.addEventListener('cart:updated', refreshCart)`;

const LAZY_HYDRATION = `// Hidratação lazy com IntersectionObserver
// rootMargin: '200px' — hidrata antes de entrar na viewport

// Padrão: ilha hidrata quando se aproxima da viewport
<react-island component="MiniCart">

// Hidratação eager: pula o lazy, hidrata imediatamente
<react-island component="CriticalWidget" data-hydrate="eager">

// Placeholder prefix: __liquidify
// O runtime usa este prefixo para encontrar placeholders
// e substituir pelo componente montado`;

export default function RuntimeGuide() {
  const { locale } = useLocale();
  const copy = locale === "pt-BR" ? {
    title: "Ilhas e runtime no navegador", intro: "O tema não vira uma aplicação React inteira. Liquid renderiza a página primeiro; componentes com use react recebem um bundle próprio e são hidratados somente onde há estado ou interação.", lifecycle: "Ciclo de uma ilha", lifecycleItems: ["Liquid renderiza HTML e dados do Shopify no servidor.", "Liquidify emite o bundle da ilha em assets/*.js e o runtime compartilhado.", "theme.liquid carrega react-runtime.js com defer.", "O runtime encontra react-island, lê props serializadas e monta o componente.", "Eventos CustomEvent sincronizam ilhas sem criar uma store global obrigatória."], bridge: "Ponte Liquid → React", events: "Padrão de eventos do example", eventItems: ["product:add-to-cart:success atualiza e abre o mini-cart.", "product:add-to-cart:error apresenta feedback de disponibilidade.", "cart:updated mantém contador e drawer sincronizados.", "message::mini-cart abre o drawer a partir de outra área do tema."], csp: "CSP e segurança", cspText: "O runtime usa scripts de dados application/json em vez de interpolar props executáveis. Mantenha react.strictCsp ativo salvo se houver uma razão concreta para alterar a estratégia de runtime.", cleanup: "Limpeza e limites", cleanupItems: ["Remova listeners de window/document no cleanup de useEffect.", "Não hidrate dados que podem ser renderizados como Liquid simples.", "Não duplique o formulário de filtro: o drawer do example move o mesmo formulário para o dialog mobile.", "Formatar dinheiro e strings de ilha usando window.LiquidifyTheme para respeitar locale e currency."]
  } : {
    title: "Browser islands and runtime", intro: "The theme does not become a full React application. Liquid renders the page first; components with use react receive their own bundle and hydrate only where state or interaction is needed.", lifecycle: "Island lifecycle", lifecycleItems: ["Liquid renders HTML and Shopify data on the server.", "Liquidify emits the island bundle in assets/*.js and a shared runtime.", "theme.liquid loads react-runtime.js with defer.", "The runtime finds react-island, reads serialized props, and mounts the component.", "CustomEvent events synchronize islands without requiring a global store."], bridge: "Liquid → React bridge", events: "Example event pattern", eventItems: ["product:add-to-cart:success refreshes and opens mini-cart.", "product:add-to-cart:error provides availability feedback.", "cart:updated keeps counter and drawer synchronized.", "message::mini-cart opens the drawer from another theme area."], csp: "CSP and safety", cspText: "The runtime uses application/json data scripts instead of interpolating executable props. Keep react.strictCsp enabled unless there is a concrete reason to change runtime strategy.", cleanup: "Cleanup and boundaries", cleanupItems: ["Remove window/document listeners in useEffect cleanup.", "Do not hydrate data that can be rendered as simple Liquid.", "Do not duplicate filter form: the example drawer moves the same form into the mobile dialog.", "Format island money and strings through window.LiquidifyTheme to respect locale and currency."]
  };
  return (
    <section className={`wrap section ${styles.runtimeGuide}`}>
      <h2>{copy.title}</h2>
      <p className="section-sub">{copy.intro}</p>
      <IslandFigure />
      <div className={styles.runtimeGrid}>
        <article>
          <h3>{copy.lifecycle}</h3>
          <ol>{copy.lifecycleItems.map((item) => <li key={item}>{item}</li>)}</ol>
          <h3>{copy.events}</h3>
          <ul>{copy.eventItems.map((item) => <li key={item}>{item}</li>)}</ul>
          <h3>Lazy hydration</h3>
          <Snippet code={LAZY_HYDRATION} language="tsx" title="IntersectionObserver + data-hydrate" />
        </article>
        <div>
          <h3>{copy.bridge}</h3>
          <Snippet code={BRIDGE} language="liquid" />
        </div>
      </div>
      <div className={styles.runtimeBottom}>
        <article>
          <h3>{copy.csp}</h3>
          <p>{copy.cspText}</p>
        </article>
        <article>
          <h3>{copy.cleanup}</h3>
          <ul>{copy.cleanupItems.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      </div>
    </section>
  );
}
