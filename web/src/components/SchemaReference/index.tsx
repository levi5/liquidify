import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import styles from "./style.module.css";

const SCHEMA_TSX = `// src/components/sections/Hero.tsx
"use sections";

export const schema = {
  name: "t:sections.hero.name",
  settings: [
    { type: "text", id: "heading", label: "t:settings.heading.label", default: "Hello" },
    { type: "richtext", id: "body", label: "t:settings.body.label" },
    { type: "range", id: "slides", min: 1, max: 8, step: 1, default: 3, label: "Slides" },
  ],
  blocks: [{ type: "slide", name: "Slide", settings: [{ type: "text", id: "title" }] }],
  presets: [{ name: "Hero" }],
};`;

const SCHEMA_LIQUID = `{% schema %}
{
  "name": "Hero",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "Hello" }
  ],
  "blocks": [{ "type": "slide", "name": "Slide" }],
  "presets": [{ "name": "Hero" }]
}
{% endschema %}`;

const VALIDATION = `// lib/application/services/schema-validation.ts
name      → non-empty string
settings  → every entry requires a type
id        → required, except on "header" and "paragraph" settings
id        → must be unique across settings
blocks    → every entry requires a type
type      → must be unique across blocks
presets   → every entry requires a name
// every message is prefixed with "Invalid schema: "`;

const TRANSLATION = `{ "locales": { "pt-BR": { "sections": { "hero": { "name": "Hero" } } } } }`;

const CONTENT_FOR = `<DynamicBlock slot={Blocks} />

// becomes:
// {% content_for 'blocks' %} <slot>

export const schema = {
  blocks: [{ type: "slide", limit: 4, name: "Slide" }],
};`;

export default function SchemaReference() {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const copy = pt
    ? {
        intro:
          "O schema é o contrato entre o Theme Editor e o seu componente. O Liquidify não inventa settings: ele serializa o objeto que você exporta e valida o que o Shopify exige.",
        how: "Como o schema é escrito",
        howText:
          "Use 'use sections' e exporte um objeto estático chamado schema. O compilador resolve imports estáticos, então você pode manter o schema em outro arquivo — mas ele precisa resolver para um objeto literal, não para uma chamada de função.",
        types: "Tipos de setting",
        typesHeaders: ["type", "O que o lojista controla", "Propriedades comuns"],
        typesRows: [
          ["text", "Uma linha de texto", "default, info, placeholder"],
          ["textarea", "Texto longo", "default, placeholder"],
          ["richtext", "Texto formatado", "default, value"],
          ["number", "Número", "default, min, max, step"],
          ["range", "Slider", "min, max, step, default, unit"],
          ["checkbox", "Boolean", "default"],
          ["select", "Lista suspensa", "options, default, groups"],
          ["color", "Cor", "default"],
          ["image_picker", "Imagem da biblioteca", "default"],
          ["video", "Vídeo", "options, default"],
          ["url", "Link", "default"],
          ["text_reference", "Produto, coleção, página…", "default"],
          ["font_picker", "Fonte do tema", "default"],
        ],
        typesNote:
          "header e paragraph são isentos da exigência de id — o Shopify os trata como texto editorial, não como setting.",
        presets: "Presets",
        presetsText:
          "Um preset é o que o lojista vê ao adicionar a section. Cada entrada exige name, e é aí que você define a ordem default dos blocks.",
        blocks: "Schemas de block",
        blocksText:
          "Blocks são as unidades repetíveis dentro de uma section. O slot do DynamicBlock vira {% content_for 'blocks' %}, e o limit trava quantos o lojista pode adicionar.",
        translations: "Traduções e labels",
        translationsText:
          "O prefixo t: faz o Shopify resolver a string no locale ativo. Use sempre que o label for visível para o lojista, senão o tema fica em inglês em lojas brasileiras.",
        limits: "Limites e defaults",
        limitsText:
          "O que o Liquidify impõe é pouco: nome não vazio, type presente, id único, name em cada preset. Todo o resto é o Theme Editor decidindo.",
      }
    : {
        intro:
          "The schema is the contract between the Theme Editor and your component. Liquidify does not invent settings: it serialises the object you export and validates what Shopify requires.",
        how: "How the schema is written",
        howText:
          "Use 'use sections' and export a static object named schema. The compiler resolves static imports, so you can keep the schema in another file — but it has to resolve to an object literal, not a function call.",
        types: "Setting types",
        typesHeaders: ["type", "What the merchant controls", "Common properties"],
        typesRows: [
          ["text", "One line of text", "default, info, placeholder"],
          ["textarea", "Long text", "default, placeholder"],
          ["richtext", "Formatted text", "default, value"],
          ["number", "Number", "default, min, max, step"],
          ["range", "Slider", "min, max, step, default, unit"],
          ["checkbox", "Boolean", "default"],
          ["select", "Dropdown", "options, default, groups"],
          ["color", "Colour", "default"],
          ["image_picker", "Library image", "default"],
          ["video", "Video", "options, default"],
          ["url", "Link", "default"],
          ["text_reference", "Product, collection, page…", "default"],
          ["font_picker", "Theme font", "default"],
        ],
        typesNote:
          "header and paragraph are exempt from the id requirement — Shopify treats them as editorial text, not as settings.",
        presets: "Presets",
        presetsText:
          "A preset is what the merchant sees when adding the section. Every entry requires a name, and it is where you set the default block order.",
        blocks: "Block schemas",
        blocksText:
          "Blocks are the repeatable units inside a section. The DynamicBlock slot becomes {% content_for 'blocks' %}, and limit caps how many the merchant may add.",
        translations: "Translations and labels",
        translationsText:
          "The t: prefix makes Shopify resolve the string in the active locale. Use it for any label the merchant sees, or your theme stays English in a Brazilian store.",
        limits: "Limits and defaults",
        limitsText:
          "What Liquidify enforces is short: non-empty name, type present, unique id, a name on every preset. The rest is the Theme Editor's call.",
      };

  return (
    <section className={`'wrap' 'section' styles.schemaReference`}>
      <h2>{pt ? "Referência de schema" : "Schema reference"}</h2>
      <p className="section-sub">{copy.intro}</p>

      <div className="ref-block">
        <h3 id="how">{copy.how}</h3>
        <p className="ref-note">{copy.howText}</p>
        <div className={styles.refCodeGrid}>
          <Snippet code={SCHEMA_TSX} language="tsx" title="schema.ts" />
          <Snippet code={SCHEMA_LIQUID} language="liquid" title="sections/hero.liquid" />
        </div>
      </div>

      <div className="ref-block">
        <h3 id="settings">{copy.types}</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {copy.typesHeaders.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {copy.typesRows.map((row) => (
                <tr key={row[0]}>
                  <td>
                    <code>{row[0]}</code>
                  </td>
                  <td>{row[1]}</td>
                  <td>
                    <code className="muted-code">{row[2]}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ref-note">{copy.typesNote}</p>
      </div>

      <div className="ref-block">
        <h3 id="presets">{copy.presets}</h3>
        <p className="ref-note">{copy.presetsText}</p>
      </div>

      <div className="ref-block">
        <h3 id="blocks">{copy.blocks}</h3>
        <p className="ref-note">{copy.blocksText}</p>
        <Snippet code={CONTENT_FOR} language="tsx" title="DynamicBlock" />
      </div>

      <div className="ref-block">
        <h3 id="translations">{copy.translations}</h3>
        <p className="ref-note">{copy.translationsText}</p>
        <Snippet code={TRANSLATION} language="json" title="locales/pt-BR.json" />
      </div>

      <div className="ref-block">
        <h3 id="limits">{copy.limits}</h3>
        <p className="ref-note">{copy.limitsText}</p>
        <Snippet code={VALIDATION} language="tsx" title="schema-validation.ts" />
      </div>
    </section>
  );
}
