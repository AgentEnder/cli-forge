---
title: CLI Forge vs. cleye
description: Detailed comparison of CLI Forge and cleye — middleware, config files, option types, and more.
nav:
  order: 8
---

# CLI Forge vs. cleye

[cleye](https://github.com/privatenumber/cleye) is a declarative CLI builder with strong TypeScript support and responsive help tables.

## CLI Forge strengths

- **Middleware** — Full [middleware pipeline](/docs/guides/middleware).
- **Config files** — Built-in [loading with `extends`](/docs/guides/configuration-files).
- **Built-in types** — Native `number`, `boolean`, `array`, and `object` types via declarative config. cleye uses JavaScript constructor functions (`String`, `Number`, `Boolean`) or [custom `(string) => T` functions](https://github.com/privatenumber/cleye#custom-flag-types--validation).
- **Validation** — [Choices, conflicts, implications](/docs/guides/validation), and custom validators. cleye validates via [custom type functions](https://github.com/privatenumber/cleye#custom-flag-types--validation) (throw to reject).
- **Env variable support** — Declarative env var mapping.
- **[Documentation generation](/docs/cli/generate-documentation), [interactive shell](/docs/guides/quick-start#the-interactive-shell), [test harness](/docs/guides/testing)** — None of these exist in cleye.

## cleye strengths

- **Responsive help** — [Terminal-width-aware help tables](https://github.com/privatenumber/cleye#responsive-tables) that adapt to the console size.
- **Custom type functions** — Any [`(string) => T` function](https://github.com/privatenumber/cleye#custom-flag-types--validation) works as an option type, combining parsing and validation in one step.
- **Command type narrowing** — Checking `argv.command` in TypeScript [automatically narrows](https://github.com/privatenumber/cleye#defining-commands) the available flags and parameters.
- **Strict mode with suggestions** — [`strictFlags: true`](https://github.com/privatenumber/cleye#strict-flags) rejects unknown flags and suggests the closest match.

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
