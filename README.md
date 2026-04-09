<!-- BEGIN LOGO -->

![CLI Forge Logo](./docs-site/static/img/logo.svg)

<!-- END LOGO -->

# CLI Forge

**A type-safe CLI builder for Node.js with first-class TypeScript support.**

✨ Proudly built with [Nx](https://nx.dev) ✨.

CLI Forge is a modern framework for building command-line interfaces in Node.js, designed with TypeScript developers in mind. While inspired by established tools like [yargs](https://yargs.js.org/), [commander](https://www.npmjs.com/package/commander), and [vorpal](https://vorpal.js.org/), CLI Forge prioritizes type safety and developer experience above all else.

## Why CLI Forge?

**Type Safety First** — Every option and argument you define is fully typed throughout your application. The library uses TypeScript's type inference to provide accurate intellisense and catch errors at compile time, not runtime.

**Built for Modern Node.js** — Designed from the ground up for TypeScript projects with ESM support, middleware composition, and a clean fluent API that feels natural to use.

**Comprehensive Tooling** — Generate documentation automatically from your CLI definition, test your commands with the built-in test harness, and optionally enable an interactive shell for improved user experience.

## Runtime compatibility

CLI Forge is primarily developed against modern Node.js, and is also compatible with Bun for common CLI execution workflows (for example using `bun run ./bin/my-cli.ts` during development and `bun` for running built output).

## Key Features

- **Full type inference** for parsed arguments based on your option definitions
- **Flexible option types**: strings, numbers, booleans, arrays, nested objects, and [`oneOf` unions](https://craigory.dev/cli-forge/examples/one-of-option)
- **Command hierarchy** with unlimited nesting and inherited options
- **Composable builders** with [`chain()` and `makeComposableBuilder()`](https://craigory.dev/cli-forge/examples/composable-options) for reusable option groups
- **Middleware system** for transforming arguments before handler execution, including [Zod schema validation](https://craigory.dev/cli-forge/docs/guides/middleware)
- **Environment variable support** with [per-option or global env mapping](https://craigory.dev/cli-forge/examples/env-options)
- **Interactive shell** (opt-in) for easier exploration of complex command trees
- **Shell completions** for bash, zsh, fish, and PowerShell
- **Automatic documentation generation** to markdown or JSON formats
- **Configuration file support** with inheritance via `extends`
- **Built-in test harness** for unit testing your CLI commands
- **Comprehensive validation** with custom validators, choices, and cross-option constraints
- **Browser support** via [browser-safe stubs](https://craigory.dev/cli-forge/docs/guides/browser-usage)

## Quick Start

To create a new CLI, simply run:

```bash
npx cli-forge init my-cli
```

## Manual Installation

To install the full command library, run:

```bash
npm install cli-forge
```

Then, create a new file (e.g. `my-cli.ts`), and add the following code:

```js
import { cli } from 'cli-forge';

cli('my-cli')
  .command('hello', {
    description: 'Say hello to the world',
    builder: (args) =>
      args.option('name', {
        type: 'string',
        description: 'The name to say hello to',
      }),
    handler: (args) => {
      console.log(`Hello, ${args.name}!`);
    },
  })
  .forge();
```

## Usage

See the [examples gallery](https://craigory.dev/cli-forge/examples) and the [quick-start guide](https://craigory.dev/cli-forge/docs/guides/quick-start) for more.

## Subshells

`cli-forge` ships with a simplistic subshell to make interactively running commands feel a bit nicer. The subshell is entirely opt-in, and can be enabled by calling `.enableInteractiveShell()` on your top level command.

If enabled, running any command that has subcommands without specifying a subcommand will drop you into the subshell. This allows you to run subcommands without having to retype the top level command.

See the [subshell example](https://craigory.dev/cli-forge/examples/interactive-subshell) for more information and a concrete example.

More improvements to the subshell are planned in the future.

## Generating Documentation

`cli-forge` can generate documentation for your CLI based on the commands and options that you've defined. To generate documentation, run:

```bash
npx cli-forge generate-docs my-cli.{js,ts}
```

By default, this will generate markdown documentation in a folder called `docs`. You can also pass `--format json` to generate a JSON object representation of your CLI instead. This is useful as a middle step if you want to generate documentation in a different format, or just a different style of markdown.

## How It Compares

CLI Forge is compared in detail with **yargs**, **commander**, **oclif**, **clipanion**, **cac**, **meow**, **citty**, **cleye**, **@effect/cli**, **gluegun**, and Node.js `util.parseArgs` in the [comparison guide](https://craigory.dev/cli-forge/docs/guides/comparison).

The short version: CLI Forge prioritizes **full type inference** (every `.option()` call builds a TypeScript type), **composability** (middleware, composable builders, config file inheritance), and **integrated tooling** (doc generation, test harness, interactive shell) — features that most alternatives only partially cover or omit entirely.

## Contributing

Contributions are welcome! Please see the [contributing guide](CONTRIBUTING.md) for more information.
