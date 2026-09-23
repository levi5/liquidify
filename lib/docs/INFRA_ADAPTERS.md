# Infrastructure Adapters

This layer contains implementations that depend on external tooling.

## Compilers (`lib/infra/adapters/compilers`)

### `EsbuildCompiler`
Uses **Esbuild** to transpile TypeScript and minify JavaScript/CSS. Chosen for its extreme performance, making Liquidify's `watch` mode virtually instantaneous.

### `ReactComponentCompiler`
Used when the mode is `'use react'`:
- Generates an independent bundle for the component.
- Uses `runtime-builder.ts` to inject required libraries (React, ReactDOM/Preact) in an optimized manner.
- Ensures CSS styles associated with the React component are injected via `CssInjector`.

## File System (`lib/infra/adapters/fs`)

### `NodeFileSystem`
Implementation based on the Node.js `fs` module. Includes recursive folder creation logic, ensuring that Shopify theme structures are properly maintained when writing generated files.

