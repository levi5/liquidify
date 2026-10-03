import { useLocale } from "../../i18n.tsx";
import type { ReactNode } from "react";
import Snippet from "../Snippet/index.tsx";
import styles from "./style.module.css";
import { cx } from "../../constants/cx.ts";
import {
  SECTIONS_TSX,
  SECTIONS_LIQUID,
  SNIPPETS_TSX,
  SNIPPETS_LIQUID,
  REACT_TSX,
  REACT_LIQUID,
  DOM_TSX,
  DOM_LIQUID,
  GLOBAL_TSX,
  GLOBAL_OUT,
  SCRIPT_TSX,
  SCRIPT_OUT,
  BLOCKS_TSX,
  BLOCKS_OUT,
  REACT_ID_TSX,
  REACT_ID_OUT,
  CONTEXT_TSX,
  CONTEXT_OUT,
  SCHEMA_TSX,
  CSS_TSX,
  EQUIV_TSX,
  EQUIV_LIQUID,
  VALIDATION_ERROR_TSX,
  VALIDATION_OK_TSX,
} from "../../cms/directives.ts";

type DirectiveDoc = {
  id: string;
  directive: string;
  generates: string;
  when: string;
  rule: string;
  tsxTitle: string;
  tsx: string;
  tsxLang?: "tsx" | "plain";
  outTitle: string;
  out: string;
  outLang?: "liquid" | "plain";
};

function DirectiveCard({
  id,
  name,
  gen,
  when,
  rule,
  children,
  className,
}: {
  id: string;
  name: string;
  gen?: string;
  when: string;
  rule?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={cx(styles.directiveCard, className)} id={id}>
      <header className={styles.directiveHead}>
        <code className={styles.directiveName}>{name}</code>
        {gen && <span className={styles.directiveGen}>→ {gen}</span>}
      </header>
      <p className={styles.directiveWhen}>{when}</p>
      {rule && <p className={styles.directiveRule}>{rule}</p>}
      {children}
    </article>
  );
}

export default function Directives() {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";

  const docs: DirectiveDoc[] = [
    {
      id: "sections",
      directive: "'use sections'",
      generates: "sections/*.liquid + {% schema %} + {% stylesheet %}",
      when: pt
        ? "Conteúdo editável no Theme Editor (Hero, coleção, produto). Exporte schema + presets."
        : "Theme Editor-editable content (hero, collection, product). Export schema + presets.",
      rule: pt
        ? "leia section.settings / section.blocks; nunca use estado ou eventos aqui."
        : "read section.settings / section.blocks; never use state or events here.",
      tsxTitle: "Hero/index.tsx",
      tsx: SECTIONS_TSX,
      outTitle: "sections/hero.liquid",
      out: SECTIONS_LIQUID,
    },
    {
      id: "snippets",
      directive: "'use snippets'",
      generates: "snippets/*.liquid",
      when: pt ? "Markup reutilizável sem JS: badges, cards, menus, filtros." : "Reusable markup without JS: badges, cards, menus, filters.",
      rule: pt
        ? "props viram variáveis do {% render %}; {x} escapa; filtros sempre em 'string'."
        : "props become {% render %} variables; {x} escapes; filters always inside a 'string'.",
      tsxTitle: "Badges/index.tsx",
      tsx: SNIPPETS_TSX,
      outTitle: "snippets/badges.liquid",
      out: SNIPPETS_LIQUID,
    },
    {
      id: "react",
      directive: "'use react'",
      generates: pt ? "<react-island> + props JSON + assets/*.js" : "<react-island> + JSON props + assets/*.js",
      when: pt
        ? "Interatividade real: carrinho, variantes, quantidade, busca. O Liquid renderiza o shell; o Preact hidrata."
        : "Real interactivity: cart, variants, quantity, search. Liquid renders the shell; Preact hydrates.",
      rule: pt
        ? "a ilha recebe props via <script data-react-props>; dados Shopify entram por <liquid-data>."
        : "the island receives props via <script data-react-props>; Shopify data enters via <liquid-data>.",
      tsxTitle: "MiniCart (HeaderUserOptions + MiniCart)",
      tsx: REACT_TSX,
      outTitle: "header-user-options.liquid + mini-cart.js",
      out: REACT_LIQUID,
    },
    {
      id: "dom",
      directive: '"use dom"',
      generates: "snippets/*.liquid + assets/*.js",
      when: pt ? "Comportamento imperativo de UM componente, sem React (menu, drawer, slider)." : "Imperative behavior for ONE component, no React (menu, drawer, slider).",
      rule: pt
        ? 'escreva "use dom"; como primeira linha do corpo da função; o JS vira o bundle do componente.'
        : 'write "use dom"; as the first line of the function body; the JS becomes the component bundle.',
      tsxTitle: "Menu/Desktop/index.tsx",
      tsx: DOM_TSX,
      outTitle: "menu-desktop.liquid + menu-desktop.js",
      out: DOM_LIQUID,
    },
    {
      id: "global",
      directive: "'use dom:global'",
      generates: "assets/*.js",
      when: pt ? "Script global da loja: carrinho Ajax, quick-add, toast, busca." : "Store-wide script: Ajax cart, quick-add, toast, search.",
      rule: pt ? "sem saída .liquid; importe no layout uma única vez." : "no .liquid output; include in the layout once.",
      tsxTitle: "scripts/theme.ts",
      tsx: GLOBAL_TSX,
      outTitle: "assets/theme.js",
      out: GLOBAL_OUT,
      outLang: "plain",
    },
    {
      id: "script",
      directive: "'use script'",
      generates: "assets/*.js",
      when: pt ? "JS puro isolado: Web Components, libs, polyfills." : "Isolated plain JS: Web Components, libs, polyfills.",
      rule: pt ? "somente bundle JS, sem Liquid — como 'use dom:global' mas para um arquivo." : "JS bundle only, no Liquid — like 'use dom:global' for one file.",
      tsxTitle: "web-components/Accordion/index.ts",
      tsx: SCRIPT_TSX,
      outTitle: "assets/accordion.js",
      out: SCRIPT_OUT,
      outLang: "plain",
    },
    {
      id: "blocks",
      directive: "'use blocks'",
      generates: "blocks/*.liquid",
      when: pt ? "Terceiro valor do eixo tipo: blocos reutilizáveis que o lojista monta no Theme Editor." : "Third type-axis value: reusable blocks merchants assemble in Theme Editor.",
      rule: pt ? "o bloco sai em blocks/ e é renderizado onde a section chama {% content_for 'blocks' %} (primitivo DynamicBlock)." : "blocks emit to blocks/ and render where the section calls {% content_for 'blocks' %} (DynamicBlock primitive).",
      tsxTitle: "PromoBenefits/index.tsx",
      tsx: BLOCKS_TSX,
      outTitle: "blocks/promo-benefits.liquid",
      out: BLOCKS_OUT,
    },
    {
      id: "react-id",
      directive: "'use react(id)'",
      generates: pt ? "<div id> próprio em vez de <react-island>" : "own <div id> instead of <react-island>",
      when: pt ? "Quando a ilha precisa de um ponto de montagem fixo em vez de hidratar onde foi usada." : "When the island needs a fixed mount point instead of hydrating where used.",
      rule: pt ? "'use react(hero-root)' (o # inicial é opcional) monta em <div id=\"hero-root\">. No consumo, elementId vira id= da ilha e eager hidrata sem esperar." : "'use react(hero-root)' (leading # optional) mounts on <div id=\"hero-root\">. At usage, elementId becomes the island id and eager hydrates without waiting.",
      tsxTitle: "HeroApp + consumo com props",
      tsx: REACT_ID_TSX,
      outTitle: "montagem + ilha com props",
      out: REACT_ID_OUT,
    },
    {
      id: "context",
      directive: "'use context'",
      generates: pt ? "ponte de createContext entre bundles" : "createContext bridge across bundles",
      when: pt ? "Segunda diretiva no arquivo da ilha quando dois bundles precisam do mesmo contexto (ex. ProductProvider → QuantitySelector)." : "Second directive in the island file when two bundles need the same context (e.g. ProductProvider → QuantitySelector).",
      rule: pt ? "cada ilha é um bundle esbuild separado; sem o marcador, createContext não atravessa bundles." : "each island is a separate esbuild bundle; without the marker, createContext does not cross bundles.",
      tsxTitle: "context/Product/index.tsx",
      tsx: CONTEXT_TSX,
      outTitle: "efeito no bundle",
      out: CONTEXT_OUT,
      outLang: "plain",
    },
  ];

  const ruleLabel = pt ? "Regra: " : "Rule: ";
  const generatedLabel = pt ? "gerado" : "generated";

  return (
    <section id="diretivas" className={cx("wrap", "section", styles.directivesPage)}>
      <p className="kicker">Compiler behavior</p>
      <h2>{pt ? "Diretivas: o que cada TSX vira" : "Directives: what each TSX becomes"}</h2>
      <p className="section-sub">
        {pt
          ? "A string literal no topo do arquivo decide o que o compilador gera. Eixo tipo (sections/snippets/blocks) = onde o Liquid sai; eixo modo (react/dom/script) = se sai JS junto; modificadores ('use react(id)', 'use context') ajustam a hidratação. Abaixo, cada um com exemplo real do template example."
          : "A string literal at the top of the file decides what the compiler emits. Type axis (sections/snippets/blocks) = where Liquid goes; mode axis (react/dom/script) = whether JS comes along; modifiers ('use react(id)', 'use context') tune hydration. Below, each with a real example from the example template."}
      </p>

      <DirectiveCard
        id="diretiva-validacao"
        name={pt ? "Regras de validação" : "Validation rules"}
        when={
          pt
            ? "O compilador reage com ValidationError quando: (1) código React (use react) aparece em sections/snippets/blocks; (2) JavaScript sem diretiva use dom/use script aparece em sections/snippets/blocks. Use 'use dom' para JS puro ou mantenha como Liquid puro."
            : "The compiler throws ValidationError when: (1) React code (use react) appears in sections/snippets/blocks; (2) JavaScript without use dom/use script directive appears in sections/snippets/blocks. Use 'use dom' for plain JS or keep it as pure Liquid."
        }
      >
        <div className="dir-cols">
          <Snippet
            title={pt ? "Erro: React em sections" : "Error: React in sections"}
            code={VALIDATION_ERROR_TSX}
            language="tsx"
          />
          <Snippet
            title={pt ? "Correto: use dom" : "Correct: use dom"}
            code={VALIDATION_OK_TSX}
            language="tsx"
          />
        </div>
      </DirectiveCard>

      <div className={styles.directiveList}>
        {docs.map((doc) => (
          <DirectiveCard
            key={doc.id}
            id={`diretiva-${doc.id}`}
            name={doc.directive}
            gen={doc.generates}
            when={doc.when}
            rule={`${ruleLabel}${doc.rule}`}
          >
            <div className="dir-cols">
              <Snippet title={`${doc.tsxTitle} (TSX)`} code={doc.tsx} language={doc.tsxLang ?? "tsx"} />
              <Snippet title={`${doc.outTitle} (${generatedLabel})`} code={doc.out} language={doc.outLang ?? "liquid"} />
            </div>
          </DirectiveCard>
        ))}
      </div>

      <DirectiveCard
        id="diretiva-schema-css"
        className={styles.equivCard}
        name={pt ? "Schema e CSS: formas aceitas" : "Schema and CSS: accepted forms"}
        gen={pt ? "vale a última declaração de schema" : "last schema declaration wins"}
        when={
          pt
            ? "O schema pode ser exportado de várias formas e resolvido de outro arquivo (re-export vale). Não-objeto vira ValidationError. O CSS colocado/importado (inclusive .scss) vira {% stylesheet %} — exceto em dom:global/script, que só geram JS."
            : "Schema can be exported in several forms and resolved from another file (re-export counts). Non-objects become ValidationError. Colocated/imported CSS (including .scss) becomes {% stylesheet %} — except dom:global/script, which only emit JS."
        }
      >
        <div className="dir-cols">
          <Snippet title="schema (todas valem)" code={SCHEMA_TSX} language="tsx" />
          <Snippet title="CSS (o que vira stylesheet)" code={CSS_TSX} language="tsx" />
        </div>
      </DirectiveCard>

      <DirectiveCard
        id="diretiva-equivalencias"
        className={styles.equivCard}
        name={pt ? "TSX → Liquid: equivalências" : "TSX → Liquid: equivalences"}
        gen={pt ? "leia lado a lado antes de escrever" : "read side by side before writing"}
        when={
          pt
            ? "O TSX é sintaxe tipada para Liquid: objetos Shopify (product, collection, cart, shop, routes, section) já estão no escopo. Filtros Liquid só sobrevivem dentro de strings."
            : "TSX is typed syntax for Liquid: Shopify objects (product, collection, cart, shop, routes, section) are already in scope. Liquid filters only survive inside strings."
        }
      >
        <div className="dir-cols">
          <Snippet title="TSX (o que você escreve)" code={EQUIV_TSX} language="tsx" />
          <Snippet title={pt ? "Liquid (o que sai)" : "Liquid (what comes out)"} code={EQUIV_LIQUID} language="liquid" />
        </div>
      </DirectiveCard>
    </section>
  );
}
