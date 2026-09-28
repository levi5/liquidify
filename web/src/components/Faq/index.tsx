import { useLocale } from "../../i18n.tsx";
import { toHref } from "../../lib/routes.ts";
import styles from "./style.module.css";
import { cx } from "../../constants/cx.ts";

type QA = { q: string; a: string; link: [string, string] };

export default function Faq() {
  const { locale } = useLocale();
  const copy: { title: string; intro: string; groups: { heading: string; items: QA[] }[] } = locale === "pt-BR" ? {
    title: "Respostas curtas para falhas comuns",
    intro: "Se algo quebrou, procure o sintoma. Cada resposta aponta para a referência completa.",
    groups: [
      {
        heading: "Problemas no Theme Editor",
        items: [
          { q: "Minha section não aparece no editor", a: "Sections precisam de {% schema %} com presets. Confira se o arquivo usa \"use sections\" e se o schema tem presets. Depois rode o build de novo: o editor só lista o que foi compilado.", link: ["Escrever sections", "#/docs/authoring#sections-and-schemas"] },
          { q: "A página está em branco", a: "Quase sempre é dado faltando (produto, coleção ou menu que não existe na loja) ou um filtro aplicado a valor que não é string. Abra o console do navegador e o output gerado para isolar.", link: ["Dados disponíveis", "#/docs/authoring#data-in-scope"] },
          { q: "Mudei o TSX e nada mudou na loja", a: "O editor lê os arquivos gerados, não o TSX. Confirme que o watch está rodando e que sections/ foi regerado. Nunca edite sections/ à mão: o próximo build apaga.", link: ["Fluxo diário", "#/docs/start#daily-loop"] },
        ],
      },
      {
        heading: "Problemas de build",
        items: [
          { q: "O build não gera nada", a: "Confira liquidify.config.json: componentsDir precisa apontar para onde estão os TSX e output para a raiz do tema. Chave desconhecida aborta o build com sugestão Did you mean?.", link: ["Configuração", "#/api/config#options"] },
          { q: "Erro de sintaxe não suportada", a: "Nem todo JS compila: spread em lugares inesperados, .find com função externa e métodos proibidos dentro de ilhas são rejeitados com arquivo, linha e coluna. A mensagem diz exatamente o limite.", link: ["Erros e limites", "#/api/errors#unsupported"] },
          { q: "Theme Check reclama do Liquid gerado", a: "Rode o build antes do check: arquivos velhos em sections/ causam falsos erros. O manifest .liquidify-manifest.json rastreia o que é gerado e limpa o obsoleto.", link: ["Internos do build", "#/api/build#manifest"] },
        ],
      },
      {
        heading: "Problemas de dados",
        items: [
          { q: "Produtos ou coleções vêm vazios", a: "O compilador não cria dados: produtos, a coleção all e menus precisam existir na development store. Sem eles, loops {% for %} renderizam vazio e parece bug.", link: ["Dados no Admin", "#/docs/shopify#admin-data"] },
          { q: "Filtro reclama que o valor não é string", a: "Filtros como escape, downcase e money exigem string. Converta antes ou use os helpers TSX (raw, json, defaultValue) que emitem o filtro certo.", link: ["Filtros e helpers", "#/api/filters#helpers"] },
          { q: "A ilha não hidrata / evento não dispara", a: "Confira data-liquid-* com JSON válido, strictCsp ativo (sem new Function) e o ciclo shopify:section:load no editor. Actions Liquid→React passam por registerLiquidifyAction.", link: ["Ilhas e runtime", "#/docs/runtime#lifecycle"] },
        ],
      },
    ],
  } : {
    title: "Short answers to common failures",
    intro: "When something breaks, look up the symptom. Every answer points to the full reference.",
    groups: [
      {
        heading: "Theme Editor problems",
        items: [
          { q: "My section does not show in the editor", a: "Sections need {% schema %} with presets. Check the file uses \"use sections\" and the schema has presets. Then rebuild: the editor only lists what was compiled.", link: ["Writing sections", "#/docs/authoring#sections-and-schemas"] },
          { q: "The page is blank", a: "Almost always missing data (a product, collection, or menu that does not exist in the store) or a filter applied to a non-string value. Open the browser console and the generated output to isolate it.", link: ["Available data", "#/docs/authoring#data-in-scope"] },
          { q: "I changed the TSX and nothing changed in the store", a: "The editor reads generated files, not TSX. Confirm watch is running and sections/ was regenerated. Never hand-edit sections/: the next build wipes it.", link: ["Daily workflow", "#/docs/start#daily-loop"] },
        ],
      },
      {
        heading: "Build problems",
        items: [
          { q: "The build emits nothing", a: "Check liquidify.config.json: componentsDir must point at your TSX and output at the theme root. An unknown key aborts the build with a Did you mean? suggestion.", link: ["Configuration", "#/api/config#options"] },
          { q: "Unsupported syntax error", a: "Not all JS compiles: spread in odd places, .find with an external function, and forbidden methods inside islands are rejected with file, line, and column. The message states the exact limit.", link: ["Errors & limits", "#/api/errors#unsupported"] },
          { q: "Theme Check flags the generated Liquid", a: "Build before checking: stale files in sections/ cause false errors. The .liquidify-manifest.json tracks what is generated and cleans the obsolete.", link: ["Build internals", "#/api/build#manifest"] },
        ],
      },
      {
        heading: "Data problems",
        items: [
          { q: "Products or collections come back empty", a: "The compiler does not create data: products, the all collection, and menus must exist in the development store. Without them {% for %} loops render empty and it looks like a bug.", link: ["Admin data", "#/docs/shopify#admin-data"] },
          { q: "A filter complains the value is not a string", a: "Filters like escape, downcase, and money require strings. Convert first or use the TSX helpers (raw, json, defaultValue) that emit the right filter.", link: ["Filters & helpers", "#/api/filters#helpers"] },
          { q: "The island never hydrates / event never fires", a: "Check data-liquid-* holds valid JSON, strictCsp is on (no new Function), and the shopify:section:load cycle in the editor. Liquid→React actions go through registerLiquidifyAction.", link: ["Islands & runtime", "#/docs/runtime#lifecycle"] },
        ],
      },
    ],
  };
  return (
    <section className={cx("wrap", "section", styles.faq)}>
      <h2>{copy.title}</h2>
      <p className="section-sub">{copy.intro}</p>
      {copy.groups.map((group) => (
        <div key={group.heading}>
          <h3>{group.heading}</h3>
          <div className={styles.qaList}>
            {group.items.map((item) => (
              <article key={item.q} className={styles.qa}>
                <h4>{item.q}</h4>
                <p>{item.a} <a href={toHref(item.link[1])}>{item.link[0]} →</a></p>
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
