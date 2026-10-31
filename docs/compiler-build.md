# Compilation, imports and watch

## Incremental build

After the first `builder.build()`, the same instance reuses the runtime and recompiles components whose content or dependencies changed. Tracking covers local imports and reexports, dynamic imports with a literal path, `require()` with a literal path, and CSS/SCSS imports. Dependencies outside the components folder are also watched. Changes to the component registry may require rebuilding every component to refresh references and scripts.

The compilation cache lives in memory. A new instance performs a full build. Resolution does not follow dynamically computed paths nor changes in packages installed in `node_modules`.

`tsconfig.json` files found during a failed build stay on watch, including missing inherited files. Fixing or creating those files triggers a new compilation attempt.

To stop the watcher and wait for the observers to close:

```ts
await builder.dispose()
```

`disposeSync()` remains available for compatibility with the CLI.

## Generated outputs and cleanup

Each completed build records the generated files in `.liquidify-manifest.json`, inside the output folder. Keep this file locally between builds; it must not be published to the theme nor versioned.

A manifest with invalid JSON, entries, hashes or paths aborts the build with a diagnostic identifying the manifest, before processing its registered outputs.

When a component is removed or renamed, the next build deletes old outputs registered in the manifest. A file is only deleted if its content still matches the generated version. Manually edited files and unregistered files are preserved. Cleanup also works after restarting the compiler.

Global scripts and shared CSS use sections delimited by `liquidify:start` and `liquidify:end` comments. Content outside those sections is preserved. Do not edit the managed sections by hand.

Old files created before the manifest was adopted are not deleted automatically. Old global references without the delimiters are also preserved; remove obsolete references once when migrating.

Component and runtime output writes are deferred until every selected component has compiled and passed validation. Compilation errors preserve the previous outputs. Write failures trigger a best-effort rollback, including the runtime and manifest. Each file is replaced atomically using a temporary file in the same directory; a process crash can still interrupt the multi-file commit. This is not a crash-safe filesystem transaction.

`assets/react-runtime.js` is tracked by its hash in the manifest. Unmanaged or manually modified runtimes are not overwritten unless `force` is enabled. An identical pre-existing runtime can be adopted without `force`.

The Node filesystem adapter rejects symbolic links at the output root and anywhere below it, including files, aggregate outputs and the manifest. Use real directories for generated output. These checks are not a sandbox against another process concurrently replacing directory entries; build in a workspace writable only by trusted users.

## Trusted plugins

Local and npm plugins execute with the same filesystem, network and process privileges as the compiler. The TypeScript loader is not a sandbox and imposes no execution timeout. Never build an untrusted config or load an untrusted plugin outside an isolated environment. TypeScript plugin imports resolve relative to the plugin file. Relative JavaScript/CommonJS dependencies work through Node's `require`; dependent TypeScript files need a compatible loader or must be precompiled.

## React island props and escaping

Static props preserve booleans, nulls, numbers (including negative numbers), objects and arrays. `undefined` is serialized as JSON `null`. Liquid variables and supported Liquid helper calls such as `t(...)` are serialized with the JSON filter and script-safe escaping. Unsupported expressions produce a diagnostic instead of silently becoming `true`. Object and array literals must contain static values.

The hydration hint accepts `eager`, `eager={true}` or `eager={false}`. Dynamic values are rejected.

JSON serialization is not HTML escaping. Values rendered in HTML text or attributes still need a final `escape`/`escape_once` filter, even after `json`. Raw HTML APIs remain explicit trust boundaries and must never receive unsanitized user content.

## Data and schema imports

The Liquid parser and the schema extractor share resolution of:

- Relative paths, `.ts`, `.tsx`, `.js`, `.jsx` extensions and `index` files.
- `compilerOptions.paths` aliases and `baseUrl` from the nearest `tsconfig.json`.
- Config inheritance via `extends` with a relative path.
- Named exports, default exports, named reexports and `export *`.
- Static objects and arrays, local identifiers, spreads and `as const`.

Cycles between imports and reexports produce a diagnostic. Static data resolution does not execute functions nor replace the JavaScript bundler. Tsconfig inheritance by package name and namespace exports are not part of this support.

Without `baseUrl`, `paths` targets are relative to the config declaring those aliases. An explicit `baseUrl`, including an inherited one, defines the base used by aliases.

## Expressions and diagnostics

Strings keep their literal punctuation and operators. Nested arithmetic uses temporary variables when needed to preserve evaluation order. Conditions combining `&&` and `||` become nested Liquid conditions.

`.find()` in expressions accepts an inline arrow function with a single simple parameter and an expression body or a block with a single `return`, e.g. `items.find(item => item.available)` or `items.find(item => { return item.available })`. Function references such as `items.find(predicate)` and callbacks with multiple statements are rejected with an explanatory message.

Syntax errors and `.find()` diagnostics include `filePath` and `location` with 1-based line and column. The CLI prints those positions when available. Colliding component names and reserved output files also raise errors instead of silently overwriting.
