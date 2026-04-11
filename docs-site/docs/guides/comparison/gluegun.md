---
title: CLI Forge vs. gluegun
description: Detailed comparison of CLI Forge and gluegun — type safety, middleware, toolbox, templates, and more.
nav:
  order: 10
---

# CLI Forge vs. gluegun

[Gluegun](https://infinitered.github.io/gluegun/) is a batteries-included toolkit for building CLIs, created by [Infinite Red](https://infinite.red/). It powers Ignite CLI (React Native) and was formerly used by AWS Amplify CLI.

> [!NOTE]
> Gluegun is in [maintenance mode](https://github.com/infinitered/gluegun#community-supported) — Infinite Red no longer develops new features, but community PRs for stability, performance, and type improvements are still reviewed and released.

## CLI Forge strengths

- **Type-safe inference** — [Infers types](/docs/guides/typescript) from option definitions. Gluegun's [toolbox](https://infinitered.github.io/gluegun/#/toolbox-api) parameters are loosely typed (`{ [key: string]: any }`).
- **Validation** — [Choices, conflicts, implications](/docs/guides/validation) ([example](/examples/conflicts-and-implications)), and custom validators.
- **Middleware** — Full [middleware pipeline](/docs/guides/middleware) ([example](/examples/middleware-composition)) for argument transformation. Gluegun has extensions that modify the toolbox, but no argument middleware.
- **Programmatic registration** — Commands are defined inline with full type safety ([example](/examples/multi-command-cli)). Gluegun primarily uses [filesystem-based command files](https://infinitered.github.io/gluegun/#/runtime).
- **Config file inheritance** — Built-in [config loading with `extends`](/docs/guides/configuration-files) ([example](/examples/config-inheritance)). Gluegun uses [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) for discovery but without inheritance.
- **Documentation generation** — [Built-in](/docs/cli/generate-documentation).
- **Active maintenance** — CLI Forge is actively developed.

## gluegun strengths

- **Batteries included** — [Bundles](https://infinitered.github.io/gluegun/#/toolbox-api) HTTP client, filesystem utilities, interactive prompts, template engine (EJS), spinners, and colored output.
- **Template system** — [EJS-based code generation](https://infinitered.github.io/gluegun/#/toolbox-template) from template files. Ideal for scaffolding tools and project generators.
- **Plugin system** — [Plugins](https://infinitered.github.io/gluegun/#/plugins) can add commands, extensions, and templates via directory conventions.
- **Prompts** — Built-in interactive prompting via [enquirer](https://github.com/enquirer/enquirer).

## Side-by-side example

Gluegun uses filesystem-based command discovery, so a single-file side-by-side example isn't practical. See the [CLI Forge implementation](/examples/framework-comparison) for the reference CLI used across all comparisons.

---

[Back to comparison overview](/docs/guides/comparison) · [View all framework examples](/examples/framework-comparison)
