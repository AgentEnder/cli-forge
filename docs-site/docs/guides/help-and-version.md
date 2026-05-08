---
title: Help & Version Customization
description: Customize or disable the built-in --help and --version flags, per-option help text, and error handling
nav:
  order: 8
---

# Help & version customization

CLI Forge registers `--help` and `--version` flags automatically. You can customize their output, disable them entirely, control how individual options appear in help text, and customize error handling with `.catch()`.

## Custom help output

Pass a callback to `.help()` to take full control of the help text. The callback receives a context object you can destructure:

<%= example('help-customization').region('help') %>

The `HelpContext` object contains:

| Property | Description |
|---|---|
| `args` | The parsed arguments at the time `--help` was invoked. Typed as `Partial<TArgs>` since the parse may not have completed. |
| `cli` | The CLI instance for the command being helped. |
| `renderDefaultHelp()` | Returns the full default help text. Call it to augment rather than replace. |
| `options` | Array of visible options, each with a `renderHelpText()` method (see [below](#working-with-options-in-help-callbacks)). |

Because `args` includes everything parsed so far, you can vary the output based on other flags — for example, showing extra detail when `--verbose` is also passed.

## Custom version output

Pass a callback to `.version()` for custom version formatting. The `VersionContext` object works the same way:

<%= example('help-customization').region('version') %>

Chain `.version(string)` before `.version(callback)` to set the version string that `renderDefaultVersion()` returns. Without a string override, it defaults to the nearest `package.json` version.

## Disabling --help or --version

Pass `false` to suppress help or version output:

```typescript
cli('my-tool')
  .help(false)    // --help won't print help text
  .version(false) // --version won't print version
```

When disabled, the flag won't appear in help text and passing it won't trigger any special behavior — the handler runs normally as if `--help` wasn't passed.

Disabling works at any command level. You can disable help on a specific subcommand while keeping it active on the root:

```typescript
cli('my-tool')
  .command('internal', {
    builder: (args) =>
      args
        .help(false) // no help for this subcommand
        .option('key', { type: 'string' }),
    handler: (args) => { /* ... */ },
  });
```

Calling `.help(callback)` or `.version(string | callback)` after disabling re-enables the feature.

## Help callback inheritance

Help callbacks propagate down the command tree. If a subcommand doesn't define its own `.help()` callback, it inherits from its closest ancestor that has one:

```typescript
cli('my-tool')
  .help(({ renderDefaultHelp }) => {
    return `my-tool v1.0.0\n\n${renderDefaultHelp()}`;
  })
  .command('build', {
    builder: (args) => args.option('watch', { type: 'boolean' }),
    handler: (args) => { /* ... */ },
  })
  .command('serve', {
    builder: (args) =>
      args
        // Override the inherited help callback for this subcommand only
        .help(({ renderDefaultHelp }) => {
          return `Server Help\n\n${renderDefaultHelp()}`;
        })
        .option('port', { type: 'number', default: 3000 }),
    handler: (args) => { /* ... */ },
  });
```

Running `my-tool build --help` uses the root help callback. Running `my-tool serve --help` uses the serve-specific one.

## Working with options in help callbacks

The `options` array in the help context gives you each visible (non-hidden, non-positional) option as an `OptionInfo` object:

| Property | Description |
|---|---|
| `key` | The option's storage key (e.g. `"port"`). |
| `config` | The full option configuration object. |
| `renderHelpText()` | Renders the help line for this option, respecting any `formatHelpText` override. |

This is useful for building fully custom help layouts:

```typescript
cli('my-tool')
  .option('port', { type: 'number', description: 'Port to listen on' })
  .option('host', { type: 'string', description: 'Hostname' })
  .help(({ options }) => {
    const lines = ['my-tool options:', ''];
    for (const opt of options) {
      // renderHelpText() applies any per-option formatHelpText override
      lines.push(opt.renderHelpText());
    }
    return lines.join('\n');
  });
```

## Per-option help text

Add a `formatHelpText` callback to any option to customize how that specific option renders in help output:

<%= example('help-customization').region('options') %>

The callback receives the option's configuration object and the default text string. Return the replacement line for that option in the help output. Options without `formatHelpText` render normally.

When a help callback calls `option.renderHelpText()`, per-option `formatHelpText` overrides are automatically applied.

## Error handling with .catch()

By default, CLI Forge prints help text and error details when validation fails (e.g., a required option is missing). Use `.catch()` to replace this behavior, similar to how `Promise.catch()` works:

<%= example('help-customization').region('catch') %>

The catch handler receives:

| Parameter | Description |
|---|---|
| `error` | The error that was thrown. |
| `context.cli` | The CLI instance. |
| `context.exit(code?)` | Exit the process. Prefer this over `process.exit` for interactive shell support. |
| `context.renderDefaultHelp()` | Renders the default help text, useful for including in custom error output. |

When a `.catch()` handler is registered, it replaces the default validation error handler entirely. It follows `Promise.catch()` semantics: if the handler returns normally, the error is suppressed and `forge()` returns. If the handler rethrows (or throws a new error), the error propagates to callers of `forge()`.
