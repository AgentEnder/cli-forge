## Do I need to bundle?

Bundling is **not required** to distribute a cli-forge CLI. You can publish your TypeScript source and let consumers run it with `tsx`, or compile with `tsc` and ship the JavaScript directly. Node.js handles `cli-forge`'s dual-format exports automatically at runtime.

That said, bundling can be useful when you want a single portable file, faster cold starts, or when embedding a CLI inside a larger tool.

## ESM output

ESM bundles work out of the box with every bundler tested — no workarounds needed:

<%= file('esm/run-esbuild.sh') %>
<%= file('esm/run-rollup.sh') %>
<%= file('esm/run-rolldown.sh') %>
<%= file('esm/run-tsdown.sh') %>
<%= file('esm/run-bun.sh') %>

## CJS output

Most bundlers handle CJS output correctly. The one exception is **esbuild**, which requires a small change to how you import cli-forge.

### esbuild gotcha

esbuild activates the `"import"` export condition whenever source code uses `import ... from` syntax — **regardless of the output format**. This means even with `format: 'cjs'` and `platform: 'node'`, esbuild resolves the ESM entry from dual-format packages. If that entry contains `import.meta` (valid in ESM, undefined in CJS), the bundle crashes at runtime.

The fix is simple: use TypeScript's `import = require(...)` syntax for the esbuild CJS entry point. This tells esbuild to resolve the `"require"` export condition instead:

<%= region('cli-esbuild-cjs.ts', 'import') %>

With that change, no plugins or configuration tweaks are needed:

<%= file('cjs/run-esbuild.sh') %>
<%= file('cjs/esbuild.ts') %>

### Rollup, Rolldown, tsdown, and Bun

These bundlers resolve the correct entry for each output format automatically. Standard `import ... from` syntax works:

<%= file('cjs/run-rollup.sh') %>
<%= file('cjs/run-rolldown.sh') %>
<%= file('cjs/run-tsdown.sh') %>
<%= file('cjs/run-bun.sh') %>

Note that **tsdown** keeps dependencies external by default — it transpiles your code but doesn't inline `node_modules` packages into the bundle. This is often the right choice for CLIs that will be installed via npm, since Node.js resolves dependencies at runtime.

## Build configs

Rollup requires `@rollup/plugin-node-resolve` to bundle `node_modules` packages, so it uses a config file:

<%= file('cjs/rollup.config.mjs') %>

esbuild, rolldown, and bun use small per-format build scripts. Here are the ESM variants (CJS is identical except for the format and output path):

<%= file('esm/esbuild.ts') %>
<%= file('esm/rolldown.ts') %>
<%= file('esm/bun.ts') %>

## Shared CLI source

All builds (except esbuild CJS) use this shared entry point:

<%= file('cli.ts') %>
