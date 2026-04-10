---
title: CLI Forge vs. commander
description: Detailed comparison of CLI Forge and commander — type safety, option types, middleware, and more.
nav:
  order: 2
---

# CLI Forge vs. commander

[Commander](https://github.com/tj/commander.js) is the most widely used CLI library in the Node.js ecosystem, with zero runtime dependencies.

## Side-by-side example

The same CLI — a `greet` command with `hello` and `goodbye` subcommands — implemented in both libraries.

### CLI Forge

<%= example('framework-comparison').file('cli-forge.ts') %>

### commander

<%= example('framework-comparison').file('commander.ts') %>

## Where CLI Forge goes further

- **Built-in type inference** — Commander's core [types `.opts()` as a generic object](https://github.com/tj/commander.js#typescript). Type-safe options require the separate [`@commander-js/extra-typings`](https://github.com/commander-js/extra-typings) package. CLI Forge [infers types](/docs/guides/typescript) from every `.option()` call with no extra packages.
- **Rich option types** — Commander treats value option arguments as strings by default; numbers require [custom processing functions](https://github.com/tj/commander.js#custom-option-processing) (booleans and variadic arrays are supported natively). CLI Forge supports `string`, `number`, `boolean`, `array`, and `object` types natively with automatic coercion.
- **Middleware** — CLI Forge's [middleware pipeline](/docs/guides/middleware) transforms args between parsing and handler execution. Commander provides [`preAction`/`postAction` hooks](https://github.com/tj/commander.js#life-cycle-hooks) but not a general-purpose middleware system.
- **Config file support** — CLI Forge loads config files with [`extends` inheritance](/docs/guides/configuration-files). Commander has no config file loading.
- **Documentation generation** — Built-in [`generate-docs`](/docs/cli/generate-documentation) command. Commander has no equivalent.
- **Interactive shell** — [Opt-in REPL mode](/docs/guides/quick-start#the-interactive-shell). Commander has no shell.
- **Test harness** — [`TestHarness`](/docs/guides/testing) for parsing tests. Commander requires manual test setup.

## Where commander has the edge

- **Zero dependencies** — Commander is entirely self-contained. CLI Forge has runtime dependencies.
- **Adoption** — Ubiquitous in the Node.js ecosystem with extensive documentation and examples.
- **Standalone executables** — Commander can [spawn subcommands as separate processes](https://github.com/tj/commander.js#stand-alone-executable-subcommands) (e.g., `git`-style where `my-app install` runs a `my-app-install` binary). CLI Forge runs all commands in-process.
- **Lightweight API** — Commander's [string-based option definitions](https://github.com/tj/commander.js#options) (`'-p, --port <number>'`) are concise for simple CLIs where full type inference isn't needed.
