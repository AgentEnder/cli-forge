# cli-forge

**A type-safe CLI builder for Node.js with first-class TypeScript support.**

CLI Forge is a modern framework for building command-line interfaces in Node.js, designed with TypeScript developers in mind. It provides full type inference for parsed arguments, automatic help generation, middleware support, and built-in documentation tooling.

## Installation

```bash
npm install cli-forge
```

## Quick Start

Create a new CLI project:

```bash
npx cli-forge init my-cli
```

Or add to an existing project:

```typescript
import { cli } from 'cli-forge';

cli('my-app')
  .command('hello', {
    description: 'Say hello to someone',
    builder: (args) =>
      args.option('name', {
        type: 'string',
        description: 'Name to greet',
        default: 'World',
      }),
    handler: (args) => {
      console.log(`Hello, ${args.name}!`);
    },
  })
  .forge();
```

Run it:

```bash
node my-app.js hello --name "Developer"
# Output: Hello, Developer!
```

## Key Features

- **Full type inference** for parsed arguments based on your option definitions
- **Flexible option types**: strings, numbers, booleans, arrays, and nested objects
- **Command hierarchy** with unlimited nesting and inherited options
- **Middleware system** for transforming arguments before handler execution
- **Interactive shell** (opt-in) for easier exploration of complex command trees
- **Automatic documentation generation** to markdown or JSON formats
- **Configuration file support** with inheritance via `extends`
- **Built-in test harness** for unit testing your CLI commands
- **Rich validation** with custom validators, choices, and cross-option constraints

## Option Types

```typescript
cli('app')
  .option('name', { type: 'string' })
  .option('port', { type: 'number', default: 3000 })
  .option('verbose', { type: 'boolean', alias: ['v'] })
  .option('tags', { type: 'array', items: 'string' })
  .option('config', {
    type: 'object',
    properties: {
      host: { type: 'string' },
      timeout: { type: 'number' },
    },
  });
```

## Subcommands

```typescript
cli('git')
  .command('remote', {
    builder: (args) =>
      args
        .command('add', {
          builder: (a) =>
            a
              .positional('name', { type: 'string' })
              .positional('url', { type: 'string' }),
          handler: (args) => {
            console.log(`Adding remote ${args.name}: ${args.url}`);
          },
        })
        .command('remove', {
          builder: (a) => a.positional('name', { type: 'string' }),
          handler: (args) => {
            console.log(`Removing remote ${args.name}`);
          },
        }),
  })
  .forge();
```

## Middleware

Transform arguments before they reach your handler:

```typescript
cli('app')
  .middleware((args) => ({
    ...args,
    timestamp: Date.now(),
  }))
  .command('run', {
    handler: (args) => {
      console.log(`Started at: ${args.timestamp}`);
    },
  });
```

## Zod Validation

Optional Zod integration for schema validation:

```typescript
import { cli } from 'cli-forge';
import { zodMiddleware } from 'cli-forge/middleware/zod';
import { z } from 'zod';

cli('app')
  .option('port', { type: 'number' })
  .middleware(
    zodMiddleware(
      z.object({
        port: z.number().min(1).max(65535),
      })
    )
  )
  .forge();
```

## Interactive Shell

Enable an interactive REPL for your CLI:

```typescript
cli('my-app')
  .enableInteractiveShell()
  .command('hello', { /* ... */ })
  .forge();
```

## Testing

Use the built-in test harness:

```typescript
import { TestHarness } from 'cli-forge';
import myCLI from './my-cli';

const harness = new TestHarness(myCLI);

const { args, commandChain } = await harness.parse(['hello', '--name', 'World']);
assert.strictEqual(args.name, 'World');
assert.deepStrictEqual(commandChain, ['hello']);
```

## Documentation Generation

Generate markdown or JSON documentation:

```bash
npx cli-forge generate-docs ./my-cli.ts
npx cli-forge generate-docs ./my-cli.ts --format json
```

## Related Packages

- [`@cli-forge/parser`](https://www.npmjs.com/package/@cli-forge/parser) - Low-level argument parser with type inference

## Documentation

Full documentation available at: https://craigory.dev/cli-forge/

## License

ISC
