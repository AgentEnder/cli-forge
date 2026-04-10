---
title: CLI Forge vs. oclif
description: Detailed comparison of CLI Forge and oclif — API style, type inference, plugin system, and distribution.
nav:
  order: 3
---

# CLI Forge vs. oclif

[oclif](https://oclif.io/) is a full-featured CLI framework maintained by Salesforce. It powers the Heroku CLI, Salesforce CLI, and Twilio CLI.

## Where CLI Forge goes further

- **Fluent builder API** — CLI Forge uses a chainable builder pattern. oclif requires [class-based commands](https://oclif.io/docs/commands/) in separate files with static property declarations.
- **Type accumulation** — Types [flow through the builder chain](/docs/guides/typescript). In oclif, each command types its own [flags](https://oclif.io/docs/flags/)/args via `this.parse()` without accumulation across a command tree.
- **Object options** — Nested, typed object options. oclif has no equivalent.
- **Middleware** — General-purpose [middleware pipeline](/docs/guides/middleware). oclif has [lifecycle hooks](https://oclif.io/docs/hooks/) (`init`, `prerun`, `postrun`, `preparse`, and others) plus custom hooks, but they're file-based declarations, not inline composition.
- **Config file inheritance** — Built-in [config loading with `extends`](/docs/guides/configuration-files). oclif supports [framework-level configuration](https://oclif.io/docs/configuring_your_cli/) (plugin discovery, topic separators) via `package.json`, but does not provide a built-in mechanism for loading end-user option values from config files.
- **Lightweight setup** — Define a CLI in a single file. oclif is designed around [code generation and scaffolding](https://oclif.io/docs/generating/) with a specific project structure.

## Where oclif has the edge

- **Plugin system** — oclif has a [mature plugin architecture](https://oclif.io/docs/plugins/). Plugins can add commands and hooks, and users can install plugins at runtime. CLI Forge has no plugin system.
- **Distribution** — [`oclif pack`](https://oclif.io/docs/releasing/) creates installable artifacts (deb, macOS, Windows). CLI Forge doesn't handle distribution.
- **Enterprise-proven** — Powers production CLIs at Salesforce, Heroku, Twilio, and Shopify.
- **Filesystem routing** — Commands are [auto-discovered from the directory structure](https://oclif.io/docs/command_discovery_strategies/). Large CLI teams can organize commands into files without explicit registration.
- **JSON output** — Built-in [`--json` flag support](https://oclif.io/docs/json/) with `enableJsonFlag`. CLI Forge requires manual implementation.
- **Built-in testing** — [`@oclif/test`](https://oclif.io/docs/testing/) package with CLI-specific test utilities.

## Side-by-side example

The same CLI — a `greet` command with `hello` and `goodbye` subcommands — implemented in both libraries. Note that oclif normally uses class-based commands in separate files with scaffolding.

<div class="code-tabs" data-default="oclif">
<div class="code-tab" data-tab="oclif">

<%= example('framework-comparison').file('oclif.ts') %>

</div>
<div class="code-tab" data-tab="CLI Forge">

<%= example('framework-comparison').file('cli-forge.ts') %>

</div>
</div>
