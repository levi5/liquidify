# CLI workflows

```sh
liquidify build
liquidify --watch
liquidify check --json --no-plugins
liquidify --dry-run --json
liquidify doctor
liquidify generate section ProductHero
liquidify generate snippet Price
liquidify generate island Quantity
liquidify theme-check
```

## Validation and previews

`check` compiles and validates the project using an in-memory output overlay.
`--dry-run` also displays the planned create/update/delete operations. Neither
writes generated files or changes timestamps in the theme.

Both still reject unmanaged output conflicts. Use `--force` only when you intend
the subsequent real build to replace those files.

Preview/check can execute configured plugins. `--no-plugins` prevents loading
their code in the first place. `doctor`, `generate` and `theme-check` never load
project plugins.

`doctor` checks the supported Node baseline, components directory and strict CSP.
Disabled strict CSP is reported as a failing safety check.

`theme-check` runs an already-installed `shopify theme check` against configured
output. It does not build first, install dependencies, authenticate, upload or
contact a store on Liquidify's behalf. Shopify CLI behavior remains its own.
Missing Shopify CLI is an actionable error. JSON mode wraps its exit code,
stdout and stderr without assuming a particular Shopify diagnostic schema.

## Output and errors

- `--quiet` suppresses successful build/init/generation messages.
- `--json` produces one JSON report per operation, or NDJSON for watch builds.
- Failures return a nonzero exit code outside watch mode.
- Syntax diagnostics include file/line/column and a code frame when readable.
- `--verbose` lists rebuilt and unchanged source entries.
- `--profile` adds total build duration; it is not per-phase profiling.
- Unknown arguments, missing option values and invalid concurrency/mode fail early.

Third-party plugins must use `context.logger` instead of direct stdout writes
to preserve quiet/JSON behavior.

## Watch recovery

Watch remains active after an initial syntax or configuration error.
Changes to the selected Liquidify config replace the builder after its accepted
work settles. Invalid replacement configs report an error and retain the previous
valid builder until corrected. Config auto-discovery also observes newly created
supported config filenames.

Source dependency/config tracking includes unresolved paths so creating a missing
dependency can recover the build. Package installation changes and plugin-code
hot reload are not tracked; restart the process after changing those.

## Build options

```json
{
  "componentsDir": "src/app",
  "output": ".",
  "concurrency": 4,
  "mode": "development",
  "sourcemap": true,
  "react": { "strictCsp": true },
  "limits": {
    "maxFiles": 10000,
    "maxDependencies": 50000,
    "maxSourceBytes": 5242880,
    "maxDependencyDepth": 256
  }
}
```

CLI overrides: `--concurrency 4`, `--mode development`, `--sourcemap`, `--force`.
The default mode preserves the existing production bundling behavior.
Development disables minification; JavaScript sourcemaps are opt-in and inline.
These are not TSX-to-Liquid source maps.

Configuration paths and the returned `cwd` resolve against the config directory;
zero-config defaults resolve against the requested working directory.
The programmatic factory accepts an explicit `cwd` and injectable logger/filesystem.
Keep `componentsDir` separate from the output root. Nested output folders are
excluded from discovery/watch, as are `node_modules` and `.git`; identical source
and output roots are rejected to avoid compiling generated JavaScript.

## Component generation and initialization

Names must be PascalCase identifiers. `generate` writes to `sections`, `snippets`
or `islands` under `componentsDir`, with the appropriate directive and a minimal
section schema. Existing components are never overwritten, even with `--force`.
Use `--dry-run` to inspect the destination without creating it.

`init` supports `--quiet` and `--json`. Its historical template aliases remain
compatible. It rejects build-only flags and refuses source/destination symlinks
even when overwriting with `--force`.
