---
title: CLI Forge vs. cac
description: Detailed comparison of CLI Forge and cac — type safety, validation, middleware, and more.
nav:
  order: 5
---

# CLI Forge vs. cac

[cac](https://github.com/cacjs/cac) is a zero-dependency, single-file CLI library used by Vite and Vitest.

## Where CLI Forge goes further

- **Type inference** — CLI Forge [infers types](/docs/guides/typescript) from option definitions. cac returns `{ [k: string]: any }` for parsed options, requiring manual type assertions.
- **Rich option types** — Native `number`, `boolean`, `array`, and `object` types. cac infers types from bracket syntax at runtime with no compile-time safety.
- **Validation** — [Choices, conflicts, implications](/docs/guides/validation), required options, and custom validators. cac only validates required positional arguments and unknown options.
- **Middleware** — Full [middleware pipeline](/docs/guides/middleware). cac has none.
- **Config files** — Built-in [loading with `extends`](/docs/guides/configuration-files). cac has none.
- **Documentation generation** — [Built-in](/docs/cli/generate-documentation). cac has none.
- **Interactive shell** — [Opt-in REPL](/docs/guides/quick-start#the-interactive-shell). cac has none.
- **Test harness** — [`TestHarness`](/docs/guides/testing) for parsing tests. cac requires manual setup.

## Where cac has the edge

- **Zero dependencies, single file** — Extremely lightweight (~3.5KB minified).
- **Dot-notation** — [`--env.API_SECRET foo`](https://github.com/cacjs/cac#dot-nested-options) automatically creates nested objects. CLI Forge uses explicit `type: 'object'` with `properties` for typed nesting.
- **Deno support** — Available [via JSR](https://github.com/cacjs/cac#with-deno). CLI Forge targets Node.js and Bun.
- **Event system** — [Listen for command events](https://github.com/cacjs/cac#events) (`command:*`) for custom routing logic.
- **Proven at scale** — Powers Vite, Vitest, and other popular tools.

## Side-by-side example

The same CLI — a `greet` command with `hello` and `goodbye` subcommands — implemented in both libraries.

<div class="code-tabs" data-default="cac">
<div class="code-tab" data-tab="cac">

<%= example('framework-comparison').file('cac.ts') %>

</div>
<div class="code-tab" data-tab="CLI Forge">

<%= example('framework-comparison').file('cli-forge.ts') %>

</div>
</div>
