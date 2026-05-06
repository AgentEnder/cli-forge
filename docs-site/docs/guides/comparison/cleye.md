---
title: CLI Forge vs. cleye
description: Detailed comparison of CLI Forge and cleye — middleware, config files, option types, and more.
nav:
  order: 8
---

# CLI Forge vs. cleye

[cleye](https://github.com/privatenumber/cleye) is a declarative CLI builder with strong TypeScript support and responsive help tables.

## CLI Forge strengths

- **Middleware** — Full [middleware pipeline](/docs/guides/middleware) ([example](/examples/middleware-composition)).
- **Config files** — Built-in [loading with `extends`](/docs/guides/configuration-files) ([example](/examples/configuration-files)).
- **Object options** — Native `object` type with typed nested properties ([example](/examples/object-arguments)). cleye uses JavaScript constructor functions (`String`, `Number`, `Boolean`) for flat options.
- **Env variable support** — Declarative env var mapping ([example](/examples/env-options)).
- **[Documentation generation](/docs/cli/generate-documentation), [interactive shell](/docs/guides/quick-start#the-interactive-shell) ([example](/examples/interactive-subshell)), [test harness](/docs/guides/testing) ([example](/examples/test-harness))** — None of these exist in cleye.

## Shared strengths

- **Validation** — Both support validation. CLI Forge has [choices, conflicts, implications](/docs/guides/validation) ([example](/examples/conflicts-and-implications)), and custom validators. cleye validates via [custom type functions](https://github.com/privatenumber/cleye#custom-flag-types--validation) that combine parsing and validation in one step.
- **Strict mode** — Both reject unknown flags and suggest close matches for misspellings. CLI Forge also suggests close subcommands in strict mode.

## cleye strengths

- **Responsive help** — [Terminal-width-aware help tables](https://github.com/privatenumber/cleye#responsive-tables) that adapt to the console size. Both tools generate help automatically, but cleye's is adaptive.
- **Custom type functions** — Any [`(string) => T` function](https://github.com/privatenumber/cleye#custom-flag-types--validation) works as an option type, combining parsing and validation in one step. CLI Forge separates these into `coerce` and `validate`.
- **Command type narrowing** — Checking `argv.command` in TypeScript [automatically narrows](https://github.com/privatenumber/cleye#defining-commands) the available flags and parameters. CLI Forge achieves similar type safety through scoped command handlers.

## Side-by-side example

The same CLI — a `greet` command with `hello` and `goodbye` subcommands — implemented in both libraries.

<div class="code-tabs" data-default="cleye">
<div class="code-tab" data-tab="cleye">

<%= example('framework-comparison').file('cleye.ts') %>

</div>
<div class="code-tab" data-tab="CLI Forge">

<%= example('framework-comparison').file('cli-forge.ts') %>

</div>
</div>

---

[Back to comparison overview](/docs/guides/comparison) · [View all framework examples](/examples/framework-comparison)
