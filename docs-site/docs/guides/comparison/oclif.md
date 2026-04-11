---
title: CLI Forge vs. oclif
description: Detailed comparison of CLI Forge and oclif — API style, type inference, plugin system, and distribution.
nav:
  order: 3
---

# CLI Forge vs. oclif

[oclif](https://oclif.io/) is a full-featured CLI framework maintained by Salesforce. It powers the Heroku CLI, Salesforce CLI, and Twilio CLI.

## CLI Forge strengths

- **Fluent builder API** — Chainable builder pattern. oclif requires [class-based commands](https://oclif.io/docs/commands/) in separate files with static property declarations.
- **Type accumulation** — Types [flow through the builder chain](/docs/guides/typescript). In oclif, each command types its own [flags](https://oclif.io/docs/flags/)/args via `this.parse()` without accumulation across a command tree.
- **Object options** — Nested, typed object options ([example](/examples/object-arguments)). oclif has no equivalent.
- **Middleware** — General-purpose [middleware pipeline](/docs/guides/middleware) ([example](/examples/middleware-composition)). oclif has [lifecycle hooks](https://oclif.io/docs/hooks/) but they're file-based declarations, not inline composition.
- **Config file inheritance** — Built-in [config loading with `extends`](/docs/guides/configuration-files) ([example](/examples/config-inheritance)). oclif supports [framework-level configuration](https://oclif.io/docs/configuring_your_cli/) but not end-user option config files.
- **Lightweight setup** — Define a CLI in a single file. oclif is designed around [code generation and scaffolding](https://oclif.io/docs/generating/).

## oclif strengths

- **Plugin system** — [Mature plugin architecture](https://oclif.io/docs/plugins/) where plugins can add commands and hooks, and users can install plugins at runtime.
- **Distribution** — [`oclif pack`](https://oclif.io/docs/releasing/) creates installable artifacts (deb, macOS, Windows).
- **Enterprise-proven** — Powers production CLIs at Salesforce, Heroku, Twilio, and Shopify.
- **Filesystem routing** — Commands are [auto-discovered from the directory structure](https://oclif.io/docs/command_discovery_strategies/).
- **JSON output** — Built-in [`--json` flag support](https://oclif.io/docs/json/) with `enableJsonFlag`.
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

---

[Back to comparison overview](/docs/guides/comparison) · [View all framework examples](/examples/framework-comparison)
