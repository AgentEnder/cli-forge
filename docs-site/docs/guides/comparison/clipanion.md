---
title: CLI Forge vs. clipanion
description: Detailed comparison of CLI Forge and clipanion — API patterns, middleware, state machine parsing, and more.
nav:
  order: 4
---

# CLI Forge vs. clipanion

[Clipanion](https://mael.dev/clipanion/) is a class-based CLI library created by the author of Yarn. It powers Yarn Berry.

## Where CLI Forge goes further

- **Fluent API** — Chainable builder pattern vs. class-based command definitions with static properties.
- **Middleware** — CLI Forge has a [first-class middleware pipeline](/docs/guides/middleware). Clipanion has no middleware; class inheritance serves a similar but more limited purpose.
- **Config file support** — Built-in [config loading with `extends`](/docs/guides/configuration-files). Clipanion has none.
- **Environment variables** — Declarative env var mapping to options. Clipanion provides `env` in the command context but has no automatic option-to-env-var binding.
- **Object options** — Typed nested objects. Clipanion [options](https://mael.dev/clipanion/docs/options) are flat strings/booleans/counters/arrays; numbers require [typanion validators](https://mael.dev/clipanion/docs/validation).
- **Documentation generation** — Built-in [doc generation](/docs/cli/generate-documentation). Clipanion has none.
- **Interactive shell** — [Opt-in REPL](/docs/guides/quick-start#the-interactive-shell). Clipanion has none.
- **Test harness** — [`TestHarness`](/docs/guides/testing) for parsing tests. Clipanion requires manual test setup.

## Where clipanion has the edge

- **State machine parser** — Clipanion compiles commands into an [optimized state machine](https://mael.dev/clipanion/docs/paths), enabling advanced features like command overloading (multiple commands sharing [path overlaps](https://mael.dev/clipanion/docs/paths#path-overlaps), disambiguated by required options).
- **Command proxying** — [`Option.Proxy()`](https://mael.dev/clipanion/docs/options#proxies) captures remaining args transparently without requiring a `--` separator. Useful for wrapper commands.
- **Typanion validation** — Tight integration with the [typanion](https://mael.dev/clipanion/docs/validation) library for composable runtime validation and coercion.
- **Battle-tested** — Powers Yarn Berry, one of the most complex CLIs in the JavaScript ecosystem.

## Side-by-side example

The same CLI — a `greet` command with `hello` and `goodbye` subcommands — implemented in both libraries.

<div class="code-tabs" data-default="clipanion">
<div class="code-tab" data-tab="clipanion">

<%= example('framework-comparison').file('clipanion.ts') %>

</div>
<div class="code-tab" data-tab="CLI Forge">

<%= example('framework-comparison').file('cli-forge.ts') %>

</div>
</div>
