## Do I need to bundle?

Bundling is **not required** to distribute a cli-forge CLI. You can publish your TypeScript source and let consumers run it with `tsx`, or compile with `tsc` and ship the JavaScript directly. Node.js handles `cli-forge`'s dual-format exports automatically at runtime.

That said, bundling can be useful when you want a single portable file, faster cold starts, or when embedding a CLI inside a larger tool.

## Shared CLI source

All builds (except esbuild CJS) use this shared entry point:

<%= file('cli.ts') %>

## esbuild

### CJS

esbuild activates the `"import"` export condition whenever source code uses `import ... from` syntax — **regardless of the output format**. This means even with `format: 'cjs'` and `platform: 'node'`, esbuild resolves the ESM entry from dual-format packages. If that entry contains `import.meta` (valid in ESM, undefined in CJS), the bundle crashes at runtime.

The fix is simple: use TypeScript's `import = require(...)` syntax for the esbuild CJS entry point. This tells esbuild to resolve the `"require"` export condition instead:

<%= file('cli-esbuild-cjs.ts').region('import') %>

With that change, no plugins or configuration tweaks are needed:

<%= file('cjs/run-esbuild.sh') %>
<%= file('cjs/esbuild.ts') %>

### ESM

ESM bundles work out of the box — no workarounds needed:

<%= file('esm/run-esbuild.sh') %>
<%= file('esm/esbuild.ts') %>

## Rollup

Rollup requires `@rollup/plugin-node-resolve` to bundle `node_modules` packages, so it uses a config file.

### CJS

<%= file('cjs/run-rollup.sh') %>
<%= file('cjs/rollup.config.mjs') %>

### ESM

<%= file('esm/run-rollup.sh') %>
<%= file('esm/rollup.config.mjs') %>

## Rolldown

### CJS

<%= file('cjs/run-rolldown.sh') %>
<%= file('cjs/rolldown.ts') %>

### ESM

<%= file('esm/run-rolldown.sh') %>
<%= file('esm/rolldown.ts') %>

## Bun

### CJS

<%= file('cjs/run-bun.sh') %>
<%= file('cjs/bun.ts') %>

### ESM

<%= file('esm/run-bun.sh') %>
<%= file('esm/bun.ts') %>

## tsdown

tsdown keeps dependencies external by default — it transpiles your code but doesn't inline `node_modules` packages into the bundle. This is often the right choice for CLIs that will be installed via npm, since Node.js resolves dependencies at runtime.

### CJS

<%= file('cjs/run-tsdown.sh') %>

### ESM

<%= file('esm/run-tsdown.sh') %>
