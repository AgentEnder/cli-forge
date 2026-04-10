## Do I need to bundle?

Bundling is **not required** to distribute a cli-forge CLI. You can publish your TypeScript source and let consumers run it with `tsx`, or compile with `tsc` and ship the JavaScript directly. Node.js handles `cli-forge`'s dual-format exports automatically at runtime.

That said, bundling can be useful when you want a single portable file, faster cold starts, or when embedding a CLI inside a larger tool.

## Which tool should I pick?

If you want the simplest setup, Bun is a strong option. It has a built-in bundler, and [`bun build --compile`](https://bun.sh/docs/bundler/executables) can produce a standalone executable that embeds the Bun runtime, so Bun does not become a runtime dependency for your users.

If you want to stay Node-only, esbuild and Rolldown are both good default choices. Rollup gives you a similar model with a more established plugin ecosystem, while tsdown is a good fit when you want bundler-style transforms and tree-shaking without necessarily producing a fully self-contained single-file bundle.

## Shipping a bundled CLI

The examples below focus on module-format compatibility and bundling behavior. If you want to publish the built output as an executable CLI, there is one extra packaging step: make sure the final file has a Node shebang and is exposed through your package's `bin` field.

```typescript
#!/usr/bin/env node
```

```json
{
  "bin": {
    "my-cli": "./dist/esm/my-cli.mjs"
  }
}
```

Most bundlers can prepend the shebang with a banner option, or you can add it in a small postbuild step and mark the file as executable with `chmod +x`.

## Shared CLI source

All builds (except esbuild CJS) use this shared entry point:

<%= file('cli.ts') %>

## [esbuild](https://esbuild.github.io/)

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

## [Rollup](https://rollupjs.org/)

Rollup requires `@rollup/plugin-node-resolve` to bundle `node_modules` packages, so it uses a config file.

### CJS

<%= file('cjs/run-rollup.sh') %>
<%= file('cjs/rollup.config.mjs') %>

### ESM

<%= file('esm/run-rollup.sh') %>
<%= file('esm/rollup.config.mjs') %>

## [Rolldown](https://rolldown.rs/)

[Rolldown](https://rolldown.rs/) is a Rust-based bundler designed as a drop-in replacement for Rollup with better performance. It uses a JavaScript API similar to Rollup's.

### CJS

<%= file('cjs/run-rolldown.sh') %>
<%= file('cjs/rolldown.ts') %>

### ESM

<%= file('esm/run-rolldown.sh') %>
<%= file('esm/rolldown.ts') %>

## [Bun](https://bun.sh/docs/bundler)

Bun includes a built-in bundler accessible via the [`Bun.build()`](https://bun.sh/docs/bundler) API. It is the simplest setup in this example set, and if you later switch to [`bun build --compile`](https://bun.sh/docs/bundler/executables), Bun can also produce a standalone executable that embeds the runtime. These build scripts are run with `bun run` rather than `tsx`.

### CJS

<%= file('cjs/run-bun.sh') %>
<%= file('cjs/bun.ts') %>

### ESM

<%= file('esm/run-bun.sh') %>
<%= file('esm/bun.ts') %>

## [tsdown](https://tsdown.dev/)

tsdown sits somewhere between bundling and plain transpilation. It still uses a bundler-style pipeline, so you get tree-shaking and related optimizations, but it keeps dependencies external by default instead of inlining `node_modules` into a single file. This is often the right choice for CLIs that will be installed via npm, since Node.js resolves dependencies at runtime.

### CJS

<%= file('cjs/run-tsdown.sh') %>

### ESM

<%= file('esm/run-tsdown.sh') %>
