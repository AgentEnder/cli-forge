---
title: Configuration Files
description: Load CLI arguments from JSON files and package.json
nav:
  order: 5
---

# Configuration files

CLI Forge can load argument values from configuration files, letting users set defaults in a file instead of passing every flag on every invocation. This is the same pattern used by tools like ESLint, Prettier, and TypeScript.

## Registering configuration providers

Use `.config()` with a built-in provider to register a configuration source:

<%= example('configuration-files').region('providers') %>

CLI Forge ships two built-in providers:

- **`ConfigurationProviders.JsonFile(filename, key?)`** — loads values from a JSON file. If `key` is provided, reads from that property instead of the root object.
- **`ConfigurationProviders.PackageJson(key)`** — loads values from a `key` inside the project's `package.json`.

You can register multiple providers. They are checked in registration order, and the first provider that supplies a value for a given option wins.

## Value precedence

When the same option has values from multiple sources, CLI Forge applies this precedence (highest wins):

1. **CLI arguments** — explicit flags always take priority
2. **Environment variables** — if env is configured
3. **Configuration files** — in registration order
4. **Default values** — from option definitions

This means a user can set baseline values in a config file and override specific ones on the command line.

## Configuration inheritance with `extends`

Config files support an `extends` field to inherit values from another file:

```json
{
  "extends": "./base-config.json",
  "port": 8080
}
```

```json
{
  "host": "localhost",
  "port": 3000,
  "debug": false
}
```

The child config inherits all values from `base-config.json` and overrides `port`. This enables shared team configurations with per-developer or per-environment overrides.

CLI Forge detects circular `extends` references and throws a clear error instead of looping forever.

## Writing configuration back

Use `.updateConfig()` to persist values back to a configuration file. This is useful for `init` commands or setup wizards:

```typescript
const app = cli('my-tool')
  .option('theme', { type: 'string', default: 'light' })
  .config(ConfigurationProviders.JsonFile('my-tool.config.json'))
  .command('set-theme', {
    builder: (cmd) =>
      cmd.option('value', { type: 'string', required: true }),
    handler: async (args) => {
      await args.updateConfig({ theme: args.value });
      console.log(`Theme set to ${args.value}`);
    },
  });
```

The update is written to the first provider that supports writing (JSON file providers do, package.json does not).

## When to use configuration files

| Scenario | Recommendation |
|---|---|
| Many options with stable defaults | Use a JSON config file |
| Project-level settings shared in source control | Use package.json key |
| Team base config with personal overrides | Use `extends` inheritance |
| One-off flags | Stick with CLI arguments |

For the complete working example with test assertions, see the [configuration files example](/examples/configuration-files).
