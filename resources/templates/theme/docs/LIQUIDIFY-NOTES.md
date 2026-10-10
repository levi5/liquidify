# Notes on Liquidify Integration

This theme demonstrates `use sections`, `use snippets`, `use react`, `RenderSnippet`, `FormBlock`, `PaginateByLiquid`, schemas, loops with `.map()`/`.slice()`, money filters, and the Liquid → Preact data bridge. The original copy used the published `1.0.0-alpha.5` package; this example utilizes the local build in `../dist`. The items below record edge cases and compiler behaviors identified during integration, along with adaptations maintained in the theme.

## Cases Encountered During Integration

1. **Implicit Returns in Liquid Components:** `export const Header = () => <header>...</header>` completed build but produced only schema. Sections and snippets use explicit function bodies with `return`. Liquidify detects empty sections.
2. **Automatic JSX and Preact Runtime:** `preact/jsx-runtime` from imported modules attempted to access `options.vnode` on the `window.React` object, which is `preact/compat` in the runtime bundle. The theme uses the classic transform with `React.createElement` and `React.Fragment` in `tsconfig.json`. Shared components import `preact/compat`; islands receive the React object from the generated runtime.
3. **`liquid-data` Bridge and Escaped JSON:** The library transforms `liquid-data` attributes into `application/json` scripts. Applying `escape` in that context leaves HTML entities in the JSON, and the runtime does not collect sibling scripts as separate props. The theme uses a standard `div.island-bridge` with `data-liquid-store="{{ product | json | escape }}"`. The browser decodes the attribute and the runtime receives the parsed object. Data remains protected within HTML attribute context.
4. **Template Literals in Attributes:** Expressions such as `` href={`${routes.root_url}#essence`} `` produced `&quot;` inside the generated Liquid output. In such cases, the theme applies direct Liquid interpolation in the attribute.
5. **Non-Empty HTML Elements Self-Closing:** `<span />` was emitted literally. The browser kept the span open and nested subsequent text within it. The theme uses `<span></span>` for empty spans and explicit closing tags on contact form `textarea`. The build verification script flags these cases.
6. **Dynamic Boolean Attributes:** `checked={value.active}` produced `checked="false"`, which still checks a checkbox in HTML. `checked={value.active === true}` generates a Liquid condition wrapping the presence of the attribute.
7. **Methods in Conditional Assignments:** `const heading = condition ? current_tags.join(' + ') : collection.title` left `.join()` in the Liquid output, rejected by Shopify. Title output now uses a JSX condition and the native Liquid `join` filter directly.
8. **SVG Attribute Naming:** `strokeWidth`, `strokeLinecap`, and `strokeLinejoin` were converted to lower-case names without hyphens. The SVG snippet uses native attributes `stroke-width`, `stroke-linecap`, and `stroke-linejoin`.
9. **Pagination Scope:** The `paginate` object is passed explicitly as `pager` to the snippet to preserve scope when using `render`.
10. **Configurable Page Size:** The theme uses `by="section.settings.products_per_page"` to output the Liquid page size expression. The local library declares `by` as `number | string`.
11. **Logical Expressions in Boolean Attributes:** `disabled={!available || requires_plan}` turns into an invalid text attribute. The fallback uses a `fieldset` with an explicit comparison for required subscription plans and keeps the simple availability condition on the button.
12. **Liquid Tags in Strings with Filters:** A JSX string containing `{% assign ... | default: ... %}` is wrapped in `{{ ... }}` because of the pipe `|`. The section declares variables in TSX (`const selected_sort = collection.sort_by || collection.default_sort_by`) to emit the `assign`. Strings containing filters remain reserved for output expressions.

13. **Liquid translations in TSX:** Storefront copy uses string literals such as `{"'products.product.add_to_bag' | t"}`. The parser recognizes the Liquid filter expression and emits `{{ 'products.product.add_to_bag' | t }}`. Schema labels use `t:sections.<section>...` keys and resolve from the locale schema files.
14. **React island translations:** Liquid and Preact components share the active locale through `window.LiquidifyTheme.i18n`, populated in `layout/theme.liquid`. The `translate()` helper in `src/lib/shopify.ts` falls back to English when a key is unavailable.
15. **Bilingual defaults:** English is the default locale (`en.default.json` and `en.default.schema.json`); Brazilian Portuguese is provided by `pt-BR.json` and `pt-BR.schema.json`. Section settings edited by a merchant are not automatically translated, so fixed copy should use locale keys and merchant-configured content should be treated as store content.

Theme Check may emit `UndefinedObject` warnings for `script_*_loaded` flags injected by the compiler. These are bundle load guards initialized as `nil` in Liquid.

## Integration References

Add, update quantity, and cart fetching operations follow the [Shopify Ajax Cart API](https://shopify.dev/docs/api/ajax/reference/cart). Architecture follows [Shopify theme templates](https://shopify.dev/docs/storefronts/themes/architecture/templates), and catalog filtering uses [storefront filtering](https://shopify.dev/docs/storefronts/themes/navigation-search/filtering).

