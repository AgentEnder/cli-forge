---
title: CLI Forge vs. gluegun
description: Detailed comparison of CLI Forge and gluegun — type safety, middleware, toolbox, templates, and more.
nav:
  order: 10
---

# CLI Forge vs. gluegun

[Gluegun](https://infinitered.github.io/gluegun/) is a batteries-included toolkit for building CLIs, created by [Infinite Red](https://infinite.red/). It powers Ignite CLI (React Native) and was formerly used by AWS Amplify CLI.

> **Note:** Gluegun is in [maintenance mode](https://github.com/infinitered/gluegun#community-supported) — Infinite Red no longer develops new features, but community PRs for stability, performance, and type improvements are still reviewed and released.

Gluegun uses filesystem-based command discovery, so a single-file side-by-side example isn't practical. See the [CLI Forge example](/examples/framework-comparison) for the reference implementation.

## Where CLI Forge goes further

- **Type-safe inference** — CLI Forge [infers types](/docs/guides/typescript) from option definitions. Gluegun's [toolbox](https://infinitered.github.io/gluegun/#/toolbox-api) parameters are loosely typed (`{ [key: string]: any }`).
- **Validation** — [Choices, conflicts, implications](/docs/guides/validation), and custom validators. Gluegun has no built-in argument validation.
- **Middleware** — Full [middleware pipeline](/docs/guides/middleware) for argument transformation. Gluegun has extensions that modify the toolbox, but no argument middleware.
- **Programmatic registration** — Commands are defined inline with full type safety. Gluegun primarily uses [filesystem-based command files](https://infinitered.github.io/gluegun/#/runtime), though it also supports `.command()` for programmatic registration.
- **Config file inheritance** — Built-in [config loading with `extends`](/docs/guides/configuration-files). Gluegun uses [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) for config discovery but without inheritance.
- **Documentation generation** — [Built-in](/docs/cli/generate-documentation). Gluegun has none.
- **Active maintenance** — CLI Forge is actively developed. Gluegun is [in maintenance mode](https://github.com/infinitered/gluegun#community-supported) with no new features planned.

## Where gluegun has the edge

- **Batteries included** — Gluegun [bundles](https://infinitered.github.io/gluegun/#/toolbox-api) HTTP client ([apisauce](https://github.com/infinitered/apisauce)), filesystem utilities ([fs-jetpack](https://github.com/szwacz/fs-jetpack)), interactive prompts ([enquirer](https://github.com/enquirer/enquirer)), template engine (EJS), spinners, and colored output. CLI Forge focuses solely on argument parsing and command management.
- **Template system** — [EJS-based code generation](https://infinitered.github.io/gluegun/#/toolbox-template) from template files is a first-class feature. Ideal for scaffolding tools and project generators.
- **Plugin system** — [Plugins](https://infinitered.github.io/gluegun/#/plugins) can add commands, extensions, and templates via directory conventions.
- **Prompts** — Built-in interactive prompting. CLI Forge does not include prompts.
