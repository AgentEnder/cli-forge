---
title: CLI Forge vs. cleye
description: Detailed comparison of CLI Forge and cleye — middleware, config files, option types, and more.
nav:
  order: 8
---

# CLI Forge vs. cleye

[cleye](https://github.com/privatenumber/cleye) is a declarative CLI builder with strong TypeScript support and responsive help tables.

## Side-by-side example

The same CLI — a `greet` command with `hello` and `goodbye` subcommands — implemented in both libraries.

### CLI Forge

<%= example('framework-comparison').file('cli-forge.ts') %>

### cleye

<%= example('framework-comparison').file('cleye.ts') %>

## Where CLI Forge goes further

- **Middleware** — Full [middleware pipeline](/docs/guides/middleware). cleye has none.
- **Config files** — Built-in [loading with `extends`](/docs/guides/configuration-files). cleye has none.
- **Built-in types** — Native `number`, `boolean`, `array`, and `object` types via declarative config. cleye uses JavaScript constructor functions (`String`, `Number`, `Boolean`) or [custom `(string) => T` functions](https://github.com/privatenumber/cleye#custom-flag-types--validation).
- **Validation** — [Choices, conflicts, implications](/docs/guides/validation), and custom validators. cleye validates via [custom type functions](https://github.com/privatenumber/cleye#custom-flag-types--validation) (throw to reject).
- **[Documentation generation](/docs/cli/generate-documentation), [interactive shell](/docs/guides/quick-start#the-interactive-shell), [test harness](/docs/guides/testing)** — All present in CLI Forge, none in cleye.
- **Env variable support** — Declarative env var mapping. cleye has none.

## Where cleye has the edge

- **Responsive help** — [Terminal-width-aware help tables](https://github.com/privatenumber/cleye#responsive-tables) that adapt to the console size, powered by [terminal-columns](https://github.com/privatenumber/terminal-columns).
- **Custom type functions** — Any [`(string) => T` function](https://github.com/privatenumber/cleye#custom-flag-types--validation) works as an option type, providing flexible parsing and validation in one step.
- **Command type narrowing** — When checking `argv.command` in TypeScript, available flags and parameters are [automatically narrowed](https://github.com/privatenumber/cleye#defining-commands) to the matched command.
- **Strict mode with suggestions** — [`strictFlags: true`](https://github.com/privatenumber/cleye#strict-flags) rejects unknown flags and suggests the closest match within 2 edit distance.
