# Engineering validation and follow-up

## Implemented boundaries

- Build lifecycle, pipeline, file pool, diagnostics and plugin hooks are separate
  application services. Watchers implement a core port; the builder imports no CLI
  implementation. The old CLI build module remains a compatibility reexport.
- Parser/bundler/registry/dependency contracts are injected into the pipeline.
- CLI commands, reports, session/config reload and initialization are separate files.
- Project preview delegates writes to an overlay rather than duplicating compilation.
- Atomic synchronous/asynchronous writing is isolated from the filesystem adapter.

## Performance work

Import syntax and directives are cached by filename and source content. Resolution
is refreshed so changed tsconfig aliases remain visible. Removed imports are pruned.
Change propagation uses reverse edges and one source digest per node, not repeated
concatenation/hashing of each entry's complete transitive source closure.
Statistics reuse discovered files and cached directives and run only when subscribed.
Output I/O uses asynchronous Node operations while retaining atomic replacement.

Run `pnpm benchmark:example` after installing dependencies. The benchmark compiles
the bundled example into an isolated temporary directory, then measures five
unchanged rebuilds. It reports cold time, warm median/samples and process RSS.
It does not deploy or change the example source.

A local sequential comparison against baseline `e42c4a0`, on Node 24.21.0:

| Metric | Baseline | Updated |
| --- | ---: | ---: |
| Initial build | 1789 ms | 1784 ms |
| Unchanged rebuild median | 391 ms | 133 ms |
| Process RSS after runs | 357 MiB | 303 MiB |

These are single-machine observations, not performance budgets or guarantees.
Cold-build performance did not meaningfully change in this sample.

## Validation

The ordinary suite includes the example's five build/regression scenarios and a
full CLI scenario: initialize the shipped theme, build it with its configured
statistics plugin, and check it without modifying the real manifest.

Regression coverage includes public build serialization/disposal, config/syntax
watch recovery, argument/JSON/quiet behavior, preview stale cleanup, plugin trust
boundaries, asynchronous atomic writes, schema types/limits and schema validation.
The local suite currently passes 308 tests; lint, library/theme/React typechecks
and dependency audit also pass. The audit reported no known vulnerabilities.
Shopify CLI invocation is contract-tested with a fixture executable; running real
Shopify Theme Check requires that CLI to be installed separately.

The separate `pnpm test:example:browser` scenario currently fails at
`tests/fixtures/browser/03-purchase.js:8`: its `ProductPurchase` fixture and purchase
selectors no longer match the shipped theme. The same failure was reproduced on
unmodified baseline `e42c4a0` in a separate worktree. The test was not deleted,
skipped, weakened or reported as passing.

## Not completed by this iteration

These items require further implementation/validation and must not be described
as shipped:

- Persistent disk/AST caching and reusable esbuild contexts for changing virtual
  React entries. The current cache is per builder and bundling still uses `build()`.
- TSX-to-Liquid source mapping and per-phase profiling; current maps cover bundled
  JavaScript and current profiling reports total build duration.
- Plugin import-resolution/source-transform middleware; current hooks cover
  lifecycle and parsed-component generation.
- Complete Shopify schema conformance. Local checks now validate known setting
  types, range/select/radio defaults, duplicate IDs, preset references and limits;
  official Theme Check remains an additional validator.
- Updating the obsolete browser fixtures and verifying a real Shopify store.

Build limits and safe-path checks are safeguards, not a sandbox. Trusted plugins
retain host privileges. A separate process can race filesystem checks in a shared
writable workspace; use an isolated, trusted build directory.

Generated-output discovery excludes nested output folders and dependency/git
directories. Build refresh sentinels use unique names, preserving user-owned
`.refresh` files. GitHub Actions are pinned to verified commit SHAs; Dependabot
retains npm coverage for the root/web workspaces and updates action pins.
