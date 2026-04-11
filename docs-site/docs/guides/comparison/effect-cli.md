---
title: CLI Forge vs. @effect/cli
description: Detailed comparison of CLI Forge and @effect/cli — API patterns, type safety, Effect integration, and more.
nav:
  order: 9
---

# CLI Forge vs. @effect/cli

[@effect/cli](https://github.com/Effect-TS/effect/blob/main/packages/cli/README.md) is a CLI library built on the [Effect](https://effect.website/) ecosystem. Commands are Effect computations with typed errors, dependency injection, and structured concurrency.

## CLI Forge strengths

- **Standalone** — Self-contained library. @effect/cli requires the Effect runtime (`effect`, `@effect/platform`, `@effect/platform-node` or `-bun`), which is a significant dependency commitment.
- **Fluent builder API** — Chainable `.option().command()` pattern. @effect/cli uses [separate constructors](https://github.com/Effect-TS/effect/blob/main/packages/cli/README.md#our-first-command) (`Command.make`, `Options.text`, `Args.text`) composed via `pipe()`.
- **Object options** — Typed nested objects with dot-notation argument parsing (e.g., `--config.host=X`) ([example](/examples/object-arguments)). @effect/cli options are flat; they can be grouped via [`Options.all()`](https://effect-ts.github.io/effect/effect/cli/Options.ts.html) but without dot-notation parsing.
- **Config file inheritance** — Built-in [config loading with `extends`](/docs/guides/configuration-files) ([example](/examples/config-inheritance)), write-back, and per-key provenance. @effect/cli has [`ConfigFile`](https://github.com/Effect-TS/effect/tree/main/packages/cli) and [`ConfigProvider`](https://effect.website/docs/configuration/#configprovider) but neither supports `extends` chains or write-back.
- **Documentation generation** — Built-in [`generate-docs`](/docs/cli/generate-documentation) command.
- **Lower learning curve** — Familiar API for developers coming from yargs or commander.

## Shared strengths

- **Full type-safe inference** — Both provide full type inference for parsed arguments, though using very different type systems.
- **Shell completions** — Both generate shell completion scripts. @effect/cli has a built-in [`--completions` flag](https://github.com/Effect-TS/effect/blob/main/packages/cli/README.md#overview-of-built-in-options). CLI Forge supports bash, zsh, fish, and PowerShell ([example](/examples/shell-completion)).
- **Validation** — Both support validation. CLI Forge uses [choices, conflicts, implications](/docs/guides/validation) ([example](/examples/conflicts-and-implications)) and custom validators. @effect/cli uses Effect's `Schema` module via [`Options.withSchema()`](https://effect-ts.github.io/effect/cli/Options.ts.html#withschema).
- **Interactive prompting** — Both support prompting for missing options. @effect/cli has [`Options.withFallbackPrompt()`](https://effect-ts.github.io/effect/cli/Options.ts.html#withfallbackprompt) and a built-in [`--wizard` flag](https://github.com/Effect-TS/effect/blob/main/packages/cli/README.md#using-the-wizard-mode). CLI Forge uses a pluggable [prompt provider](/examples/prompting) system.

## @effect/cli strengths

- **Effect integration** — Commands are Effect values with typed errors, dependency injection via layers, and structured concurrency. Fits naturally into an [existing Effect application](https://github.com/Effect-TS/effect/blob/main/packages/cli/README.md#setting-up-the-main-command).
- **Wizard mode** — The [`--wizard` flag](https://github.com/Effect-TS/effect/blob/main/packages/cli/README.md#using-the-wizard-mode) is built-in and requires no configuration. CLI Forge's prompting requires registering a provider.

## Side-by-side example

The same CLI — a `greet` command with `hello` and `goodbye` subcommands — implemented in both libraries. Note the significant difference in programming model.

<div class="code-tabs" data-default="@effect/cli">
<div class="code-tab" data-tab="@effect/cli">

<%= example('framework-comparison').file('effect-cli.ts') %>

</div>
<div class="code-tab" data-tab="CLI Forge">

<%= example('framework-comparison').file('cli-forge.ts') %>

</div>
</div>

---

[Back to comparison overview](/docs/guides/comparison) · [View all framework examples](/examples/framework-comparison)
