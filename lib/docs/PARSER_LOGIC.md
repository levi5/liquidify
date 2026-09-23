# Parser and Transformation Logic (Babel)

This section details how Liquidify leverages Babel to transform JSX/TypeScript into Liquid and JavaScript.

## Analysis Flow (`BabelLiquidParser`)

The `parse` process follows this sequence:
1. **AST Generation**: Source code is transformed into an Abstract Syntax Tree (AST).
2. **Metadata Extraction (`ComponentExtractor`)**: Analyzes imports, export default, directives, and identifies whether a main JSX element exists.
3. **Validation**: `ValidationService` verifies whether the code is allowed in the target directory.
4. **CSS Processing**: Extracts styles and CSS Modules imports.
5. **JSX -> Liquid Conversion (`LiquidParser`)**: Where the transformation happens.

---

## `LiquidParser` Sub-Components

`LiquidParser` orchestrates several specialized sub-parsers:

### `LiquidAttributeConverter`
Transforms JSX attributes into HTML/Liquid attributes.
- **Event Handlers**: Converts `onClick={handler}` into global Liquidify calls (e.g., `onclick="liquidify['comp'].handler(event)"`) in DOM mode.
- **Dynamic Classes**: Handles `className` and template literals.
- **Booleans**: Converts simple conditionals into inline `{% if %}` tags.

### `LiquidExpressionParser`
Parses expressions inside `{ }`.
- Supports mapping JS methods to Liquid filters (e.g., `.toLowerCase()` -> `| downcase`).
- Resolves variables imported from other files.

### `LiquidLoopParser`
Identifies `.map()` patterns in JSX and transforms them into `{% for item in collection %}` blocks.

### `LiquidBlockParser`
Handles the special `<DynamicBlock />` tag, which Shopify uses to allow merchant drag-and-drop blocks inside a section. It generates `{% content_for 'blocks' %}` code and extracts the corresponding schema.

### `LiquidConditionalParser`
Transforms Ternary Operators (`a ? b : c`) and Short-circuits (`a && b`) into `{% if %}` and `{% unless %}` blocks. It manages recursive code generation to ensure nested conditionals function correctly in Liquid.

### `LiquidPaginateParser`
Transforms the `<PaginateByLiquid />` component into Shopify's `{% paginate %}` tag, enabling native pagination controlled via JSX.

### `LiquidSvgParser`
Handles SVG rendering via custom tags, facilitating icon reuse across the theme.

### `LiquidVariableParser`
Manages identifier and variable conversions, ensuring that renamed variables (such as inside loops) are properly propagated to the final Liquid code.

### `LiquidSnippetParser`
Detects components that should render as Shopify snippets (`{% render 'snippet' %}`).

### `LiquidHtmlParser`
Responsible for the final rendering of standard HTML tags:
- Handles `dangerouslySetInnerHTML`.
- Ensures proper tag opening and closing.

---

## Schema Extraction (`SchemaExtractor`)

Liquidify looks for a variable named `schema` or a specific comment to generate the `.json` file that Shopify uses to configure sections and blocks. It analyzes the JavaScript object and converts it faithfully to the JSON schema format required by Shopify.

## Script Generation (`ScriptGenerator`)

When the `'use dom'` or `'use script'` directive is found:
1. The compiler collects all top-level function and variable declarations.
2. They are wrapped in an isolated structure that allows hydration and safe execution on the client while preserving component context.

