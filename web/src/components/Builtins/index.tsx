import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import "./style.css";

const IMPORT = `import {
  DynamicBlock,
  RenderSnippet,
  RenderSvg,
  PaginateByLiquid,
  FormBlock,
} from 'liquidify'`;

const ROWS = [
  {
    name: "DynamicBlock",
    generates: '{% content_for "blocks" %}',
  },
  {
    name: "RenderSnippet",
    generates: "{% render 'snippet' %}",
    example: "<RenderSnippet slot={Card} item={item} />",
  },
  {
    name: "RenderSvg",
    generates: "SVG inline via Liquid",
    example: '<RenderSvg name="delivery.svg" />',
  },
  {
    name: "PaginateByLiquid",
    generates: "{% paginate %}",
  },
  {
    name: "FormBlock",
    generates: "{% form %}",
  },
];

export default function Builtins() {
  const { locale } = useLocale();
  const copy = locale === "pt-BR"
    ? { title: "Componentes nativos", intro: "Importe de", headers: ["Componente", "Gera", "Exemplo"], examples: ["Blocos dinâmicos do editor", "<RenderSnippet slot={Card} item={item} />", '<RenderSvg name="delivery.svg" />', "Paginação de coleções e busca", "Newsletter, contato e carrinho"] }
    : { title: "Built-in components", intro: "Import from", headers: ["Component", "Generates", "Example"], examples: ["Dynamic theme-editor blocks", "<RenderSnippet slot={Card} item={item} />", '<RenderSvg name="delivery.svg" />', "Collection and search pagination", "Newsletter, contact, and cart"] };
  return (
    <section id="componentes" className="wrap section">
      <p className="kicker">Native Liquid, typed TSX</p>
      <h2>{copy.title}</h2>
      <p className="muted">
        {copy.intro} <code>liquidify</code> {locale === "pt-BR" ? "e use Liquid nativo dentro do TSX." : "and use native Liquid inside TSX."}
      </p>
      <Snippet code={IMPORT} language="tsx" />
      <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {copy.headers.map((header) => <th key={header}>{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, index) => (
            <tr key={row.name}>
              <td>
                <code>{row.name}</code>
              </td>
              <td>
                <code>{row.generates}</code>
              </td>
              <td>
                <code>{copy.examples[index]}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </section>
  );
}
