import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Getting Started with CLI Forge

As CLI Forge is focused on first class TypeScript support, this guide will assume you are using TypeScript. If you are not using TypeScript, you can still use CLI Forge, and can pass `--format js` to the `cli-forge init` command when getting started. The runtime functionality of your CLI will not be affected by this choice, but you will lose out on the type safety and intellisense that TypeScript provides.

## Manual Installation

If adding a cli to an existing project, you may wish to install CLI Forge with npm or yarn:

```bash npm2yarn
npm install @cli/forge
```

## Automatic Installation (cli-forge init)

To get started with a new CLI project, run the following command:

```bash
npx cli-forge init my-cli
```

This will create a new directory called `my-cli` with the following structure:

```plaintext
my-cli/
├── bin/
│   └── my-cli.ts
├── scripts/
│   └── build.ts
├── package.json
├── tsconfig.json
└── README.md
```

Lets take a closer look at each of these files:

- The `bin/my-cli.ts` acts as the entry point for your CLI. You can start adding commands and options to it right away.
- The `scripts/build.ts` file is a helper script that will compile your CLI using typescript. You can run this script with `npx tsx scripts/build.ts`, or via the npm script we added via `npm run build`.

  This script invokes `tsc`, and copies the `package.json` file to the `dist` directory. This is done to ensure that the `package.json` file is included in the final package when publishing to npm.

- The `package.json` file contains the metadata for your CLI. You can add dependencies, scripts, and other metadata to this file.

  Let's take a closer look at each of the important sections in the `package.json` file:

  - `name`: The name of your CLI. This should be a unique name on npm.
  - `bin`: Describes the CLI commands made available by your package. By default, this will be set to `{"my-cli": "./bin/my-cli"}`. This enables running your CLI via `npx my-cli` or `my-cli` inside of an npm script. For `npx` to work directly, the `bin` entry should match the name of the package. If it doesn't, you can use `npx -p {package-name} {command}` to run the CLI.
  - `dependencies`: A list of dependencies that your CLI depends on. This list will be installed when someone installs your CLI via npm, or when they use `npx` to run your CLI. As such, its a good idea to keep this list as small as possible. `cli-forge` is the only direct dependency that is required when using CLI Forge.
  - `devDependencies`: These are dependencies that are only needed during development. `markdown-factory` will be added as a dev dependency to generate documentation for your CLI. It can be removed if you don't wish to generate documentation. By default when using `typescript` this list will contain the following packages:
    - `typescript`: The typescript compiler.
    - `tsx`: A typescript loader that allows you to import typescript files without needing to compile them first.
    - `@tsconfig/node-lts`: A typescript configuration that is optimized for node.js development.
  - `tsconfig.json`: The typescript configuration file for your CLI. This file is used by the typescript compiler to determine how to compile your typescript files. By default, this file will extend the `@tsconfig/node-lts` configuration, which is optimized for node.js development, and setup building to a `dist` directory.

## Writing Your First Command

Let's examine the `bin/my-cli.ts` file that was generated for you:

```typescript
import { cli } from 'cli-forge';

const myCLI = cli('my-cli').command('hello', {
  builder: (args) => args.positional('name', { type: 'string' }),
  handler: (args) => {
    console.log('hello', args.name);
  },
});

export default myCLI;

if (require.main === module) {
  myCLI.forge();
}
```

This file is doing a few interesting things:

- The `cli` function bootstraps a new CLI instance. This instance represents the root command of your CLI.
- The `command` function adds a new command to the CLI. This function takes a name and an options object. The options object contains a `builder` function that defines the arguments and options for the command, and a `handler` function that is called when the command is executed.
- The `builder` function is used to define the arguments and options for the command. In this case, we are defining a single positional argument called `name` that is of type `string`.
- The `handler` function is called when the command is executed. In this case, we are logging `hello` followed by the `name` argument to the console.
- The `export default myCLI` line exports the CLI instance so that it can be used by the CLI Forge CLI to generate documentation.
- The `if (require.main === module)` block ensures that the CLI is only executed when run directly via `npx my-cli` or `my-cli`. This is done to prevent the CLI from running when the file is imported as a module (e.g. when generating documentation).

We can customize this to add a new command called `goodbye` that takes an optional `name` argument:

```typescript
import { cli } from 'cli-forge';

const myCLI = cli('my-cli')
  .command('hello', {
    builder: (args) => args.positional('name', { type: 'string' }),
    handler: (args) => {
      console.log('hello', args.name);
    },
  })
  .command('goodbye', {
    builder: (args) => args.positional('name', { type: 'string', default: 'world' }),
    handler: (args) => {
      console.log('goodbye', args.name);
    },
  });

export default myCLI;

if (require.main === module) {
  myCLI.forge();
}
```

## Invoking Your CLI

To run your CLI without building it, you can use [`tsx`](https://npmjs.com/tsx). If you'd rather build your CLI first, you can run `npm run build` to compile your typescript files to javascript.

<Tabs>
    <TabItem value="TypeScript + TSX">
    ```bash
    npx tsx bin/my-cli.ts hello --name world
    ```
    </TabItem>
    <TabItem value="TypeScript + Build">
    ```bash
    npm run build
    npx bin/my-cli hello --name world
    ```
    </TabItem>
</Tabs>

> **Note:** Future commands will only show the `tsx` variant of the CLI invocation. If you wish to see the `npm run build` variant, you can refer back to this section.

Let's try running the cli without providing a command:

```bash
npx tsx bin/my-cli.ts
```

Woah! The CLI threw an error:

```plaintext
Error: my-cli requires a command
    at InternalCLI.runCommand (/Users/agentender/repos/cli-forge/tmp/e2e/default/packages/cli-forge/src/lib/internal-cli.ts:314:15)
    at <anonymous> (/Users/agentender/repos/cli-forge/tmp/e2e/default/packages/cli-forge/src/lib/internal-cli.ts:492:18)
    at InternalCLI.withErrorHandlers (/Users/agentender/repos/cli-forge/tmp/e2e/default/packages/cli-forge/src/lib/internal-cli.ts:389:20)
    at InternalCLI.forge (/Users/agentender/repos/cli-forge/tmp/e2e/default/packages/cli-forge/src/lib/internal-cli.ts:451:10)
    at <anonymous> (/Users/agentender/repos/cli-forge/tmp/e2e/default/my-cli/bin/my-cli.ts:14:9)
    at Object.<anonymous> (/Users/agentender/repos/cli-forge/tmp/e2e/default/my-cli/bin/my-cli.ts:15:1)
    at Module._compile (node:internal/modules/cjs/loader:1467:14)
    at Object.transformer (/Users/agentender/repos/cli-forge/tmp/e2e/default/my-cli/node_modules/tsx/dist/register-C1urN2EO.cjs:2:1122)
    at Module.load (node:internal/modules/cjs/loader:1282:32)
    at Module._load (node:internal/modules/cjs/loader:1098:12)
Usage: my-cli

Commands:
  hello

Options:
  --help    - Show help for the current command
  --version - Show the version number for the CLI

Run `my-cli [command] --help` for more information on a command
```

Disecting the error message, it has two parts:

- The first part is the error message itself: `my-cli requires a command`.
- The second part is the help message that is displayed when the CLI errors.

The help message shows the available commands and options for the CLI. In this case, the CLI has a single command called `hello`, and two options: `--help` and `--version`.

Our CLI requires a command to be provided because all of the following are true:

- The `cli` instance was created without options for the root command.
- No root commamnd was added via `.command($0, ...)`
- The `.enableInteractiveShell` method was not called on the `cli` instance.

Note, registering the root command can be done by either providing options to the `cli` function or by adding a command via `.command($0, ...)`. The result is equivalent.

## The Interactive Shell

The interactive shell is a feature of CLI Forge that allows you to run your CLI in an interactive mode. This mode is useful for users which will run your CLI multiple times with different arguments, or for users who are not familiar with the CLI and want to explore the available commands and options.

To enable the interactive shell, you can call the `.enableInteractiveShell` method on the `cli` instance:

```typescript
import { cli } from 'cli-forge';

const myCLI = cli('my-cli')
  .enableInteractiveShell()
  .command('hello', {
    builder: (args) => args.positional('name', { type: 'string' }),
    handler: (args) => {
      console.log('hello', args.name);
    },
  })
  .command('goodbye', {
    builder: (args) => args.positional('name', { type: 'string', default: 'world' }),
    handler: (args) => {
      console.log('goodbye', args.name);
    },
  });

export default myCLI;

if (require.main === module) {
  myCLI.forge();
}
```

Now, when you run the CLI without providing a command, the interactive shell will be started:

```bash
npx tsx bin/my-cli.ts

my-cli >
```

From here, you can type `help` to see the available commands and options, or type `exit` to exit the interactive shell.

```bash
my-cli > help

Usage: my-cli

Commands:
  hello
  goodbye

Options:
  --help    - Show help for the current command
  --version - Show the version number for the CLI
```

You can run the `hello` and `goodbye` commands as you would normally:

```bash

my-cli > hello world
hello world

> my-cli > goodbye earth
goodbye earth
```

Note that the interactive shell is completely optional, and may not be suitable for all CLIs. If you don't want to use the interactive shell, you can remove the `.enableInteractiveShell` call from your CLI.

## Adding Options

Options are additional flags that can be passed to a command. They can be either boolean flags (e.g. `--verbose`), or flags that take a value (e.g. `--output-file file.txt`). CLI Forge supports several types of options out of the box, including:

- `string`: A string value. (e.g. `--name john`)
- `number`: A number value. (e.g. `--count 42`)
- `boolean`: A boolean value. (e.g. `--verbose`, `--verbose true`, `--no-verbose`)
- `array`: An array of values.

  Arrays accept either numbers or strings for their items. They can be passed in 3 ways:

  - `--array 1 2 3`
  - `--array 1,2,3`
  - `--array 1 --array 2 --array 3`

- `object`: An object value.

  Objects are the most complex type of option, and should be used sparingly. They are passed in via dot-notation:

  - `--object.key value`
  - `--object.key1 value1 --object.key2 value2`

  Nested objects are supported, and would look like this:

  - `--object.key1.key2 value`

Let's add a few options to the `hello` command:

```typescript
const myCLI = cli('my-cli').command('hello', {
  builder: (args) =>
    args
      .positional('people', { type: 'array', items: 'string' })
      .option('newline', {
        type: 'boolean',
        description: 'Print greetings on separate lines',
      })
      .option('repeat', {
        type: 'number',
        description: 'Repeat the name n times',
        default: 1,
      }),
  handler: (args) => {
    const parts = ['hello'];
    const names = args.people.join(args.newline ? '\n' : ', ');
    console.log('hello', names.repeat(args.repeat));
  },
});
```

In this example, we added two options to the `hello` command:

- The `newline` option is a boolean flag that will print each name on a separate line if provided.
- The `repeat` option is a number flag that will repeat the name n times if provided.

We also swapped the `name` positional argument for a `people` array argument. This allows us to greet multiple people at once.

The new CLI can be invoked like this:

```bash
npx tsx bin/my-cli.ts hello --people john jane --newline --repeat 3
```

## Adding Subcommands

Subcommands are commands that are nested under another command. They allow you to group related commands together, and can be used to create complex CLI structures.

We've already been looking at subcommands as the `hello` and `goodbye` commands are subcommands of the root command, but they feel a bit different so we can look at a slightly more complex example.

Note options that are registered are valid for the command they are registered on, as well as any subcommands that are added to the command. Lets look at an example:

```typescript
import { cli } from 'cli-forge';

cli('my-cli')
  .command('auth', {
    builder: (args) =>
      args
        .option('host', { type: 'string', default: 'localhost' })
        .command('login', {
          builder: (args) => args.option('username', { type: 'string' }).option('password', { type: 'string' }),
          handler: (args) => {
            console.log('login', args.username, args.password);
          },
        })
        .command('logout', {
          handler: () => {
            console.log('logout');
          },
        }),
  })
  .forge();
```

In this example, we added an `auth` command with two subcommands: `login` and `logout`. The `login` command takes two extra options: `username` and `password`, while the `logout` command takes no additional options. The `host` option is registered on the `auth` command, and is available to all subcommands.

The new CLI can be invoked like this:

```bash
npx tsx bin/my-cli.ts auth login --username john --password secret
```

## Testing Your CLI

### Manual Testing

We've been testing our CLI manually by running it with `npx tsx bin/my-cli.ts`. This is a good way to test your CLI as you are developing it, but it can be tedious to run the CLI manually every time you make a change to validate that it works as expected.

### Automated Testing (Unit Tests)

CLI Forge is no different from any other node compatible library, and can be tested using any testing framework you like. The examples within the docs use node's built-in `assert` and `test` modules, as they are available without any additional dependencies.

CLI Forge provides a `TestHarness` class that can be used to test how your CLI commands behave. It is recommended that to use this class to test how your arguments are parsed, but to extract the logic of your handlers into separate functions that can be tested independently.

Here is an example of how you can test the `hello` command from the previous example:

```typescript
import { TestHarness } from 'cli-forge';

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import { myCLI } from './my-cli';

const harness = new TestHarness(myCLI);

describe('hello', () => {
  it('should greet people', async () => {
    const { args, commandChain } = await harness.parse(['hello', '--people', 'john', 'jane', '--newline']);
    assert.deepStrictEqual(args.people, ['john', 'jane']);
    assert.deepStrictEqual(args.newline, ['hello']);
    assert.deepStrictEqual(commandChain, ['hello']);
  });

  it('should greet people on separate lines', async () => {
    const result = await harness.run('hello john jane --newline');
    assert.strictEqual(result.stdout, 'hello john\nhello jane\n');
  });

  it('should repeat the greeting', async () => {
    const result = await harness.run('hello john --repeat 3');
    assert.strictEqual(result.stdout, 'hello john, john, john\n');
  });
});
```
