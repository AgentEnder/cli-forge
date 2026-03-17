## Common Options

Start by defining reusable option builders for common patterns. These can be imported by any command that needs them.

<%= file('builders/common.ts') %>

## Output Options

Group related options together. The output builders handle format selection and file output.

<%= file('builders/output.ts') %>

## Build Command

The build command composes multiple option builders using the `chain` function. TypeScript correctly infers the combined type of all options in the handler.

<%= file('commands/build.ts') %>

## Serve Command

The serve command reuses `withVerbose` from common options, ensuring the `--verbose` flag behaves identically across commands.

<%= file('commands/serve.ts') %>

## Main CLI

The main entry point composes all commands together. Each command brings its own options, all composed from reusable builders.

<%= file('cli.ts') %>

## Benefits of This Pattern

1. **Consistency**: Options like `--verbose` behave identically everywhere
2. **Type Safety**: The `chain` function preserves types through composition
3. **Maintainability**: Change an option definition once, update everywhere
4. **Discoverability**: Option builders serve as documentation for available options
