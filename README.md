<!-- BEGIN LOGO -->

![CLI Forge Logo](./docs-site/static/img/logo.svg)

<!-- END LOGO -->

# CLI Forge

✨ Proudly built with [Nx](https://nx.dev) ✨.

CLI Forge is a library / framework for building command line interfaces (CLI) in Node.js, inspired by projects like [yargs](https://yargs.js.org/), [commander](https://www.npmjs.com/package/commander), and [vorpal](https://vorpal.js.org/).

## Features

- Full option parsing, with support for flags and positional arguments.
- TypeScript first, with full type support for parsed arguments.
- Command and subcommand support.
- Subshell support to make running complex subcommands easier.
- `--help` and documentation generation.

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

See docs for more examples: [https://craigory.dev/cli-forge/examples](https://craigory.dev/cli-forge/examples)

### Basic Example

To create a new CLI, save the below code to a file (e.g. `my-cli.js`), and run it with Node.js:

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

Then run the CLI with:

```bash
node my-cli.js hello --name "World"
```

Then, to generate documentation for the CLI, run:

```bash
npx cli-forge generate-docs my-cli.js
```

This should generate a folder called `docs` containing markdown documentation for the CLI. Alternatively, you can pass `--format json` to generate JSON documentation to further process.

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

## Why not yargs, commander, or vorpal?

The main goal of `cli-forge` is to provide a simple, type-safe, and easy to use CLI framework for building command line interfaces in Node.js. A strong commitment to TypeScript and type safety is a core part of the project, and the library is designed to be as simple and easy to use as possible. Despite this, you'll note several places that there are type casts or type assertions in the codebase. This is due to limitations in TypeScript's type system, and the library is designed with **user** type safety taking priority over type safety within the library itself. We still try to avoid type casts where possible, but they are sometimes necessary to make the library easier to use.

You'll note that the API is quite similar to both yargs and commander, and that's by design. I love both of those libraries, and just wanted something a bit more friendly. CLI Forge removes some of the features that seem less necessary, and adds a few features that I've found useful in my own projects. The most notable missing features are:

- Parsing positional options from the usage string.
- Parsing unknown options.
- File system based routing / command loading.

In order to keep the library's focus on typescript, parsing options out of the usage string would not be feasible. File system based routing is a cool feature, but I've found it to be a bit of a pain to work with in practice. I may add it in the future, but it's not a priority. Parsing unknown options makes it a lot faster to get started as you don't actually have to describe each option type that you're expecting, but that also eliminates the type safety. There are valid use cases for capturing options that you don't know about, but I've found that in practice, you usually wouldn't want to parse them as you will be passing them to another command or process and not want to modify them.

Vorpal can do **a lot**. There are some cool features there that may be considered for the future, and the subshell is a nod to vorpal's interactive shell. That being said, vorpal's last release was 7 years ago, and a lot has changed since then. Its still a great tool and a great project though, so I'd still recommend checking it out for some inspiration.

## Contributing

Contributions are welcome! Please see the [contributing guide](CONTRIBUTING.md) for more information.
