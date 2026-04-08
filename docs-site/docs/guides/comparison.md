---
title: Comparison with Other Tools
description: How CLI Forge compares to yargs, commander, oclif, clipanion, cac, meow, citty, cleye, Effect CLI, gluegun, and Node.js util.parseArgs
nav:
  order: 9
---

# Comparison with other tools

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

| Feature | cli-forge | [oclif](https://oclif.io/) | [@effect/cli](https://effect.website/docs/cli/) | [gluegun](https://infinitered.github.io/gluegun/) |
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

**Partial inference** (yargs) provides some automatic typing via `@types/yargs`, but complex CLIs often need manual `Arguments` interface definitions. The `.parse()` method returns `Arguments | Promise<Arguments>`, requiring consumers to choose `.parseSync()` or `await .parse()`.

**Per-command inference** (oclif) types args and flags within a single command via `this.parse(MyCommand)`, but types don't accumulate across a command hierarchy.

**Via plugin** (commander) requires the separate [`@commander-js/extra-typings`](https://github.com/commander-js/extra-typings) package for type-safe `.opts()` return values. Core commander types `.opts()` as a generic object.

## Detailed comparisons

### vs. yargs

[Yargs](https://yargs.js.org/) (v18) is one of the most established CLI libraries with ~159 million weekly npm downloads. It shares a similar fluent API style with CLI Forge.

**Where CLI Forge goes further:**

- **Type accumulation** — Each `.option()` call in CLI Forge progressively builds a TypeScript type. Yargs relies on external `@types/yargs` definitions that may lag behind releases, and complex CLIs often require manual interface definitions.
- **Object options** — CLI Forge supports `type: 'object'` with fully typed `properties`. Yargs has no equivalent; nested structures require manual parsing.
- **Documentation generation** — `cli-forge generate-docs` produces markdown or JSON documentation from your CLI definition. Yargs has no built-in doc generation.
- **Interactive shell** — CLI Forge provides an opt-in REPL for exploring commands interactively. Yargs has no equivalent.
- **Test harness** — `TestHarness` lets you test parsing and command resolution without running handlers. Yargs testing requires manual setup.
- **Config file inheritance** — CLI Forge config files support `extends` for composition. Yargs supports config files via `.config()` and `.pkgConf()`, but without inheritance chains.
- **Zod integration** — CLI Forge provides a middleware for Zod schema validation. Yargs validation is limited to `.check()` callbacks.

**Where yargs has the edge:**

- **Ecosystem maturity** — Yargs has extensive community documentation, Stack Overflow answers, and third-party integrations built over many years.
- **Internationalization** — Built-in i18n support with `.locale()` and `.updateStrings()` for locale-aware help text.
- **Tab completion** — `.completion()` generates bash/zsh completion scripts. CLI Forge does not yet offer shell completions.
- **Filesystem routing** — `.commandDir()` loads commands from a directory structure. CLI Forge uses programmatic registration exclusively.
- **Usage string parsing** — Yargs can define options from usage strings like `'--port <number>'`. CLI Forge requires explicit option objects (by design, for type safety).
- **Deno and browser support** — Yargs officially supports Deno. Both libraries support browsers.

### vs. commander

[Commander](https://github.com/tj/commander.js) (v14) is the most downloaded CLI library (~1.4 billion monthly npm downloads) with zero runtime dependencies.

**Where CLI Forge goes further:**

- **Built-in type inference** — Commander's core types `.opts()` as a generic object. Type-safe options require the separate [`@commander-js/extra-typings`](https://github.com/commander-js/extra-typings) package. CLI Forge infers types from every `.option()` call with no extra packages.
- **Rich option types** — Commander treats all option arguments as strings by default; numbers, booleans, and arrays require custom processing functions. CLI Forge supports `string`, `number`, `boolean`, `array`, and `object` types natively.
- **Middleware** — CLI Forge's middleware pipeline transforms args between parsing and handler execution. Commander provides `preAction`/`postAction` hooks but not a general-purpose middleware system.
- **Config file support** — CLI Forge loads config files with `extends` inheritance. Commander has no config file loading.
- **Documentation generation** — Built-in `generate-docs` command. Commander has no equivalent.
- **Interactive shell** — Opt-in REPL mode. Commander has no shell.
- **Test harness** — `TestHarness` for parsing tests. Commander requires manual test setup.

**Where commander has the edge:**

- **Zero dependencies** — Commander is entirely self-contained. CLI Forge has runtime dependencies.
- **Adoption** — Ubiquitous in the Node.js ecosystem with extensive documentation and examples.
- **Standalone executables** — Commander can spawn subcommands as separate processes (e.g., `git`-style where `my-app install` runs a `my-app-install` binary). CLI Forge runs all commands in-process.
- **Lightweight API** — Commander's string-based option definitions (`'-p, --port <number>'`) are concise for simple CLIs where full type inference isn't needed.

### vs. oclif

[oclif](https://oclif.io/) (v4) is a full-featured CLI framework maintained by Salesforce. It powers the Heroku CLI, Salesforce CLI, and Twilio CLI.

**Where CLI Forge goes further:**

- **Fluent builder API** — CLI Forge uses a chainable builder pattern. oclif requires class-based commands in separate files with static property declarations.
- **Type accumulation** — Types flow through the builder chain. In oclif, each command types its own flags/args via `this.parse()` without accumulation across a command tree.
- **Object options** — Nested, typed object options. oclif has no equivalent.
- **Middleware** — General-purpose middleware pipeline. oclif has lifecycle hooks (`init`, `prerun`, `postrun`) but they're file-based declarations, not inline composition.
- **Config file inheritance** — Built-in config loading with `extends`. oclif has no config file support for end-user options (CLI metadata lives in `package.json`).
- **Lightweight setup** — Define a CLI in a single file. oclif is designed around code generation and scaffolding with a specific project structure.

**Where oclif has the edge:**

- **Plugin system** — oclif has a mature plugin architecture. Plugins can add commands and hooks, and users can install plugins at runtime. CLI Forge has no plugin system.
- **Distribution** — `oclif pack` creates installable artifacts (deb, macOS, Windows). CLI Forge doesn't handle distribution.
- **Enterprise-proven** — Powers production CLIs at Salesforce, Heroku, Twilio, and Shopify.
- **Filesystem routing** — Commands are auto-discovered from the directory structure. Large CLI teams can organize commands into files without explicit registration.
- **JSON output** — Built-in `--json` flag support with `enableJsonFlag`. CLI Forge requires manual implementation.
- **Built-in testing** — `@oclif/test` package with CLI-specific test utilities.

### vs. clipanion

[Clipanion](https://mael.dev/clipanion/) (v3 stable, v4 RC) is a class-based CLI library created by the author of Yarn. It powers Yarn Berry.

**Where CLI Forge goes further:**

- **Fluent API** — Chainable builder pattern vs. class-based command definitions with static properties.
- **Middleware** — CLI Forge has a first-class middleware pipeline. Clipanion has no middleware; class inheritance serves a similar but more limited purpose.
- **Config file support** — Built-in config loading with `extends`. Clipanion has none.
- **Environment variables** — Declarative env var mapping to options. Clipanion provides `env` in the command context but has no automatic option-to-env-var binding.
- **Object options** — Typed nested objects. Clipanion options are flat strings/booleans/counters/arrays; numbers require typanion validators.
- **Documentation generation** — Built-in doc generation. Clipanion has none.
- **Interactive shell** — Opt-in REPL. Clipanion has none.
- **Test harness** — `TestHarness` for parsing tests. Clipanion requires manual test setup.

**Where clipanion has the edge:**

- **State machine parser** — Clipanion compiles commands into an optimized state machine, enabling advanced features like command overloading (multiple commands sharing paths, disambiguated by required options).
- **Command proxying** — `Option.Proxy()` captures remaining args transparently without requiring a `--` separator. Useful for wrapper commands.
- **Typanion validation** — Tight integration with the [typanion](https://github.com/arcanis/typanion) library for composable runtime validation and coercion.
- **Battle-tested** — Powers Yarn Berry, one of the most complex CLIs in the JavaScript ecosystem.
- **Tree-shakeable** — Functional core architecture supports bundler tree shaking.

### vs. cac

[cac](https://github.com/cacjs/cac) (v7) is a zero-dependency, single-file CLI library used by Vite and Vitest.

**Where CLI Forge goes further:**

- **Type inference** — CLI Forge infers types from option definitions. cac returns `{ [k: string]: any }` for parsed options, requiring manual type assertions.
- **Rich option types** — Native `number`, `boolean`, `array`, and `object` types. cac infers types from bracket syntax at runtime with no compile-time safety.
- **Validation** — Choices, conflicts, implications, required options, and custom validators. cac only validates required positional arguments and unknown options.
- **Middleware** — Full middleware pipeline. cac has none.
- **Config files** — Built-in loading with `extends`. cac has none.
- **Documentation generation** — Built-in. cac has none.
- **Interactive shell** — Opt-in REPL. cac has none.
- **Test harness** — `TestHarness` for parsing tests. cac requires manual setup.

**Where cac has the edge:**

- **Zero dependencies, single file** — Extremely lightweight (~3.5KB minified).
- **Dot-notation** — `--env.API_SECRET foo` automatically creates nested objects. CLI Forge uses explicit `type: 'object'` with `properties` for typed nesting.
- **Deno support** — Available via JSR. CLI Forge targets Node.js and Bun.
- **Event system** — Listen for command events (`command:*`) for custom routing logic.
- **Proven at scale** — Powers Vite, Vitest, and other popular tools.

### vs. meow

[meow](https://github.com/sindresorhus/meow) (v14) is a zero-dependency, minimalist CLI helper by Sindre Sorhus.

**Where CLI Forge goes further:**

- **Auto-generated help** — Help text is generated from option definitions. meow requires you to write help text manually as a string.
- **Subcommands** — Full command tree with nested subcommands and handlers. meow has basic command detection that stops parsing at the command name, requiring manual delegation to a new `meow()` call.
- **Rich option types** — Native `object` and `array` types. meow supports `string`, `number`, and `boolean`.
- **Middleware, config files, doc generation, interactive shell, test harness** — All present in CLI Forge, none in meow.
- **Validation** — Choices, conflicts, implications, and custom validators. meow has `choices` and `isRequired`.

**Where meow has the edge:**

- **Zero dependencies** — Completely self-contained.
- **Simplicity** — A single function call returns parsed results. No builder chain, no class hierarchy. Ideal for simple scripts that need a few flags.
- **ESM-native** — ESM-only by design.

### vs. citty

[citty](https://github.com/unjs/citty) (v0.2) is a zero-dependency CLI builder from the [UnJS](https://unjs.io/) ecosystem, built on Node.js's native `util.parseArgs`.

**Where CLI Forge goes further:**

- **Rich option types** — `number`, `array`, and `object` options. citty supports `string`, `boolean`, `enum`, and `positional`.
- **Validation** — Choices, conflicts, implications, and custom validators. citty has `required` and enum constraints.
- **Middleware** — Full middleware pipeline. citty has `setup`/`cleanup` hooks and a plugin system, but no general middleware.
- **Config files** — Built-in loading with `extends`. citty has none.
- **Documentation generation, interactive shell, test harness** — All present in CLI Forge, none in citty.

**Where citty has the edge:**

- **Zero dependencies** — Uses Node.js's native `util.parseArgs` with no external dependencies.
- **Plugin system** — `defineCittyPlugin()` for reusable setup/cleanup hooks. CLI Forge has no plugin mechanism.
- **Lazy async commands** — Subcommands can be dynamically imported for fast startup.
- **Pre-1.0 flexibility** — Still evolving; the API surface is minimal and focused.

### vs. cleye

[cleye](https://github.com/privatenumber/cleye) (v2.3) is a declarative CLI builder with strong TypeScript support and responsive help tables.

**Where CLI Forge goes further:**

- **Middleware** — Full middleware pipeline. cleye has none.
- **Config files** — Built-in loading with `extends`. cleye has none.
- **Built-in types** — Native `number`, `boolean`, `array`, and `object` types via declarative config. cleye uses JavaScript constructor functions (`String`, `Number`, `Boolean`) or custom `(string) => T` functions.
- **Validation** — Choices, conflicts, implications, and custom validators. cleye validates via custom type functions (throw to reject).
- **Documentation generation, interactive shell, test harness** — All present in CLI Forge, none in cleye.
- **Env variable support** — Declarative env var mapping. cleye has none.

**Where cleye has the edge:**

- **Responsive help** — Terminal-width-aware help tables that adapt to the console size, powered by [terminal-columns](https://github.com/privatenumber/terminal-columns).
- **Custom type functions** — Any `(string) => T` function works as an option type, providing flexible parsing and validation in one step.
- **Command type narrowing** — When checking `argv.command` in TypeScript, available flags and parameters are automatically narrowed to the matched command.
- **Strict mode with suggestions** — `strictFlags: true` rejects unknown flags and suggests the closest match within 2 edit distance.

### vs. @effect/cli

[@effect/cli](https://effect.website/docs/cli/) (v0.75) is a CLI library built on the [Effect](https://effect.website/) ecosystem. Commands are Effect computations with typed errors, dependency injection, and structured concurrency.

**Where CLI Forge goes further:**

- **Standalone** — CLI Forge is a self-contained library. @effect/cli requires the Effect runtime (`effect`, `@effect/platform`, `@effect/platform-node` or `@effect/platform-bun`), which is a significant dependency and conceptual commitment.
- **Fluent builder API** — Chainable `.option().command()` pattern. @effect/cli uses separate constructors (`Command.make`, `Options.text`, `Args.text`) composed via `pipe()`.
- **Object options** — Typed nested objects via `type: 'object'`. @effect/cli defines flat options only.
- **Config file inheritance** — Built-in config loading with `extends`. @effect/cli has no config file support.
- **Documentation generation** — Built-in `generate-docs` command. @effect/cli has no equivalent.
- **Lower learning curve** — Familiar API for developers coming from yargs or commander. @effect/cli requires understanding Effect's programming model (layers, services, fibers).

**Where @effect/cli has the edge:**

- **Effect integration** — Commands are Effect values with typed errors, dependency injection via layers, and structured concurrency. If your application already uses Effect, the CLI layer integrates seamlessly.
- **Wizard mode** — Built-in `--wizard` flag walks users through command options interactively.
- **Shell completions** — Built-in `--completions` flag generates bash, zsh, and fish completion scripts. CLI Forge does not yet offer shell completions.
- **Schema validation** — Options can be validated and transformed via Effect's `Schema` module using `Options.withSchema()`.
- **Prompt fallbacks** — Options can fall back to interactive prompts when not provided via `Options.withFallbackPrompt()`.

### vs. gluegun

[Gluegun](https://infinitered.github.io/gluegun/) (v5.2) is a batteries-included toolkit for building CLIs, created by [Infinite Red](https://infinite.red/). It powers Ignite CLI (React Native) and was formerly used by AWS Amplify CLI.

> **Note:** Gluegun is [community-maintained](https://github.com/infinitered/gluegun) and no longer under active development. The maintainers recommend considering alternatives for new projects.

**Where CLI Forge goes further:**

- **Type-safe inference** — CLI Forge infers types from option definitions. Gluegun's toolbox parameters are loosely typed (`{ [key: string]: any }`).
- **Validation** — Choices, conflicts, implications, and custom validators. Gluegun has no built-in argument validation.
- **Middleware** — Full middleware pipeline for argument transformation. Gluegun has extensions that modify the toolbox, but no argument middleware.
- **Programmatic registration** — Commands are defined inline with full type safety. Gluegun requires filesystem-based command files.
- **Config file inheritance** — Built-in config loading with `extends`. Gluegun uses [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) for config discovery but without inheritance.
- **Documentation generation** — Built-in. Gluegun has none.
- **Active maintenance** — CLI Forge is actively developed. Gluegun is in maintenance mode with no new features planned.

**Where gluegun has the edge:**

- **Batteries included** — Gluegun bundles HTTP client ([apisauce](https://github.com/infinitered/apisauce)), filesystem utilities ([fs-jetpack](https://github.com/szwacz/fs-jetpack)), interactive prompts ([enquirer](https://github.com/enquirer/enquirer)), template engine (EJS), spinners, and colored output. CLI Forge focuses solely on argument parsing and command management.
- **Template system** — EJS-based code generation from template files is a first-class feature. Ideal for scaffolding tools and project generators.
- **Plugin system** — Plugins can add commands, extensions, and templates via directory conventions.
- **Prompts** — Built-in interactive prompting. CLI Forge does not include prompts.

### vs. Node.js util.parseArgs

[`util.parseArgs`](https://nodejs.org/api/util.html#utilparseargsconfig) is Node.js's built-in argument parser, available since Node.js v18.3.0 (stable in v20.0.0). It is intentionally minimal — a low-level primitive for simple scripts.

**Where CLI Forge goes further:**

CLI Forge provides everything that `util.parseArgs` deliberately excludes:

- **Rich option types** — `string`, `number`, `boolean`, `array`, and `object`. `util.parseArgs` supports only `'string'` and `'boolean'`.
- **Type inference** — Fully typed parsed output. `util.parseArgs` returns untyped `string | boolean | string[] | boolean[]` values.
- **Subcommands** — Full command tree with nested subcommands, builders, and handlers. `util.parseArgs` has no command concept.
- **Help generation** — Automatic help text from option definitions. `util.parseArgs` generates no output.
- **Validation** — Required, choices, conflicts, implications, custom validators. `util.parseArgs` has no validation beyond strict mode (rejecting unknown flags).
- **Coercion** — Automatic type coercion (strings to numbers, etc.). `util.parseArgs` performs no coercion.
- **Middleware, config files, env variables, doc generation, interactive shell, test harness** — All present in CLI Forge, none in `util.parseArgs`.

**Where util.parseArgs has the edge:**

- **Zero dependencies, built-in** — Part of Node.js core. No installation needed.
- **Minimal API surface** — A single function call with a simple config object. No abstractions to learn.
- **Tokens API** — Returns detailed parse tokens for custom post-processing, useful when building your own parser on top.
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
- **@effect/cli** — [Documentation](https://effect.website/docs/cli/) · [GitHub](https://github.com/Effect-TS/effect/tree/main/packages/cli) · [npm](https://www.npmjs.com/package/@effect/cli)
- **gluegun** — [Documentation](https://infinitered.github.io/gluegun/) · [GitHub](https://github.com/infinitered/gluegun) · [npm](https://www.npmjs.com/package/gluegun)
- **Node.js util.parseArgs** — [Documentation](https://nodejs.org/api/util.html#utilparseargsconfig) · [Original proposal](https://github.com/pkgjs/parseargs)
