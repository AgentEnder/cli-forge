# SDK Function Design

## Overview

Add an `sdk()` method to `CLI<T>` that returns a programmatic interface for invoking CLI commands without going through argv parsing. This enables library consumers to use CLI-forge CLIs as typed SDKs.

## Usage Examples

```typescript
// Define CLI
const myCLI = cli('my-app')
  .option('verbose', { type: 'boolean' })
  .command('build', {
    builder: (cmd) => cmd.option('watch', { type: 'boolean' }),
    handler: (args) => ({ success: true, files: ['a.js', 'b.js'] })
  })
  .command('db', {
    // No handler - container command
    builder: (cmd) => cmd
      .command('migrate', {
        handler: (args) => { /* ... */ }
      })
  });

// Export SDK
module.exports = myCLI.sdk();
```

```typescript
// Consume SDK
const sdk = require('my-app');

// Invoke root command
await sdk({ verbose: true });

// Invoke subcommand with typed args
const result = await sdk.build({ watch: true });
console.log(result.files);      // ['a.js', 'b.js']
console.log(result.$args.watch); // true

// Nested commands via flat namespace
await sdk.db.migrate();

// CLI-style args for -- support
await sdk.build(['--watch', '--', 'extra-arg']);
```

## Design Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Arg passing | Overloaded: object or string[] | Object gives type safety; string[] supports `--` extra args |
| Return type | Handler result with `$args` attached | Clean API with escape hatch for parsed args |
| `$args` on primitives | Best-effort (skip if primitive) | Pragmatic - attach when possible, degrade gracefully |
| Errors | Throw directly | Standard JS semantics |
| Validation | Skip for object args, full for string[] | TypeScript validates structure; runtime catches string[] issues |
| Middleware | Always runs | Consistent behavior for arg transformation |
| Nesting | Flat namespace (`sdk.build.watch()`) | Direct access to all commands |
| Root callable | Only if handler exists | Accurate type representation |

## Type Definitions

```typescript
/**
 * Result type that conditionally includes $args.
 * Only attaches $args when result is an object.
 */
type SDKResult<TArgs, THandlerReturn> =
  THandlerReturn extends object
    ? THandlerReturn & { $args: TArgs }
    : THandlerReturn;

/**
 * The callable signature for a command with a handler.
 */
type SDKInvokable<TArgs, THandlerReturn> = {
  // Object-style args (skips validation, runs middleware)
  (args?: Partial<Omit<TArgs, 'unmatched' | '--'>>): Promise<SDKResult<TArgs, THandlerReturn>>;
  // String array args (full pipeline)
  (args: string[]): Promise<SDKResult<TArgs, THandlerReturn>>;
};

/**
 * Recursively builds SDK type from TChildren.
 */
type SDKChildren<TChildren> = {
  [K in keyof TChildren]: TChildren[K] extends CLI<infer A, infer R, infer C, any>
    ? SDKCommand<A, R, C>
    : never;
};

/**
 * A single SDK command - callable if it has a handler, with nested children.
 */
type SDKCommand<TArgs, THandlerReturn, TChildren> =
  THandlerReturn extends void
    ? SDKChildren<TChildren>  // No handler = just children
    : SDKInvokable<TArgs, THandlerReturn> & SDKChildren<TChildren>;
```

## Runtime Implementation

### Proxy-Based Approach

Use JavaScript Proxy to create an object that is both callable and has child properties:

```typescript
sdk(): SDKCommand<TArgs, THandlerReturn, TChildren> {
  return this.buildSDKProxy(this) as SDKCommand<TArgs, THandlerReturn, TChildren>;
}

private buildSDKProxy(cmd: InternalCLI<any, any, any, any>): unknown {
  const invoke = async (argsOrArgv?: object | string[]) => {
    const handler = cmd.getHandler();
    if (!handler) {
      throw new Error(`Command '${cmd.name}' has no handler`);
    }

    let parsedArgs: any;
    if (Array.isArray(argsOrArgv)) {
      // String array: full pipeline (parse → validate → middleware)
      parsedArgs = cmd.parser.parse(argsOrArgv);
    } else {
      // Object args: skip validation, apply defaults, run middleware
      parsedArgs = { ...cmd.parser.getDefaults(), ...argsOrArgv };
    }

    // Run middleware chain (including parent middleware)
    const middlewares = this.collectMiddleware(cmd);
    for (const mw of middlewares) {
      const result = await mw(parsedArgs);
      if (result && typeof result === 'object') parsedArgs = result;
    }

    // Execute handler
    const result = await handler(parsedArgs);

    // Try to attach $args (fails silently for primitives)
    if (result && typeof result === 'object') {
      (result as any).$args = parsedArgs;
    }
    return result;
  };

  // Create proxy that is both callable and has child properties
  return new Proxy(invoke, {
    get(_, prop: string) {
      const child = cmd.registeredCommands[prop];
      if (child) return this.buildSDKProxy(child);
      return undefined;
    }
  });
}

private collectMiddleware(cmd: InternalCLI): Array<MiddlewareFunction> {
  const chain: InternalCLI[] = [];
  let current: InternalCLI | undefined = cmd;
  while (current) {
    chain.unshift(current);
    current = current._parent;
  }
  return chain.flatMap(c => c.registeredMiddleware);
}
```

### Key Implementation Details

1. **Lazy traversal**: Child SDK proxies are built on property access, not upfront
2. **Two code paths**:
   - String array → full parse/validate/middleware pipeline
   - Object args → merge with defaults, skip validation, run middleware
3. **Middleware chain**: Collects middleware from entire parent chain
4. **$args attachment**: Best-effort; primitives returned as-is

## Edge Cases

### Container Commands (No Handler)

Commands that exist only to group subcommands:

```typescript
sdk.db()         // throws: "Command 'db' has no handler"
sdk.db.migrate() // works
```

Type system prevents calling via `THandlerReturn extends void` conditional.

### Default Values

Object-style invocation merges with parser defaults:

```typescript
// CLI has: .option('port', { type: 'number', default: 3000 })
await sdk.serve({ host: 'localhost' });
// parsedArgs = { host: 'localhost', port: 3000 }
```

### Extra Args (`--`)

Only available via string array invocation:

```typescript
sdk.build(['--watch', '--', 'extra', 'args'])  // works, args['--'] = ['extra', 'args']
sdk.build({ watch: true })  // no way to pass '--' args (by design)
```

## Files to Modify

1. `packages/cli-forge/src/lib/public-api.ts` - Add `sdk()` to CLI interface, export types
2. `packages/cli-forge/src/lib/internal-cli.ts` - Implement `sdk()` and `buildSDKProxy()`
3. `packages/cli-forge/src/index.ts` - Re-export SDK types

## Testing Strategy

1. **Unit tests** (`packages/cli-forge/src/lib/__tests__/sdk.spec.ts`)
   - Object args invocation
   - String array invocation
   - Nested command access
   - Middleware execution
   - Default value merging
   - Error cases (no handler, validation failures)

2. **Type tests** (`type-tests/`)
   - SDK type inference from CLI
   - Conditional callable based on handler presence
   - $args type on result

3. **Example** (`examples/sdk-usage.ts`)
   - Demonstrate SDK pattern for library consumers
