# Compiler API

Use `liquidify/compiler` for build tooling. Existing root exports remain available.

## Compile a component in memory

```ts
import { compile } from 'liquidify/compiler'

const result = await compile(
  '"use snippets"; export default function Heading() { return <h1>Hello</h1> }',
  { filename: 'src/components/Heading.tsx', cwd: process.cwd() },
)

if (result.diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
  console.error(result.diagnostics)
} else {
  console.log(result.liquid, result.assets)
}
```

`compile()` never writes files. Errors are returned as diagnostics, including source
locations/code frames when available. Empty or unnamed components produce no
artifacts. Script-only components return assets, not an empty Liquid section.
Assets contain `filename` and `content`.

Options include `cwd`, `filename`, `react.strictCsp`, `logger`, `signal`, `mode`
(`development` or `production`) and `sourcemap` (inline JavaScript maps).
Source input is limited to 5 MiB.

This is a single-component API, not a replacement for project discovery. Use a
project builder when components reference other registered React islands.
Shared runtime injection and global aggregate management belong to project builds.

## Build a project

```ts
import { makeLiquidifyBuilder } from 'liquidify/compiler'
import { SilentLogger } from 'liquidify'

const builder = makeLiquidifyBuilder(
  { cwd: '/path/to/theme', componentsDir: 'src/app', output: '.', concurrency: 4 },
  { logger: new SilentLogger() },
)
const abortController = new AbortController()

try {
  builder.on('build:end', (result) => console.log(result.durationMs))
  const result = await builder.build({ signal: abortController.signal })
  console.log(result.rebuilt, result.skipped, result.outputFiles, result.diagnostics)
} finally {
  await builder.dispose()
}
```

Omit the `signal` option when cancellation is not needed.

`build()` calls on the same instance are serialized. Failures reject the promise
and emit `error` when a listener exists. Cancellation is checked before starting,
before individual files, and before publishing. It cannot preempt synchronous
Babel work or interrupt an output transaction after publishing begins.

`files`, `rebuilt` and `skipped` describe discovered source entries; imported
script-only dependencies may not emit files. `outputFiles` lists managed generated
outputs, not the internal manifest. Diagnostics include build warnings.

Typed events: `build:start`, `build:end`, `build:failed`, `file:change`,
`watch:ready`, and `error`.

`dispose()` stops watchers, waits for accepted builds, and awaits plugin cleanup.
Disposed builders reject new work. `disposeSync()` is best-effort compatibility:
it starts asynchronous disposal and cannot guarantee completion before process exit.

## Preview the full output transaction

```ts
import { previewProject } from 'liquidify/compiler'

const preview = await previewProject({
  cwd: '/path/to/theme',
  componentsDir: 'src/app',
  output: '.',
})

console.log(preview.changes) // { filename, operation: 'create' | 'update' | 'delete' }[]
```

Preview uses a copy-on-write filesystem overlay. The normal compiler, validation,
ownership conflicts, aggregate handling and stale cleanup still run, but real
files, directories and timestamps are untouched. This does **not** isolate plugin
code: omit plugins when previewing an untrusted project.

## Derive settings types

`generateSchemaTypes(schema)` returns TypeScript declarations for `SectionSettings`
and the discriminated `SectionBlock` union. It validates the schema first, quotes
setting IDs, preserves select/radio literals and uses nullable Shopify resource
types. Metaobject/video values remain `unknown` rather than inventing their shape.
Persist the declarations yourself; the function does not write files.

## Plugins

`setup(context)` registers ordered, awaited hooks:

- `onBuildStart(callback)`
- `onGenerate(callback)` — receives the parsed component and source filename,
  before validation and generation. Mutation is supported; validation runs afterward.
- `onBuildEnd(callback)` — receives source/directive statistics after publishing.
- `onBuildError(callback)` — preserves the original error if this hook fails.
- `onDispose(callback)` — runs once, in reverse registration order.

Use `context.logger`, not `console`, so CLI quiet/JSON policies are respected.
The built-in statistics plugin follows this contract. Third-party plugins that
write directly to stdout can invalidate JSON output; use `--no-plugins` for strict
machine integrations.

Build-end hook failures reject the build **after** outputs have been published;
they do not roll back an already-completed transaction.
