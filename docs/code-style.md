# Source conventions

Implementation code has no explanatory comments. Names, small functions and
separate modules describe behavior. Shebangs, source-map directives, managed
Liquid/CSS delimiters and test/documentation strings are functional data rather
than implementation comments.

Internal TypeScript modules use `@core`, `@application`, `@adapters`,
`@presentation`, `@main`, `@shared` and `@liquidify-types` aliases.
The example theme uses `@theme`; web modules use `#web` and `#web-tools`.
Node tests use native `#tests` and `#dist` package imports. Local styles/images
remain asset imports rather than internal TypeScript module imports.

`tsconfig.base.json` centralizes library aliases. `pnpm build` compiles code,
copies authored declarations and rewrites aliases in JavaScript/declarations with
`tsc-alias`. Published artifacts therefore use ordinary relative module paths and
need no alias registration in consuming applications.

`pnpm dev` runs compilation and alias rewriting in watch mode. Source CLI commands
resolve aliases through `tsconfig.runtime.json`. Web runtime/tooling share
`web/tsconfig.paths.json`; native package imports also support config bundling.

Use guard clauses, focused helpers and command dispatch tables instead of long
else-if chains. Liquid preprocessing separates quoted spans, delimited bodies,
tags, outputs and pipes into small modules.

Source-style regression tests check comments, imports, excessive else-if chains
and leaked aliases in emitted artifacts. Normal tests include building the example
theme through the API and public CLI.
