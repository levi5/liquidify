import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import {
  TYPES_PRODUCT,
  TYPES_COLLECTION,
  TYPES_CART,
  TYPES_SHOP,
  TYPES_GLOBALS,
  TYPES_PAGINATE,
  TYPES_USAGE_SNIPPET,
  TYPES_COPY,
} from "../../cms/types.ts";

export default function TypesReference() {
  const { locale } = useLocale();
  const copy = TYPES_COPY[locale];

  return (
    <section className="wrap section">
      <h2>{copy.title}</h2>
      <p className="section-sub">{copy.intro}</p>

      <div className="ref-block">
        <h3 id="types-product">{copy.product}</h3>
        <p className="ref-note">{copy.productText}</p>
        <Snippet code={TYPES_PRODUCT} language="tsx" />
      </div>

      <div className="ref-block">
        <h3 id="types-collection">{copy.collection}</h3>
        <p className="ref-note">{copy.collectionText}</p>
        <Snippet code={TYPES_COLLECTION} language="tsx" />
      </div>

      <div className="ref-block">
        <h3 id="types-cart">{copy.cart}</h3>
        <p className="ref-note">{copy.cartText}</p>
        <Snippet code={TYPES_CART} language="tsx" />
      </div>

      <div className="ref-block">
        <h3 id="types-shop">{copy.shop}</h3>
        <p className="ref-note">{copy.shopText}</p>
        <Snippet code={TYPES_SHOP} language="tsx" />
      </div>

      <div className="ref-block">
        <h3 id="types-globals">{copy.globals}</h3>
        <p className="ref-note">{copy.globalsText}</p>
        <Snippet code={TYPES_GLOBALS} language="tsx" />
      </div>

      <div className="ref-block">
        <h3 id="types-paginate">{copy.paginate}</h3>
        <p className="ref-note">{copy.paginateText}</p>
        <Snippet code={TYPES_PAGINATE} language="tsx" />
      </div>

      <div className="ref-block">
        <h3 id="types-usage">{copy.usage}</h3>
        <p className="ref-note">{copy.usageText}</p>
        <Snippet code={TYPES_USAGE_SNIPPET} language="tsx" />
      </div>
    </section>
  );
}
