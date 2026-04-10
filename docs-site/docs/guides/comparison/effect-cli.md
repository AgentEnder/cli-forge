---
title: CLI Forge vs. @effect/cli
description: Detailed comparison of CLI Forge and @effect/cli — API patterns, type safety, Effect integration, and more.
nav:
  order: 9
---

# CLI Forge vs. @effect/cli

[@effect/cli](https://github.com/Effect-TS/effect/blob/main/packages/cli/README.md) is a CLI library built on the [Effect](https://effect.website/) ecosystem. Commands are Effect computations with typed errors, dependency injection, and structured concurrency.

## Where CLI Forge goes further

- **Standalone** — CLI Forge is a self-contained library. @effect/cli requires the Effect runtime (`effect`, `@effect/platform`, `@effect/printer`, `@effect/printer-ansi`, `@effect/platform-node` or `@effect/platform-bun`), which is a significant dependency and conceptual commitment.
- **Fluent builder API** — Chainable `.option().command()` pattern. @effect/cli uses [separate constructors](https://github.com/Effect-TS/effect/blob/main/packages/cli/README.md#our-first-command) ([`Command.make`](https://effect-ts.github.io/effect/cli/Command.ts.html#make), [`Options.text`](https://effect-ts.github.io/effect/cli/Options.ts.html#text), `Args.text`) composed via `pipe()`.
- **Object options** — Typed nested objects via `type: 'object'` with per-property types and dot-notation argument parsing (e.g., `--config.host=X`). @effect/cli options are individually flat; they can be grouped into typed records via [`Options.all()`](https://effect-ts.github.io/effect/effect/cli/Options.ts.html), but there is no dot-notation CLI argument parsing.
- **Config file inheritance** — Built-in [config loading with `extends`](/docs/guides/configuration-files) with write-back support and per-key provenance tracking. @effect/cli has its own [`ConfigFile`](https://github.com/Effect-TS/effect/tree/main/packages/cli) module supporting JSON, YAML, INI, and TOML formats with search paths, and the broader Effect ecosystem offers [`ConfigProvider`](https://effect.website/docs/configuration/#configprovider) for environment variables, JSON, or custom sources — but neither supports `extends`-based inheritance chains or write-back.
- **Documentation generation** — Built-in [`generate-docs`](/docs/cli/generate-documentation) command. @effect/cli has no equivalent.
- **Lower learning curve** — Familiar API for developers coming from yargs or commander. @effect/cli requires understanding [Effect's programming model](https://effect.website/docs/getting-started/introduction/) (layers, services, fibers).

## Where @effect/cli has the edge

- **Effect integration** — Commands are Effect values with typed errors, dependency injection via layers, and structured concurrency. If your application already uses Effect, the CLI layer [fits naturally into your application](https://github.com/Effect-TS/effect/blob/main/packages/cli/README.md#setting-up-the-main-command).
- **Wizard mode** — Built-in [`--wizard` flag](https://github.com/Effect-TS/effect/blob/main/packages/cli/README.md#using-the-wizard-mode) walks users through command options interactively.
- **Shell completions** — Built-in [`--completions` flag](https://github.com/Effect-TS/effect/blob/main/packages/cli/README.md#overview-of-built-in-options) generates shell-specific completion scripts by flag alone. CLI Forge supports [completions](https://github.com/AgentEnder/cli-forge/blob/main/packages/cli-forge/src/lib/completion-scripts.ts) (bash, zsh, fish, PowerShell) via `.completion()` and a `completion` subcommand, but requires an explicit opt-in call.
- **Schema validation** — Options can be validated and transformed via Effect's `Schema` module using [`Options.withSchema()`](https://effect-ts.github.io/effect/cli/Options.ts.html#withschema).
- **Prompt fallbacks** — Options can fall back to interactive prompts when not provided via [`Options.withFallbackPrompt()`](https://effect-ts.github.io/effect/cli/Options.ts.html#withfallbackprompt).

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
