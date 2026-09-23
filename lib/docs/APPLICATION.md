# Application Layer

The `application` layer coordinates the data flow between the user (CLI) and the internal logic (Core/Infra).

## Services (`lib/application/services`)

### `TranspileFile`
This is the main service called during build or watch operations:
1. Receives a file path.
2. Reads the content using `FileSystem`.
3. Calls the `Parser` (`BabelLiquidParser`) to obtain the `ParsedComponent`.
4. Saves the generated files (.liquid, .json, .js, .css) in the corresponding Shopify theme folders, maintaining the project structure.

### `ValidationService`
Ensures the integrity of the generated Liquid code:
- Prevents complex React logic from being used in directories where Shopify requires pure Liquid.
- Warns against JavaScript usage missing the required directive (`'use dom'`).

---

# Main Layer (`lib/main`)

### Factories (`lib/main/factories`)

Liquidify uses the Factory pattern to instantiate the system. `makeLiquidifyBuilder` (or similar) is responsible for:
1. Instantiating infrastructure adapters (Esbuild, Babel, NodeFS).
2. Injecting them into the application services.
3. Returning a simple facade for the CLI to consume.

This enables future replacement of `esbuild` with another compiler or Babel with another parser without changing application logic.

