# CLI-Forge Architecture

A type-safe CLI builder library for Node.js with automatic help generation, middleware support, and comprehensive documentation tooling.

## Repository Structure

```
packages/
├── cli-forge/          # High-level CLI builder (user-facing API)
├── parser/             # Low-level argument parser (type inference engine)
examples/               # Runnable examples with YAML front-matter
e2e/                    # End-to-end tests (runs examples)
docs-site/              # Docusaurus documentation site
type-tests/             # TypeScript type inference validation
tools/scripts/          # Build and collection utilities
```

---

## CLI Layer → Parser Layer

The architecture follows a **layered design** where `cli-forge` wraps `@cli-forge/parser`:

```
┌─────────────────────────────────────────────────────────────┐
│                       cli-forge                             │
│  - Command tree management                                  │
│  - Handler execution with middleware                        │
│  - Help formatting & interactive shell                      │
│  - Configuration providers                                  │
│  - TestHarness for testing                                  │
├─────────────────────────────────────────────────────────────┤
│                     @cli-forge/parser                       │
│  - Type-safe option registration                            │
│  - Argument tokenization & parsing                          │
│  - Value coercion & validation                              │
│  - Environment variable population                          │
│  - Config file loading with extends                         │
└─────────────────────────────────────────────────────────────┘
```

### Parser Layer (`packages/parser`)

The parser is the **type inference engine**. It provides:

- **ArgvParser<TArgs>** - Core class that accumulates types as options are added
- **Option types** - `string`, `number`, `boolean`, `array`, `object` with full TypeScript inference
- **Validation** - `choices`, `validate`, `required`, `conflicts`, `implies`
- **Value sources** - CLI args, environment variables, config files, defaults

Key files:
- `lib/parser.ts` - Main `ArgvParser` class
- `lib/option-types/` - Type definitions for each option kind
- `lib/parsers/` - Runtime value parsers (string, number, boolean, array, object)
- `lib/config-files/` - Configuration file loading with inheritance

**Type inference flow:**
```typescript
parser()                                    // ArgvParser<ParsedArgs>
  .option('name', { type: 'string' })       // ArgvParser<{ name: string }>
  .option('port', { type: 'number' })       // ArgvParser<{ name: string; port: number }>
  .option('config', {
    type: 'object',
    properties: {
      host: { type: 'string' },
      db: { type: 'string', required: true }
    }
  })  // ArgvParser<{ name: string; port: number; config: { host?: string; db: string } }>
```

### CLI Layer (`packages/cli-forge`)

The CLI layer adds **command management** and **execution semantics**:

- **InternalCLI** - Wraps `ArgvParser`, adds command tree
- **Command registration** - Subcommands with builders and handlers
- **Middleware** - Transform args before handler execution
- **Help formatting** - Automatic help text generation
- **Interactive shell** - REPL for command exploration

Key files:
- `lib/public-api.ts` - Main `CLI<TArgs>` interface
- `lib/internal-cli.ts` - `InternalCLI` implementation
- `lib/format-help.ts` - Help text formatting
- `lib/middleware/zod.ts` - Zod validation middleware

**Usage pattern:**
```typescript
import { cli } from 'cli-forge';

const app = cli('my-app')
  .option('verbose', { type: 'boolean', alias: ['v'] })
  .command('serve', {
    builder: (cmd) => cmd
      .option('port', { type: 'number', default: 3000 }),
    handler: (args) => {
      // args.verbose, args.port fully typed
    }
  });

await app.forge();
```

### Lazy Subcommand Building

Subcommands are built **on-demand** via the parser's `unmatchedParser` callback:

1. User runs: `my-app serve --port 8080`
2. Parser encounters `serve` as unmatched argument
3. CLI looks up `serve` command, calls its builder
4. Builder registers `--port` option
5. Parser continues with augmented options

This enables deep command hierarchies without upfront registration cost.

---

## Examples System

Examples serve **three purposes**: documentation, e2e tests, and playground.

### Example Structure

**Single-file examples** (`examples/*.ts`):
```typescript
// ---
// id: basic-cli
// title: Basic CLI
// description: |
//   A simple CLI demonstrating basic options.
// commands:
//   - command: '{filename} --name World'
//     assertions:
//       - contains: 'Hello, World!'
// ---

import { cli } from 'cli-forge';

cli('hello')
  .option('name', { type: 'string', default: 'World' })
  .forge();
```

**Multi-file examples** (`examples/*/meta.yml` + files):
```yaml
id: configuration-files
title: Configuration Files
description: Loading config from JSON files
entryPoint: ./cli.ts
fileMap:
  './cli.ts': 'cli.ts'
  './config.json': 'config.json'
commands:
  - command: '{filename}'
```

### Documentation Generation

The `docs-site/src/plugins/examples-plugin.ts` Docusaurus plugin:

1. Collects examples using `tools/scripts/collect-examples.ts`
2. Parses YAML front-matter from each example
3. Generates markdown files in `docs-site/docs/examples/`
4. Creates index page listing all examples
5. Adds playground links with LZ-compressed code

**Build flow:**
```
nx build docs-site
  → Runs cli-forge/parser builds first
  → ExamplesDocsPlugin runs
  → Generates /docs/examples/*.md
  → Docusaurus builds HTML
```

### E2E Testing

The `e2e/run-examples.ts` runner:

1. Collects all examples with their commands
2. For each command:
   - Replaces `{filename}` with actual path
   - Executes via `tsx`
   - Validates output against assertions
3. Also type-checks all examples with TypeScript

**Run e2e tests:**
```bash
nx run e2e:e2e:examples
```

### Adding a New Example

1. Create `examples/my-example.ts` with YAML front-matter
2. Define `id`, `title`, `description`, `commands`
3. Add assertions for output validation
4. Run `nx build docs-site` to generate docs
5. E2E tests will automatically include your example

---

## Type-Tests System

The `type-tests/` package validates TypeScript type inference, catching subtle bugs that unit tests cannot detect.

### When to Use Type Tests

- Complex generic type inference (object options with properties)
- Type widening issues (`{ foo: string }` becoming `Record<string, any>`)
- Callback parameter types (coerce/validate functions)
- Required vs optional property resolution
- Nested object property inference

### Writing Type Tests

**Static assertions** (`type-tests/assertions/`):
```typescript
import { AssertEqual, AssertProperty, IsTrue } from './helpers';

// Verify exact type
type Config = { host: string; port: number };
const test1: IsTrue<AssertEqual<Config, { host: string; port: number }>> = true;

// Verify specific property
const test2: IsTrue<AssertProperty<Config, 'host', string>> = true;
```

**Runtime validation** (`type-tests/src/lib/*.spec.ts`):
```typescript
import { createTestProgram, findNodeBySelector } from './lib';

it('should infer object properties correctly', () => {
  const code = `
    parser().option('config', {
      type: 'object',
      properties: { host: { type: 'string' } },
      validate: (config) => config.host !== undefined
    });
  `;

  const { typeChecker, sourceFile } = createTestProgram(code);
  const param = findNodeBySelector(
    sourceFile,
    'PropertyAssignment[name.text="validate"] ArrowFunction > Parameter'
  );

  const paramType = typeChecker.getTypeAtLocation(param);
  // Assert type structure...
});
```

### Available Utilities

| Utility | Purpose |
|---------|---------|
| `createTestProgram(code)` | Create in-memory TS program |
| `createProgramFromFile(path)` | Load TS program from disk |
| `findNodeBySelector(sf, query)` | Find AST node with tsquery |
| `walkType(type, checker)` | Analyze type structure recursively |
| `compareTypes(options)` | Compare actual vs expected types |
| `traceTypeAt(options)` | Trace type resolution chain |

### Assertion Helpers

```typescript
AssertEqual<T, U>           // Exact type equality
AssertExtends<T, U>         // Type extension (T extends U)
AssertProperty<T, K, U>     // Property K exists with type U
AssertNotIndexSignature<T>  // No index signature present
AssertHasProperties<T, P>   // Has all properties in P
```

### Running Type Tests

```bash
# All type tests
nx test type-tests

# Specific test file
nx test type-tests -- src/lib/query.spec.ts

# Watch mode
nx test type-tests -- --watch
```

### Fixtures

The `type-tests/fixtures/` directory contains 49+ fixture files representing various type scenarios. These are used by the spec files to validate type inference behavior.

---

## Development Workflow

### Building

```bash
# Build all packages
nx run-many -t build

# Build specific package
nx build cli-forge
nx build parser
```

### Testing

```bash
# Unit tests
nx test cli-forge
nx test parser

# Type tests
nx test type-tests

# E2E (runs examples)
nx run e2e:e2e:examples

# All tests
nx run-many -t test
```

### Documentation

```bash
# Build docs (generates example pages)
nx build docs-site

# Dev server
nx serve docs-site
```

---

## Key Patterns

### Fluent Builder Pattern
All methods return `CLI<TArgs>` for chaining with accumulated types.

### Type-Safe Arg Accumulation
Each `.option()` call expands the generic type parameter.

### Object Option Overloads
The `option()` method has 6 overloads prioritizing object options for correct type inference:
1. Object option (with `properties`)
2. String option
3. Number option
4. Boolean option
5. Array option
6. Generic fallback

### Configuration Inheritance
Config files support `extends` for composition:
```json
{
  "extends": "./base-config.json",
  "port": 8080
}
```

### Middleware Composition
Middleware transforms args between parsing and handler execution:
```typescript
cli('app')
  .middleware((args) => ({ ...args, timestamp: Date.now() }))
  .command('run', {
    handler: (args) => {
      // args.timestamp is available
    }
  });
```
