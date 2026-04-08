---
title: Comparison with Other Tools
description: How CLI Forge compares to yargs, commander, oclif, clipanion, cac, meow, citty, cleye, Effect CLI, gluegun, and Node.js util.parseArgs
nav:
  order: 9
---

# Comparison with other tools

> **Disclaimer:** This page is written and maintained by the CLI Forge team. We've done our best to be accurate and fair, citing official documentation for every claim. If anything feels inaccurate or misrepresented, [PRs are welcome](https://github.com/AgentEnder/cli-forge/edit/main/docs-site/docs/guides/comparison.md).

The Node.js ecosystem has many CLI building libraries, each with different design goals and tradeoffs. This guide compares CLI Forge with the most popular alternatives to help you choose the right tool for your project.

## Feature matrix

A high-level overview of feature support across libraries. See the [detailed comparisons](#detailed-comparisons) below for nuance.

### CLI builder libraries

| Feature | cli-forge | [yargs](https://yargs.js.org/) | [commander](https://github.com/tj/commander.js) | [oclif](https://oclif.io/) | [clipanion](https://mael.dev/clipanion/) | [cac](https://github.com/cacjs/cac) |
|---|---|---|---|---|---|---|
| **Type-safe inference** | Full | Partial | Via plugin | Per-command | Yes | No |
| **API style** | Fluent builder | Fluent builder | Fluent builder | Class-based | Class-based | Fluent builder |
| **Subcommands** | Yes | Yes | Yes | Yes (filesystem) | Yes | Yes |
| **Middleware** | Yes | Yes | Hooks only | Hooks only | No | No |
| **Object options** | Yes | No | No | No | No | Dot-notation |
| **Config files** | Yes (with `extends`) | Yes | No | No | No | No |
| **Auto help generation** | Yes | Yes | Yes | Yes | Yes | Yes |
| **Doc generation** | Yes | No | No | README only | No | No |
| **Interactive shell** | Yes | No | No | No | No | No |
| **Test harness** | Yes | No | No | Yes | No | No |
| **Env variable support** | Yes | Yes | Yes | Yes | No | No |
| **Validation** | Yes | Yes | Yes | Yes | Via typanion | No |
| **Zod integration** | Yes (middleware) | No | No | No | No | No |
| **Zero dependencies** | No | No | Yes | No | No | Yes |

### Lightweight and minimal parsers

| Feature | cli-forge | [meow](https://github.com/sindresorhus/meow) | [citty](https://github.com/unjs/citty) | [cleye](https://github.com/privatenumber/cleye) | [Node.js `util.parseArgs`](https://nodejs.org/api/util.html#utilparseargsconfig) |
|---|---|---|---|---|---|
| **Type-safe inference** | Full | Yes | Yes | Yes | No |
| **API style** | Fluent builder | Single function | Declarative | Declarative | Single function |
| **Subcommands** | Yes | Basic | Yes | Yes | No |
| **Middleware** | Yes | No | Hooks only | No | No |
| **Object options** | Yes | No | No | No | No |
| **Config files** | Yes (with `extends`) | No | No | No | No |
| **Auto help generation** | Yes | Manual | Yes | Yes | No |
| **Validation** | Yes | Choices only | Basic | Via custom fns | No |
| **Env variable support** | Yes | No | No | No | No |
| **Zero dependencies** | No | Yes | Yes | No | Built-in |

### Frameworks and ecosystems

| Feature | cli-forge | [oclif](https://oclif.io/) | [@effect/cli](https://github.com/Effect-TS/effect/blob/main/packages/cli/README.md) | [gluegun](https://infinitered.github.io/gluegun/) |
|---|---|---|---|---|
| **Type-safe inference** | Full | Per-command | Full (Effect types) | No |
| **API style** | Fluent builder | Class-based | Functional/declarative | Toolbox + filesystem |
| **Subcommands** | Yes | Yes (filesystem) | Yes | Yes (filesystem) |
| **Middleware** | Yes | Hooks only | Effect layers | Extensions |
| **Config files** | Yes (with `extends`) | No | No | Yes (cosmiconfig) |
| **Plugin system** | No | Yes | No | Yes |
| **Auto help generation** | Yes | Yes | Yes | Basic |
| **Doc generation** | Yes | README only | No | No |
| **Interactive shell** | Yes | No | Wizard mode | No |
| **Test harness** | Yes | Yes | Via Effect testing | No |
| **Template/scaffolding** | No | Yes (`oclif generate`) | No | Yes (EJS) |
| **Distribution packaging** | No | Yes (`oclif pack`) | No | No |
| **Ecosystem buy-in** | Standalone | oclif conventions | Effect ecosystem | Gluegun toolbox |

## What "type-safe inference" means

Not all TypeScript support is equal. Most libraries ship type declarations, but the depth of inference varies significantly.

**Full inference** (cli-forge) means each `.option()` call expands a generic type parameter. The handler receives a precisely typed object without any manual type annotations:

```typescript
cli('app')
  .option('port', { type: 'number', default: 3000 })
  .option('host', { type: 'string' })
  .command('serve', {
    handler: (args) => {
      // args.port is number, args.host is string | undefined
      // No manual type annotations needed
    },
  });
```

**Partial inference** (yargs) provides some automatic typing via [`@types/yargs`](https://www.npmjs.com/package/@types/yargs), but complex CLIs often need manual `Arguments` interface definitions. The `.parse()` method returns `Arguments | Promise<Arguments>`, requiring consumers to choose `.parseSync()` or `await .parse()`. See the [yargs TypeScript docs](https://github.com/yargs/yargs/blob/main/docs/typescript.md) for details.

**Per-command inference** (oclif) types args and flags within a single command via `this.parse(MyCommand)`, but types don't accumulate across a command hierarchy. See [oclif flags documentation](https://oclif.io/docs/flags/).

**Via plugin** (commander) requires the separate [`@commander-js/extra-typings`](https://github.com/commander-js/extra-typings) package for type-safe `.opts()` return values. Core commander [types `.opts()` as a generic object](https://github.com/tj/commander.js#typescript).

## Detailed comparisons

### vs. yargs

[Yargs](https://yargs.js.org/) (v18) is one of the most established CLI libraries with ~159 million weekly npm downloads. It shares a similar fluent API style with CLI Forge.

**Where CLI Forge goes further:**

- **Type accumulation** — Each `.option()` call in CLI Forge [progressively builds a TypeScript type](/docs/guides/typescript). Yargs relies on external [`@types/yargs`](https://www.npmjs.com/package/@types/yargs) definitions that may lag behind releases, and complex CLIs often require [manual interface definitions](https://github.com/yargs/yargs/blob/main/docs/typescript.md).
- **Object options** — CLI Forge supports `type: 'object'` with fully typed `properties`. Yargs has no equivalent; nested structures require manual parsing.
- **Documentation generation** — [`cli-forge generate-docs`](/docs/cli/generate-documentation) produces markdown or JSON documentation from your CLI definition. Yargs has no built-in doc generation.
- **Interactive shell** — CLI Forge provides an [opt-in REPL](/docs/guides/quick-start#the-interactive-shell) for exploring commands interactively. Yargs has no equivalent.
- **Test harness** — [`TestHarness`](/docs/guides/testing) lets you test parsing and command resolution without running handlers. Yargs testing requires manual setup.
- **Config file inheritance** — CLI Forge config files support [`extends` for composition](/docs/guides/configuration-files). Yargs supports config files via [`.config()`](https://yargs.js.org/docs/#api-reference-configkey-description-parsefn) and [`.pkgConf()`](https://yargs.js.org/docs/#api-reference-pkgconfkey-cwd), but without inheritance chains.
- **Zod integration** — CLI Forge provides a [middleware for Zod schema validation](/docs/guides/middleware). Yargs validation is limited to [`.check()` callbacks](https://yargs.js.org/docs/#api-reference-checkfn-globaltrue).

**Where yargs has the edge:**

- **Ecosystem maturity** — Yargs has extensive community documentation, Stack Overflow answers, and third-party integrations built over many years.
- **Internationalization** — Built-in i18n support with [`.locale()`](https://yargs.js.org/docs/#api-reference-localelocale) and [`.updateStrings()`](https://yargs.js.org/docs/#api-reference-updatelocaleobj) for locale-aware help text.
- **Tab completion** — [`.completion()`](https://yargs.js.org/docs/#api-reference-completioncmd-description-fn) generates bash/zsh completion scripts. CLI Forge does not yet offer shell completions.
- **Filesystem routing** — [`.commandDir()`](https://yargs.js.org/docs/#api-reference-commanddirdirectory-opts) loads commands from a directory structure. CLI Forge uses programmatic registration exclusively.
- **Usage string parsing** — Yargs can define options from [usage strings](https://yargs.js.org/docs/#api-reference-usage-desc-builder-handler) like `'--port <number>'`. CLI Forge requires explicit option objects (by design, for type safety).
- **Deno and browser support** — Yargs officially supports [Deno](https://github.com/yargs/yargs#deno-example) and [browsers](https://github.com/yargs/yargs/blob/main/docs/browser.md). CLI Forge supports [browsers](/docs/guides/browser-usage).

### vs. commander

[Commander](https://github.com/tj/commander.js) (v14) is the most downloaded CLI library (~1.4 billion monthly npm downloads) with zero runtime dependencies.

**Where CLI Forge goes further:**

- **Built-in type inference** — Commander's core [types `.opts()` as a generic object](https://github.com/tj/commander.js#typescript). Type-safe options require the separate [`@commander-js/extra-typings`](https://github.com/commander-js/extra-typings) package. CLI Forge [infers types](/docs/guides/typescript) from every `.option()` call with no extra packages.
- **Rich option types** — Commander treats all option arguments as strings by default; numbers, booleans, and arrays require [custom processing functions](https://github.com/tj/commander.js#custom-option-processing). CLI Forge supports `string`, `number`, `boolean`, `array`, and `object` types natively.
- **Middleware** — CLI Forge's [middleware pipeline](/docs/guides/middleware) transforms args between parsing and handler execution. Commander provides [`preAction`/`postAction` hooks](https://github.com/tj/commander.js#life-cycle-hooks) but not a general-purpose middleware system.
- **Config file support** — CLI Forge loads config files with [`extends` inheritance](/docs/guides/configuration-files). Commander has no config file loading.
- **Documentation generation** — Built-in [`generate-docs`](/docs/cli/generate-documentation) command. Commander has no equivalent.
- **Interactive shell** — [Opt-in REPL mode](/docs/guides/quick-start#the-interactive-shell). Commander has no shell.
- **Test harness** — [`TestHarness`](/docs/guides/testing) for parsing tests. Commander requires manual test setup.

**Where commander has the edge:**

- **Zero dependencies** — Commander is entirely self-contained. CLI Forge has runtime dependencies.
- **Adoption** — Ubiquitous in the Node.js ecosystem with extensive documentation and examples.
- **Standalone executables** — Commander can [spawn subcommands as separate processes](https://github.com/tj/commander.js#stand-alone-executable-subcommands) (e.g., `git`-style where `my-app install` runs a `my-app-install` binary). CLI Forge runs all commands in-process.
- **Lightweight API** — Commander's [string-based option definitions](https://github.com/tj/commander.js#options) (`'-p, --port <number>'`) are concise for simple CLIs where full type inference isn't needed.

### vs. oclif

[oclif](https://oclif.io/) (v4) is a full-featured CLI framework maintained by Salesforce. It powers the Heroku CLI, Salesforce CLI, and Twilio CLI.

**Where CLI Forge goes further:**

- **Fluent builder API** — CLI Forge uses a chainable builder pattern. oclif requires [class-based commands](https://oclif.io/docs/commands/) in separate files with static property declarations.
- **Type accumulation** — Types [flow through the builder chain](/docs/guides/typescript). In oclif, each command types its own [flags](https://oclif.io/docs/flags/)/args via `this.parse()` without accumulation across a command tree.
- **Object options** — Nested, typed object options. oclif has no equivalent.
- **Middleware** — General-purpose [middleware pipeline](/docs/guides/middleware). oclif has [lifecycle hooks](https://oclif.io/docs/hooks/) (`init`, `prerun`, `postrun`) but they're file-based declarations, not inline composition.
- **Config file inheritance** — Built-in [config loading with `extends`](/docs/guides/configuration-files). oclif has [no config file support for end-user options](https://oclif.io/docs/configuring_your_cli/) (CLI metadata lives in `package.json`).
- **Lightweight setup** — Define a CLI in a single file. oclif is designed around [code generation and scaffolding](https://oclif.io/docs/generating/) with a specific project structure.

**Where oclif has the edge:**

- **Plugin system** — oclif has a [mature plugin architecture](https://oclif.io/docs/plugins/). Plugins can add commands and hooks, and users can install plugins at runtime. CLI Forge has no plugin system.
- **Distribution** — [`oclif pack`](https://oclif.io/docs/releasing/) creates installable artifacts (deb, macOS, Windows). CLI Forge doesn't handle distribution.
- **Enterprise-proven** — Powers production CLIs at Salesforce, Heroku, Twilio, and Shopify.
- **Filesystem routing** — Commands are [auto-discovered from the directory structure](https://oclif.io/docs/command_discovery_strategies/). Large CLI teams can organize commands into files without explicit registration.
- **JSON output** — Built-in [`--json` flag support](https://oclif.io/docs/json/) with `enableJsonFlag`. CLI Forge requires manual implementation.
- **Built-in testing** — [`@oclif/test`](https://oclif.io/docs/testing/) package with CLI-specific test utilities.

### vs. clipanion

[Clipanion](https://mael.dev/clipanion/) (v3 stable, v4 RC) is a class-based CLI library created by the author of Yarn. It powers Yarn Berry.

**Where CLI Forge goes further:**

- **Fluent API** — Chainable builder pattern vs. class-based command definitions with static properties.
- **Middleware** — CLI Forge has a [first-class middleware pipeline](/docs/guides/middleware). Clipanion has no middleware; class inheritance serves a similar but more limited purpose.
- **Config file support** — Built-in [config loading with `extends`](/docs/guides/configuration-files). Clipanion has none.
- **Environment variables** — Declarative env var mapping to options. Clipanion provides `env` in the command context but has no automatic option-to-env-var binding.
- **Object options** — Typed nested objects. Clipanion [options](https://mael.dev/clipanion/docs/options) are flat strings/booleans/counters/arrays; numbers require [typanion validators](https://mael.dev/clipanion/docs/validation).
- **Documentation generation** — Built-in [doc generation](/docs/cli/generate-documentation). Clipanion has none.
- **Interactive shell** — [Opt-in REPL](/docs/guides/quick-start#the-interactive-shell). Clipanion has none.
- **Test harness** — [`TestHarness`](/docs/guides/testing) for parsing tests. Clipanion requires manual test setup.

**Where clipanion has the edge:**

- **State machine parser** — Clipanion compiles commands into an [optimized state machine](https://mael.dev/clipanion/docs/paths), enabling advanced features like command overloading (multiple commands sharing [path overlaps](https://mael.dev/clipanion/docs/paths#path-overlaps), disambiguated by required options).
- **Command proxying** — [`Option.Proxy()`](https://mael.dev/clipanion/docs/options#proxies) captures remaining args transparently without requiring a `--` separator. Useful for wrapper commands.
- **Typanion validation** — Tight integration with the [typanion](https://mael.dev/clipanion/docs/validation) library for composable runtime validation and coercion.
- **Battle-tested** — Powers Yarn Berry, one of the most complex CLIs in the JavaScript ecosystem.
- **Tree-shakeable** — [Functional core architecture](https://mael.dev/clipanion/) supports bundler tree shaking.

### vs. cac

[cac](https://github.com/cacjs/cac) (v7) is a zero-dependency, single-file CLI library used by Vite and Vitest.

**Where CLI Forge goes further:**

- **Type inference** — CLI Forge [infers types](/docs/guides/typescript) from option definitions. cac returns `{ [k: string]: any }` for parsed options, requiring manual type assertions.
- **Rich option types** — Native `number`, `boolean`, `array`, and `object` types. cac infers types from bracket syntax at runtime with no compile-time safety.
- **Validation** — [Choices, conflicts, implications](/docs/guides/validation), required options, and custom validators. cac only validates required positional arguments and unknown options.
- **Middleware** — Full [middleware pipeline](/docs/guides/middleware). cac has none.
- **Config files** — Built-in [loading with `extends`](/docs/guides/configuration-files). cac has none.
- **Documentation generation** — [Built-in](/docs/cli/generate-documentation). cac has none.
- **Interactive shell** — [Opt-in REPL](/docs/guides/quick-start#the-interactive-shell). cac has none.
- **Test harness** — [`TestHarness`](/docs/guides/testing) for parsing tests. cac requires manual setup.

**Where cac has the edge:**

- **Zero dependencies, single file** — Extremely lightweight (~3.5KB minified).
- **Dot-notation** — [`--env.API_SECRET foo`](https://github.com/cacjs/cac#dot-nested-options) automatically creates nested objects. CLI Forge uses explicit `type: 'object'` with `properties` for typed nesting.
- **Deno support** — Available [via JSR](https://github.com/cacjs/cac#with-deno). CLI Forge targets Node.js and Bun.
- **Event system** — [Listen for command events](https://github.com/cacjs/cac#events) (`command:*`) for custom routing logic.
- **Proven at scale** — Powers Vite, Vitest, and other popular tools.

### vs. meow

[meow](https://github.com/sindresorhus/meow) (v14) is a zero-dependency, minimalist CLI helper by Sindre Sorhus.

**Where CLI Forge goes further:**

- **Auto-generated help** — Help text is generated from option definitions. meow requires you to [write help text manually](https://github.com/sindresorhus/meow#helptext) as a string.
- **Subcommands** — Full command tree with nested subcommands and handlers. meow has [basic command detection](https://github.com/sindresorhus/meow#commands) that stops parsing at the command name, requiring manual delegation to a new `meow()` call.
- **Rich option types** — Native `object` and `array` types. meow supports [`string`, `number`, and `boolean`](https://github.com/sindresorhus/meow#flags).
- **[Middleware](/docs/guides/middleware), [config files](/docs/guides/configuration-files), [doc generation](/docs/cli/generate-documentation), [interactive shell](/docs/guides/quick-start#the-interactive-shell), [test harness](/docs/guides/testing)** — All present in CLI Forge, none in meow.
- **Validation** — [Choices, conflicts, implications](/docs/guides/validation), and custom validators. meow has [`choices` and `isRequired`](https://github.com/sindresorhus/meow#flags).

**Where meow has the edge:**

- **Zero dependencies** — Completely self-contained.
- **Simplicity** — A single function call returns parsed results. No builder chain, no class hierarchy. Ideal for simple scripts that need a few flags.
- **ESM-native** — ESM-only by design.

### vs. citty

[citty](https://github.com/unjs/citty) (v0.2) is a zero-dependency CLI builder from the [UnJS](https://unjs.io/) ecosystem, built on Node.js's native `util.parseArgs`.

**Where CLI Forge goes further:**

- **Rich option types** — `number`, `array`, and `object` options. citty supports [`string`, `boolean`, `enum`, and `positional`](https://github.com/unjs/citty#argument-types).
- **Validation** — [Choices, conflicts, implications](/docs/guides/validation), and custom validators. citty has `required` and enum constraints.
- **Middleware** — Full [middleware pipeline](/docs/guides/middleware). citty has [`setup`/`cleanup` hooks](https://github.com/unjs/citty#hooks) and a [plugin system](https://github.com/unjs/citty#plugins), but no general middleware.
- **Config files** — Built-in [loading with `extends`](/docs/guides/configuration-files). citty has none.
- **[Documentation generation](/docs/cli/generate-documentation), [interactive shell](/docs/guides/quick-start#the-interactive-shell), [test harness](/docs/guides/testing)** — All present in CLI Forge, none in citty.

**Where citty has the edge:**

- **Zero dependencies** — Uses Node.js's native [`util.parseArgs`](https://nodejs.org/api/util.html#utilparseargsconfig) with no external dependencies.
- **Plugin system** — [`defineCittyPlugin()`](https://github.com/unjs/citty#plugins) for reusable setup/cleanup hooks. CLI Forge has no plugin mechanism.
- **Lazy async commands** — [Subcommands can be dynamically imported](https://github.com/unjs/citty#lazy-commands) for fast startup.
- **Pre-1.0 flexibility** — Still evolving; the API surface is minimal and focused.

### vs. cleye

[cleye](https://github.com/privatenumber/cleye) (v2.3) is a declarative CLI builder with strong TypeScript support and responsive help tables.

**Where CLI Forge goes further:**

- **Middleware** — Full [middleware pipeline](/docs/guides/middleware). cleye has none.
- **Config files** — Built-in [loading with `extends`](/docs/guides/configuration-files). cleye has none.
- **Built-in types** — Native `number`, `boolean`, `array`, and `object` types via declarative config. cleye uses JavaScript constructor functions (`String`, `Number`, `Boolean`) or [custom `(string) => T` functions](https://github.com/privatenumber/cleye#custom-flag-types--validation).
- **Validation** — [Choices, conflicts, implications](/docs/guides/validation), and custom validators. cleye validates via [custom type functions](https://github.com/privatenumber/cleye#custom-flag-types--validation) (throw to reject).
- **[Documentation generation](/docs/cli/generate-documentation), [interactive shell](/docs/guides/quick-start#the-interactive-shell), [test harness](/docs/guides/testing)** — All present in CLI Forge, none in cleye.
- **Env variable support** — Declarative env var mapping. cleye has none.

**Where cleye has the edge:**

- **Responsive help** — [Terminal-width-aware help tables](https://github.com/privatenumber/cleye#responsive-tables) that adapt to the console size, powered by [terminal-columns](https://github.com/privatenumber/terminal-columns).
- **Custom type functions** — Any [`(string) => T` function](https://github.com/privatenumber/cleye#custom-flag-types--validation) works as an option type, providing flexible parsing and validation in one step.
- **Command type narrowing** — When checking `argv.command` in TypeScript, available flags and parameters are [automatically narrowed](https://github.com/privatenumber/cleye#defining-commands) to the matched command.
- **Strict mode with suggestions** — [`strictFlags: true`](https://github.com/privatenumber/cleye#strict-flags) rejects unknown flags and suggests the closest match within 2 edit distance.

### vs. @effect/cli

[@effect/cli](https://github.com/Effect-TS/effect/blob/main/packages/cli/README.md) (v0.75) is a CLI library built on the [Effect](https://effect.website/) ecosystem. Commands are Effect computations with typed errors, dependency injection, and structured concurrency.

**Where CLI Forge goes further:**

- **Standalone** — CLI Forge is a self-contained library. @effect/cli requires the Effect runtime (`effect`, `@effect/platform`, `@effect/platform-node` or `@effect/platform-bun`), which is a significant dependency and conceptual commitment.
- **Fluent builder API** — Chainable `.option().command()` pattern. @effect/cli uses [separate constructors](https://github.com/Effect-TS/effect/blob/main/packages/cli/README.md#our-first-command) ([`Command.make`](https://effect-ts.github.io/effect/cli/Command.ts.html#make), [`Options.text`](https://effect-ts.github.io/effect/cli/Options.ts.html#text), `Args.text`) composed via `pipe()`.
- **Object options** — Typed nested objects via `type: 'object'`. @effect/cli defines flat options only.
- **Config file inheritance** — Built-in [config loading with `extends`](/docs/guides/configuration-files). @effect/cli has no config file support.
- **Documentation generation** — Built-in [`generate-docs`](/docs/cli/generate-documentation) command. @effect/cli has no equivalent.
- **Lower learning curve** — Familiar API for developers coming from yargs or commander. @effect/cli requires understanding [Effect's programming model](https://effect.website/docs/getting-started/introduction/) (layers, services, fibers).

**Where @effect/cli has the edge:**

- **Effect integration** — Commands are Effect values with typed errors, dependency injection via layers, and structured concurrency. If your application already uses Effect, the CLI layer [integrates seamlessly](https://github.com/Effect-TS/effect/blob/main/packages/cli/README.md#setting-up-the-main-command).
- **Wizard mode** — Built-in [`--wizard` flag](https://github.com/Effect-TS/effect/blob/main/packages/cli/README.md#using-the-wizard-mode) walks users through command options interactively.
- **Shell completions** — Built-in [`--completions` flag](https://github.com/Effect-TS/effect/blob/main/packages/cli/README.md#overview-of-built-in-options) generates bash, zsh, and fish completion scripts. CLI Forge does not yet offer shell completions.
- **Schema validation** — Options can be validated and transformed via Effect's `Schema` module using [`Options.withSchema()`](https://effect-ts.github.io/effect/cli/Options.ts.html#withschema).
- **Prompt fallbacks** — Options can fall back to interactive prompts when not provided via [`Options.withFallbackPrompt()`](https://effect-ts.github.io/effect/cli/Options.ts.html#withfallbackprompt).

### vs. gluegun

[Gluegun](https://infinitered.github.io/gluegun/) (v5.2) is a batteries-included toolkit for building CLIs, created by [Infinite Red](https://infinite.red/). It powers Ignite CLI (React Native) and was formerly used by AWS Amplify CLI.

> **Note:** Gluegun is [community-maintained](https://github.com/infinitered/gluegun#community-supported) and no longer under active development. The maintainers recommend considering alternatives for new projects.

**Where CLI Forge goes further:**

- **Type-safe inference** — CLI Forge [infers types](/docs/guides/typescript) from option definitions. Gluegun's [toolbox](https://infinitered.github.io/gluegun/#/toolbox-api) parameters are loosely typed (`{ [key: string]: any }`).
- **Validation** — [Choices, conflicts, implications](/docs/guides/validation), and custom validators. Gluegun has no built-in argument validation.
- **Middleware** — Full [middleware pipeline](/docs/guides/middleware) for argument transformation. Gluegun has extensions that modify the toolbox, but no argument middleware.
- **Programmatic registration** — Commands are defined inline with full type safety. Gluegun requires [filesystem-based command files](https://infinitered.github.io/gluegun/#/runtime).
- **Config file inheritance** — Built-in [config loading with `extends`](/docs/guides/configuration-files). Gluegun uses [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) for config discovery but without inheritance.
- **Documentation generation** — [Built-in](/docs/cli/generate-documentation). Gluegun has none.
- **Active maintenance** — CLI Forge is actively developed. Gluegun is [in maintenance mode](https://github.com/infinitered/gluegun#community-supported) with no new features planned.

**Where gluegun has the edge:**

- **Batteries included** — Gluegun [bundles](https://infinitered.github.io/gluegun/#/toolbox-api) HTTP client ([apisauce](https://github.com/infinitered/apisauce)), filesystem utilities ([fs-jetpack](https://github.com/szwacz/fs-jetpack)), interactive prompts ([enquirer](https://github.com/enquirer/enquirer)), template engine (EJS), spinners, and colored output. CLI Forge focuses solely on argument parsing and command management.
- **Template system** — [EJS-based code generation](https://infinitered.github.io/gluegun/#/toolbox-template) from template files is a first-class feature. Ideal for scaffolding tools and project generators.
- **Plugin system** — [Plugins](https://infinitered.github.io/gluegun/#/plugins) can add commands, extensions, and templates via directory conventions.
- **Prompts** — Built-in interactive prompting. CLI Forge does not include prompts.

### vs. Node.js util.parseArgs

[`util.parseArgs`](https://nodejs.org/api/util.html#utilparseargsconfig) is Node.js's built-in argument parser, available since Node.js v18.3.0 (stable in v20.0.0). It is intentionally minimal — a low-level primitive for simple scripts.

**Where CLI Forge goes further:**

CLI Forge provides everything that `util.parseArgs` deliberately excludes:

- **Rich option types** — `string`, `number`, `boolean`, `array`, and `object`. `util.parseArgs` supports only [`'string'` and `'boolean'`](https://nodejs.org/api/util.html#utilparseargsconfig).
- **Type inference** — [Fully typed](/docs/guides/typescript) parsed output. `util.parseArgs` returns untyped `string | boolean | string[] | boolean[]` values.
- **Subcommands** — Full command tree with nested subcommands, builders, and handlers. `util.parseArgs` has no command concept.
- **Help generation** — Automatic help text from option definitions. `util.parseArgs` generates no output.
- **Validation** — [Required, choices, conflicts, implications](/docs/guides/validation), custom validators. `util.parseArgs` has no validation beyond [strict mode](https://nodejs.org/api/util.html#utilparseargsconfig) (rejecting unknown flags).
- **Coercion** — Automatic type coercion (strings to numbers, etc.). `util.parseArgs` performs no coercion.
- **[Middleware](/docs/guides/middleware), [config files](/docs/guides/configuration-files), env variables, [doc generation](/docs/cli/generate-documentation), [interactive shell](/docs/guides/quick-start#the-interactive-shell), [test harness](/docs/guides/testing)** — All present in CLI Forge, none in `util.parseArgs`.

**Where util.parseArgs has the edge:**

- **Zero dependencies, built-in** — Part of Node.js core. No installation needed.
- **Minimal API surface** — A [single function call](https://nodejs.org/api/util.html#utilparseargsconfig) with a simple config object. No abstractions to learn.
- **Tokens API** — Returns [detailed parse tokens](https://nodejs.org/api/util.html#parseargs-tokens) for custom post-processing, useful when building your own parser on top.
- **No lock-in** — As a Node.js built-in, it has no supply chain risk and will be maintained as long as Node.js exists.

`util.parseArgs` is best suited for simple scripts with a handful of flags. For anything involving subcommands, validation, help text, or type safety, a library like CLI Forge will save significant effort.

## Choosing the right tool

| If you need... | Consider |
|---|---|
| Full type safety through the entire chain | **CLI Forge** |
| Maximum ecosystem support and community resources | **yargs** or **commander** |
| Enterprise plugin system and distribution packaging | **oclif** |
| Class-based commands with state machine routing | **clipanion** |
| A minimal, zero-dependency single-file library | **cac** or **meow** |
| Something lightweight from the UnJS ecosystem | **citty** |
| Simple script with a few flags | **meow**, **cleye**, or **`util.parseArgs`** |
| Config file inheritance and doc generation together | **CLI Forge** |
| Interactive shell for complex command trees | **CLI Forge** |
| Typed errors and dependency injection (Effect ecosystem) | **@effect/cli** |
| Scaffolding/code generation with templates and prompts | **gluegun** or **oclif** |
| No third-party dependencies at all | **`util.parseArgs`** (built into Node.js) |

## Links and references

- **CLI Forge** — [Documentation](https://craigory.dev/cli-forge/) · [GitHub](https://github.com/agentender/cli-forge) · [npm](https://www.npmjs.com/package/cli-forge)
- **yargs** — [Documentation](https://yargs.js.org/) · [GitHub](https://github.com/yargs/yargs) · [npm](https://www.npmjs.com/package/yargs)
- **commander** — [GitHub](https://github.com/tj/commander.js) · [npm](https://www.npmjs.com/package/commander)
- **oclif** — [Documentation](https://oclif.io/) · [GitHub](https://github.com/oclif/oclif) · [npm](https://www.npmjs.com/package/oclif)
- **clipanion** — [Documentation](https://mael.dev/clipanion/) · [GitHub](https://github.com/arcanis/clipanion) · [npm](https://www.npmjs.com/package/clipanion)
- **cac** — [GitHub](https://github.com/cacjs/cac) · [npm](https://www.npmjs.com/package/cac)
- **meow** — [GitHub](https://github.com/sindresorhus/meow) · [npm](https://www.npmjs.com/package/meow)
- **citty** — [GitHub](https://github.com/unjs/citty) · [npm](https://www.npmjs.com/package/citty)
- **cleye** — [GitHub](https://github.com/privatenumber/cleye) · [npm](https://www.npmjs.com/package/cleye)
- **@effect/cli** — [README](https://github.com/Effect-TS/effect/blob/main/packages/cli/README.md) · [API Reference](https://effect-ts.github.io/effect/cli/) · [npm](https://www.npmjs.com/package/@effect/cli)
- **gluegun** — [Documentation](https://infinitered.github.io/gluegun/) · [GitHub](https://github.com/infinitered/gluegun) · [npm](https://www.npmjs.com/package/gluegun)
- **Node.js util.parseArgs** — [Documentation](https://nodejs.org/api/util.html#utilparseargsconfig) · [Original proposal](https://github.com/pkgjs/parseargs)
