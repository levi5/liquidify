# Core Layer (Domain)

The `core` layer defines the fundamental business rules and contracts (interfaces) that the rest of the system must adhere to. It has no external infrastructure dependencies.

## Entities (`lib/core/entities`)

### `Config`

Represents the global Liquidify configuration loaded from `.liquidifyrc` or `liquidify.config.json`. Defines input/output directories and compiler behaviors.

### `ParsedComponent`

The final result of transpiling a file. Contains:
- `html`: The generated Liquid code.
- `script`: Compiled JavaScript (if applicable).
- `schema`: The extracted Shopify JSON schema.
- `mode`: Execution mode (`liquid`, `react`, `dom`, `dom:global`).
- `type`: Whether the component is a `section`, `snippet`, or `block`.

### `Liquid`

Defines core types and utilities related to Liquid syntax.

## Protocols (`lib/core/protocols`)

Protocols are interfaces enabling decoupling. Concrete implementations reside in the `infra` layer.

### `IParser`

Contract for parsing source files. Receives source string and returns a `ParsedComponent`.
- **Main Implementation**: `BabelLiquidParser`.

### `Compiler`

Defines how code (TS/JS/CSS) should be compiled.
- **Implementations**: `EsbuildCompiler`, `ReactComponentCompiler`.

### `FileSystem`

Interface abstracting disk access, enabling the use of virtual file systems during tests.
- **Implementation**: `NodeFileSystem`.

### `Generator`

Contract for generating target code from an internal structure.

### `PathResolver`

Resolves file paths, particularly useful for TypeScript alias imports.
