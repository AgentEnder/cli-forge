---
title: Configuration Files
description: Let your CLI users store settings in config files instead of passing flags on every invocation
nav:
  order: 5
---

# Configuration files

Adding config file support to your CLI means users can store their preferred settings once and skip repeating flags on every invocation. Instead of:

```bash
my-tool --host localhost --port 8080 --debug --log-level verbose
```

They create a config file and run:

```bash
my-tool
```

CLI Forge supports several configuration styles. Each one gives your users a different experience — pick the ones that match how your tool will be used.

## Dedicated config file

**What your users see:** A JSON file named after your tool, checked into the project root. Similar to `tsconfig.json`, `.prettierrc.json`, or `eslint.config.json`.

```
my-project/
├── my-tool.config.json    ← config lives here
├── package.json
└── src/
```

```json
{
  "host": "localhost",
  "port": 8080,
  "debug": true
}
```

Running `my-tool` from anywhere inside the project picks up these values. The file is found by walking up the directory tree from the working directory, so `cd my-project/src && my-tool` still works.

**How to build it:**

```typescript
import { cli, ConfigurationProviders } from 'cli-forge';

cli('my-tool', {
  builder: (args) =>
    args
      .option('host', { type: 'string', default: 'localhost' })
      .option('port', { type: 'number', default: 3000 })
      .option('debug', { type: 'boolean', default: false })
      .config(ConfigurationProviders.JsonFile('my-tool.config.json')),
  handler: (args) => {
    // args.host, args.port, args.debug are populated from the config file
  },
});
```

If the config should live under a key instead of at the root of the JSON file, pass the key name as the second argument:

```typescript
// Reads from { "my-tool": { "host": "...", "port": ... } }
.config(ConfigurationProviders.JsonFile('other.config.json', 'my-tool'))
```

## `package.json` key

**What your users see:** Configuration lives inside `package.json` under a key. No extra file needed. Similar to how Jest uses `"jest"` and Babel uses `"babel"` in `package.json`.

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "my-tool": {
    "host": "localhost",
    "port": 8080
  }
}
```

This works well for tools with a small number of options where adding a separate file feels heavy.

**How to build it:**

```typescript
.config(ConfigurationProviders.PackageJson('my-tool'))
```

## Multiple config sources

**What your users see:** The tool checks several places for configuration. Users put settings wherever makes sense for their project — a dedicated config file, `package.json`, or both.

```
my-project/
├── my-tool.config.json    ← tool-specific settings
├── package.json           ← also has a "my-tool" key
└── src/
```

When the same key appears in multiple sources, the first registered provider wins. Non-conflicting keys merge from all sources.

**How to build it:**

<%= example('multi-provider-precedence').file('cli.ts') %>

Given these config files:

```json
// package.json
{ "my-app": { "name": "from-package", "farewell": "pkg-farewell" } }

// app.config.json
{ "name": "from-json", "greeting": "json-greeting" }
```

The resolved values are:
- `name`: `"from-package"` — PackageJson was registered first, so it wins
- `greeting`: `"json-greeting"` — only in the JSON file
- `farewell`: `"pkg-farewell"` — only in package.json

## Shareable and inheritable configs

**What your users see:** A base config that other configs extend, just like `tsconfig.json` with `"extends"`. Teams publish a shared config package or keep a base config in the repo root, and individual projects override specific values.

```json
// base.config.json — shared team defaults
{
  "host": "0.0.0.0",
  "port": 3000,
  "debug": false
}
```

```json
// my-tool.config.json — project overrides
{
  "extends": "./base.config.json",
  "port": 8080,
  "debug": true
}
```

The project config inherits `host` from the base and overrides `port` and `debug`. Extends chains can go arbitrarily deep (A extends B extends C). CLI Forge detects circular references and throws a clear error.

**How to build it:** No extra code needed — `extends` works automatically with any JSON file provider.

<%= example('config-inheritance').file('cli.ts') %>

<%= example('config-inheritance').file('app.config.json') %>

<%= example('config-inheritance').file('base/app.config.json') %>

## Init commands and config bootstrapping

**What your users see:** An `init` command that creates a config file with sensible defaults, so users don't have to write JSON by hand.

```bash
$ my-tool init --theme dark --lang fr
Config written to my-tool.config.json

$ cat my-tool.config.json
{
  "theme": "dark",
  "lang": "fr"
}
```

After that, running `my-tool` picks up the config automatically. Users can also update individual values:

```bash
$ my-tool set --key theme --value light
Set theme = light
```

**How to build it:** Use the constructor-based `.config()` overload with a `default` option. The `default` tells the framework where to create the config file when none exists on disk.

<%= example('default-config').region('init-command') %>

Without `default`, `updateConfig` would fail because there's no file to write to. The `default` option accepts a string path, a `URL`, or a function returning either:

```typescript
// Static path
default: join(process.cwd(), 'my-tool.config.json')

// URL (for ESM)
default: new URL('./my-tool.config.json', import.meta.url)

// Deferred function
default: () => join(process.cwd(), 'my-tool.config.json')
```

The provider classes (`JsonFileConfigLoader`, `PackageJsonConfigLoader`) are available from the `ConfigurationFiles` namespace:

```typescript
import { ConfigurationFiles } from 'cli-forge';
```

## Updating config from code

**What your users see:** Commands that persist settings to the config file. Changes survive between invocations.

**How to build it:** Call `app.updateConfig()` from any command handler:

```typescript
// Partial update — only the specified keys change
await app.updateConfig({ theme: 'dark' });

// Updater function — read-modify-write
await app.updateConfig((config) => {
  config.theme = config.theme === 'dark' ? 'light' : 'dark';
});
```

When multiple providers are registered, updates route to the correct file. Each key is written to whichever provider originally supplied it:

<%= example('multi-provider-precedence').file('update-test.ts') %>

When a config file uses `extends`, updates are written to the child file (not the parent), and the `extends` reference is preserved:

<%= example('config-inheritance').file('update-test.ts') %>

## Value precedence

Across all configuration styles, CLI Forge applies a consistent precedence (highest wins):

1. **CLI arguments** — explicit flags always take priority
2. **Environment variables** — if env is configured for the option
3. **Configuration files** — in registration order
4. **Default values** — from option definitions

Your users can set baseline values in a config file and override any of them from the command line on a per-invocation basis. The precedence follows specificity: CLI arguments are the most intentional, defaults are the least.

## Custom configuration providers

If JSON and `package.json` don't fit your needs — for example, YAML or TOML configs — implement the `ConfigurationProvider` interface:

```typescript
import { ConfigurationFiles } from 'cli-forge';

class YamlConfigLoader<T>
  implements ConfigurationFiles.ConfigurationProvider<T, string>
{
  resolve(configurationRoot: string): string | undefined {
    // Walk up directory tree looking for the config file
  }

  load(filename: string): T & { extends?: string } {
    // Parse and return the config object
  }

  async updateConfig(
    configOrUpdater: T | ((current: T) => T | Promise<T>),
    options?: { targetPath?: string }
  ): Promise<void> {
    // Write updated config back to disk
  }
}
```

The interface requires `resolve` and `load`. The `updateConfig` and `describeConfig` methods are optional.

## Choosing a configuration style

| Your users need | Configuration style | Provider |
|---|---|---|
| A dedicated config file like `tsconfig.json` | Dedicated config file | `ConfigurationProviders.JsonFile(filename)` |
| Settings in `package.json` without extra files | package.json key | `ConfigurationProviders.PackageJson(key)` |
| Multiple places to put config | Multiple sources | Register several providers |
| A team base config with project overrides | Inheritable configs | Add `"extends"` to any JSON config |
| A `my-tool init` command | Init/bootstrap | Use `default` + `updateConfig` |
| YAML, TOML, or another format | Custom provider | Implement `ConfigurationProvider` |

For complete working examples with test assertions, see:

- [Configuration files](/examples/configuration-files) — basic provider setup
- [Config inheritance](/examples/config-inheritance) — extends and updateConfig
- [Multi-provider precedence](/examples/multi-provider-precedence) — merging across providers
