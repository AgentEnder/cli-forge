# CLI Forge

✨ Proudly built with [Nx](https://nx.dev) ✨.

CLI Forge is a library / framework for building command line interfaces (CLI) in Node.js, inspired by projects like [yargs](https://yargs.js.org/).

## Features

- Full option parsing, with support for flags and positional arguments.
- TypeScript first, with full type support for parsed arguments.
- Command and subcommand support.
- Documentation generation.

## Installation

To install the full command library, run:

```bash
npm install cli-forge
```

Alternatively, if you just want to parse arguments, you can install the parser library:

```bash
npm install @cli-forge/parser
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
