---
title: Configuration Files
description: Load, merge, inherit, and update CLI configuration from JSON files and package.json
nav:
  order: 5
---

# Configuration files

CLI Forge can load argument values from configuration files, letting users set defaults in a file instead of passing every flag on every invocation. This is the same pattern used by tools like ESLint, Prettier, and TypeScript.

The sections below cover two perspectives: **building** a CLI that supports config files, and the **user experience** those config files enable.

## Registering configuration providers

Use `.config()` with a built-in provider to register a configuration source:

<%= example('configuration-files').region('providers') %>

CLI Forge ships two built-in providers:

- **`ConfigurationProviders.JsonFile(filename, key?)`** — loads values from a JSON file. If `key` is provided, reads from that property instead of the root object.
- **`ConfigurationProviders.PackageJson(key)`** — loads values from a `key` inside the project's `package.json`.

You can register multiple providers. They are checked in registration order, and the first provider that supplies a value for a given key wins.

## How config loading works

When your CLI runs, the parser resolves configuration in a specific order.

### Resolution pipeline

For each registered provider, the framework:

1. **Resolves** — walks up the directory tree from the working directory looking for the config file
2. **Loads** — reads and parses the file
3. **Follows extends** — if the loaded config has an `"extends"` field, recursively loads the parent and merges
4. **Merges** — combines values from all providers (first-registered wins on conflicts)
5. **Yields to higher-precedence sources** — CLI args and env vars override config values

### Value precedence

When the same option has values from multiple sources, CLI Forge applies this precedence (highest wins):

1. **CLI arguments** — explicit flags always take priority
2. **Environment variables** — if env is configured for the option
3. **Configuration files** — in registration order
4. **Default values** — from option definitions

This means a user can set baseline values in a config file and override specific ones on the command line. The precedence follows the principle of specificity: CLI arguments are the most intentional, defaults are the least.

## Multiple providers and precedence

When you register multiple config providers, CLI Forge merges their values. The first provider to supply a value for a given key wins — later providers only contribute keys that haven't been set yet.

<%= example('multi-provider-precedence').file('cli.ts') %>

Given these config files:

```json
// package.json
{ "my-app": { "name": "from-package", "farewell": "pkg-farewell" } }

// app.config.json
{ "name": "from-json", "greeting": "json-greeting" }
```

The resolved config is:
- `name`: `"from-package"` — PackageJson was registered first, so it wins
- `greeting`: `"json-greeting"` — only in JsonFile
- `farewell`: `"pkg-farewell"` — only in PackageJson

Non-conflicting values merge from all providers. You can split configuration across files — for example, project-level settings in `package.json` and tool-specific settings in a dedicated config file.

## Configuration inheritance with `extends`

Config files support an `"extends"` field to inherit values from another file:

<%= example('config-inheritance').file('app.config.json') %>

<%= example('config-inheritance').file('base/app.config.json') %>

The child config inherits all values from the base and can override any of them. The `extends` path is resolved relative to the file that declares it. Common patterns:

- **Shared team configurations** — a base config checked into the repo, with per-developer overrides in a local file
- **Environment-specific configs** — a base config with production/staging/development overlays
- **Monorepo presets** — a root config that workspace packages extend

Extends chains can be arbitrarily deep (A extends B extends C). CLI Forge detects circular references and throws a clear error instead of looping.

## Constructor-based provider registration

For more control over provider behavior, use the constructor-based `.config()` overload. This accepts a provider class and an options object:

<%= example('default-config').region('init-command') %>

The constructor-based form supports a `default` option that tells the framework where to create a config file when none exists on disk. This is essential for `init` commands — without it, `updateConfig` would have no file to write to.

The `default` option accepts:
- A **string path**: `default: join(process.cwd(), 'app.config.json')`
- A **URL**: `default: new URL('./app.config.json', import.meta.url)`
- A **function** returning either (sync or async): `default: () => join(cwd(), 'app.config.json')`

The provider classes are available from the `ConfigurationFiles` namespace:

```typescript
import { ConfigurationFiles } from 'cli-forge';

// ConfigurationFiles.JsonFileConfigLoader
// ConfigurationFiles.PackageJsonConfigLoader
```

## Writing configuration back

Use `.updateConfig()` to persist values back to configuration files. This powers `init` commands, setup wizards, and `config set` commands:

```typescript
// Write a partial update — only the specified keys are changed
await app.updateConfig({ theme: 'dark' });

// Or use an updater function for read-modify-write
await app.updateConfig((config) => {
  config.theme = config.theme === 'dark' ? 'light' : 'dark';
});
```

### How updates are routed

When multiple providers are registered, `updateConfig` routes each key to the provider that originally supplied it. This means updating `greeting` writes to whichever file `greeting` was loaded from, not necessarily the first file.

<%= example('multi-provider-precedence').file('update-test.ts') %>

Keys that weren't in any config file (new keys) are written to the first provider that has a resolved file on disk. If no provider resolves — for example, when no config file exists yet — the framework falls back to the first provider with a `default` path configured and creates the file.

### Updates with `extends`

When a config file uses `extends`, updates are written to the child file (the one that declares `extends`), not the parent. Inherited values that are updated get a local copy in the child file, and the `extends` reference is preserved.

<%= example('config-inheritance').file('update-test.ts') %>

## Custom configuration providers

If JSON files and `package.json` don't fit your needs, implement the `ConfigurationProvider` interface to load config from any source:

```typescript
import { ConfigurationFiles } from 'cli-forge';

class YamlConfigLoader<T>
  implements ConfigurationFiles.ConfigurationProvider<T, string>
{
  resolve(configurationRoot: string): string | undefined {
    // Search for the config file from configurationRoot upward
  }

  load(filename: string): T & { extends?: string } {
    // Parse and return the config object
  }

  // Optional: enable updateConfig support
  async updateConfig(
    configOrUpdater: T | ((current: T) => T | Promise<T>),
    options?: { targetPath?: string }
  ): Promise<void> {
    // Write updated config back to disk
  }
}
```

The interface has two required methods (`resolve` and `load`) and two optional ones (`updateConfig` and `describeConfig`). The `TLocation` type parameter (second generic, defaults to `string | URL`) controls the path type used by `resolve` and `load`.

## What your users get

When you add config file support to your CLI, your users get several capabilities without any extra work on your part:

### Zero-flag invocations

Instead of typing every option:

```bash
my-tool --host localhost --port 8080 --debug --log-level verbose
```

Users create a config file once and just run:

```bash
my-tool
```

### Per-project configuration

The config file lives in the project directory and can be checked into source control. Every developer on the team gets the same defaults.

### Layered overrides

Users can set team defaults in a base config, override per-project or per-environment with `extends`, and still override anything from the command line. The precedence chain (CLI args > env vars > config files > defaults) gives them fine-grained control.

### Init and set commands

If you use the `default` option and expose `updateConfig` through commands, users get interactive setup:

```bash
# Bootstrap a config file
my-tool init --theme dark --lang fr

# Tweak individual values
my-tool set --key theme --value light
```

## When to use configuration files

| Scenario | Recommendation |
|---|---|
| Many options with stable defaults | Use a JSON config file |
| Project-level settings shared in source control | Use a `package.json` key |
| Team base config with personal overrides | Use `extends` inheritance |
| One-off flags | Stick with CLI arguments |
| Setup wizard or init command | Use `default` + `updateConfig` |
| Non-JSON config format | Implement a custom provider |

For complete working examples with test assertions, see:

- [Configuration files](/examples/configuration-files) — basic provider setup
- [Config inheritance](/examples/config-inheritance) — extends and updateConfig
- [Multi-provider precedence](/examples/multi-provider-precedence) — merging across providers
