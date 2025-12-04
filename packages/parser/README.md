# @cli-forge/parser

**A type-safe argument parser for Node.js with full TypeScript inference.**

This is the low-level parsing engine that powers [cli-forge](https://www.npmjs.com/package/cli-forge). Use this package directly if you need fine-grained control over argument parsing without the higher-level command management features.

## Installation

```bash
npm install @cli-forge/parser
```

## Quick Start

```typescript
import { parser } from '@cli-forge/parser';

const args = parser()
  .option('name', { type: 'string', required: true })
  .option('port', { type: 'number', default: 3000 })
  .option('verbose', { type: 'boolean', alias: ['v'] })
  .parse(['--name', 'my-app', '--port', '8080', '-v']);

// args is fully typed:
// { name: string; port: number; verbose: boolean }
console.log(args.name);    // 'my-app'
console.log(args.port);    // 8080
console.log(args.verbose); // true
```

## Features

- **Full TypeScript inference** - Types accumulate as you chain `.option()` calls
- **Multiple option types** - `string`, `number`, `boolean`, `array`, `object`
- **Value sources** - CLI args, environment variables, config files, defaults
- **Validation** - `choices`, `validate`, `required`, `conflicts`, `implies`
- **Config file support** - JSON/YAML with inheritance via `extends`
- **Coercion** - Transform values during parsing

## Option Types

### String

```typescript
parser().option('name', {
  type: 'string',
  description: 'User name',
  default: 'anonymous',
});
```

### Number

```typescript
parser().option('port', {
  type: 'number',
  description: 'Port number',
  default: 3000,
});
```

### Boolean

```typescript
parser().option('verbose', {
  type: 'boolean',
  alias: ['v'],
  description: 'Enable verbose output',
});
// Supports: --verbose, --verbose true, --no-verbose
```

### Array

```typescript
parser().option('files', {
  type: 'array',
  items: 'string',
  description: 'Input files',
});
// Supports: --files a b c, --files a,b,c, --files a --files b
```

### Object

```typescript
parser().option('config', {
  type: 'object',
  properties: {
    host: { type: 'string', default: 'localhost' },
    port: { type: 'number', required: true },
    ssl: { type: 'boolean' },
  },
});
// Supports: --config.host example.com --config.port 443 --config.ssl
```

## Positional Arguments

```typescript
parser()
  .positional('input', { type: 'string', required: true })
  .positional('output', { type: 'string' })
  .parse(['input.txt', 'output.txt']);
```

## Validation

### Choices

```typescript
parser().option('level', {
  type: 'string',
  choices: ['debug', 'info', 'warn', 'error'],
});
```

### Custom Validation

```typescript
parser().option('port', {
  type: 'number',
  validate: (value) => {
    if (value < 1 || value > 65535) {
      throw new Error('Port must be between 1 and 65535');
    }
    return true;
  },
});
```

### Conflicts and Implies

```typescript
parser()
  .option('quiet', { type: 'boolean' })
  .option('verbose', {
    type: 'boolean',
    conflicts: ['quiet'],
  })
  .option('output', {
    type: 'string',
    implies: { format: 'json' },
  });
```

## Environment Variables

```typescript
parser().option('apiKey', {
  type: 'string',
  env: 'API_KEY',
});
// Will read from process.env.API_KEY if --apiKey not provided
```

## Configuration Files

```typescript
parser()
  .configFile('myapp.config.json')
  .option('port', { type: 'number' })
  .parse([]);
```

Config files support inheritance:

```json
{
  "extends": "./base-config.json",
  "port": 8080
}
```

## Coercion

Transform values during parsing:

```typescript
parser().option('date', {
  type: 'string',
  coerce: (value) => new Date(value),
});
```

## Type Inference

The parser tracks types as options are added:

```typescript
const p = parser()
  .option('name', { type: 'string' })        // { name?: string }
  .option('port', { type: 'number' })        // { name?: string; port?: number }
  .option('required', { type: 'string', required: true }); // { name?: string; port?: number; required: string }
```

## Related Packages

- [`cli-forge`](https://www.npmjs.com/package/cli-forge) - High-level CLI builder with commands, middleware, and documentation generation

## Documentation

Full documentation available at: https://craigory.dev/cli-forge/

## License

ISC
