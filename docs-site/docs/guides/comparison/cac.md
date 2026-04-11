---
title: CLI Forge vs. cac
description: Detailed comparison of CLI Forge and cac — type safety, validation, middleware, and more.
nav:
  order: 5
---

# CLI Forge vs. cac

[cac](https://github.com/cacjs/cac) is a zero-dependency, single-file CLI library used by Vite and Vitest.

## CLI Forge strengths

- **Type inference** — [Infers types](/docs/guides/typescript) from option definitions. cac returns `{ [k: string]: any }` for parsed options, requiring manual type assertions.
- **Rich option types** — Native `number`, `boolean`, `array`, and `object` types with compile-time safety. cac infers types from bracket syntax at runtime only.
- **Validation** — [Choices, conflicts, implications](/docs/guides/validation) ([example](/examples/conflicts-and-implications)), required options, and custom validators. cac validates only required positional arguments and unknown options.
- **Middleware** — Full [middleware pipeline](/docs/guides/middleware) ([example](/examples/middleware-composition)).
- **Config files** — Built-in [loading with `extends`](/docs/guides/configuration-files) ([example](/examples/configuration-files)).
- **Documentation generation** — [Built-in](/docs/cli/generate-documentation).
- **Interactive shell** — [Opt-in REPL](/docs/guides/quick-start#the-interactive-shell) ([example](/examples/interactive-subshell)).
- **Test harness** — [`TestHarness`](/docs/guides/testing) for parsing tests ([example](/examples/test-harness)).

## cac strengths

- **Zero dependencies, single file** — Extremely lightweight (~3.5KB minified).
- **Dot-notation** — [`--env.API_SECRET foo`](https://github.com/cacjs/cac#dot-nested-options) automatically creates nested objects. CLI Forge uses explicit `type: 'object'` with `properties`.
- **Deno support** — Available [via JSR](https://github.com/cacjs/cac#with-deno).
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

---

[Back to comparison overview](/docs/guides/comparison) · [View all framework examples](/examples/framework-comparison)
