---
title: CLI Forge vs. citty
description: Detailed comparison of CLI Forge and citty — option types, validation, middleware, and more.
nav:
  order: 7
---

# CLI Forge vs. citty

[citty](https://github.com/unjs/citty) is a zero-dependency CLI builder from the [UnJS](https://unjs.io/) ecosystem, built on Node.js's native `util.parseArgs`.

## CLI Forge strengths

- **Rich option types** — `number`, `array`, and `object` options. citty supports [`string`, `boolean`, `enum`, and `positional`](https://github.com/unjs/citty#argument-types).
- **Validation** — [Choices, conflicts, implications](/docs/guides/validation), and custom validators. citty has `required` and enum constraints.
- **Middleware** — Full [middleware pipeline](/docs/guides/middleware). citty has [`setup`/`cleanup` hooks](https://github.com/unjs/citty#hooks) and [plugins](https://github.com/unjs/citty#plugins), but no general middleware.
- **Config files** — Built-in [loading with `extends`](/docs/guides/configuration-files).
- **[Documentation generation](/docs/cli/generate-documentation), [interactive shell](/docs/guides/quick-start#the-interactive-shell), [test harness](/docs/guides/testing)** — None of these exist in citty.

## citty strengths

- **Zero dependencies** — Uses Node.js's native [`util.parseArgs`](https://nodejs.org/api/util.html#utilparseargsconfig).
- **Plugin system** — [`defineCittyPlugin()`](https://github.com/unjs/citty#plugins) for reusable setup/cleanup hooks.
- **Lazy async commands** — [Subcommands can be dynamically imported](https://github.com/unjs/citty#lazy-commands) for fast startup.
- **Pre-1.0 flexibility** — Still evolving; the API surface is minimal and focused.

## Side-by-side example

The same CLI — a `greet` command with `hello` and `goodbye` subcommands — implemented in both libraries.

<div class="code-tabs" data-default="citty">
<div class="code-tab" data-tab="citty">

<%= example('framework-comparison').file('citty.ts') %>

</div>
<div class="code-tab" data-tab="CLI Forge">

<%= example('framework-comparison').file('cli-forge.ts') %>

</div>
</div>

---

[Back to comparison overview](/docs/guides/comparison) · [View all framework examples](/examples/framework-comparison)
