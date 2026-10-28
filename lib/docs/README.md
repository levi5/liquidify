# Liquidify Library Documentation

This folder contains the core of Liquidify, a compiler that transforms JSX/TSX components into Liquid code for Shopify.

## Detailed Documentation

For in-depth technical details, refer to the specific documents:

- [**Core Architecture (Domain)**](CORE.md): Entities and protocols.
- [**Parser Logic (Babel)**](PARSER_LOGIC.md): JSX to Liquid transformation.
- [**Extraction and Hydration**](COMPONENT_EXTRACTION.md): How client-side JS is isolated.
- [**Complex Algorithms**](COMPLEX_ALGORITHMS.md): Details on recursion and AST manipulation.
- [**Infrastructure Adapters**](INFRA_ADAPTERS.md): Compilers (Esbuild/React) and FileSystem.
- [**Services and Flow**](APPLICATION.md): Transpilation orchestration.

---

## Main File Mapping

### `lib/infra/adapters/parsers/babel/`

- **`ASTParser.ts`**: Wrapper around the Babel parser.
- **`babel-parser.ts`**: Main adapter coordinating the analysis flow.
- **`liquid-parser.ts`**: Orchestrator of the JSX -> Liquid conversion.
- **`liquid/`**: Sub-parsers for attributes, expressions, loops, etc.

### `lib/application/services/`

- **`transpile-file.ts`**: Read, parse, and write pipeline.
- **`validation-service.ts`**: Framework rules validator.

---

## Code Philosophy

- **Clean Architecture**: Clear separation between domain, application, and infrastructure.
- **Dependency Injection**: Facilitates testing and maintainability.
- **External Documentation**: Documentation resides in `.md` files, keeping the codebase clean (without excessive inline comments).
