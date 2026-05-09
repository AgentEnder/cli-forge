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

<%= example('configuration-files').file('configured-cli.config.json') %>

Running `my-tool` from anywhere inside the project picks up these values. The file is found by walking up the directory tree from the working directory, so `cd my-project/src && my-tool` still works.

**How to build it:**

<%= example('configuration-files').region('json-file-config') %>

If the config should live under a key instead of at the root of the JSON file, pass the key name as the second argument:

<%= example('configuration-files').region('nested-key-config') %>

## `package.json` key

**What your users see:** Configuration lives inside `package.json` under a key. No extra file needed. Similar to how Jest uses `"jest"` and Babel uses `"babel"` in `package.json`.

<%= example('configuration-files').file('package.json') %>

This works well for tools with a small number of options where adding a separate file feels heavy.

**How to build it:**

<%= example('configuration-files').region('package-json-config') %>

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

<%= example('multi-provider-precedence').file('package.json') %>

<%= example('multi-provider-precedence').file('app.config.json') %>

The resolved values are:
- `name`: `"from-package"` — PackageJson was registered first, so it wins
- `greeting`: `"json-greeting"` — only in the JSON file
- `farewell`: `"pkg-farewell"` — only in package.json

## Shareable and inheritable configs

**What your users see:** A base config that other configs extend, just like `tsconfig.json` with `"extends"`. Teams publish a shared config package or keep a base config in the repo root, and individual projects override specific values.

<%= example('config-inheritance').file('base/app.config.json') %>

<%= example('config-inheritance').file('app.config.json') %>

The project config inherits values from the base and overrides specific keys. Extends chains can go arbitrarily deep (A extends B extends C). CLI Forge detects circular references and throws a clear error.

**How to build it:** No extra code needed — `extends` works automatically with any configuration provider. The framework handles inheritance at the aggregate level, so custom providers get it for free.

<%= example('config-inheritance').file('cli.ts') %>

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

**How to build it:** Use the constructor-based `.config()` overload with a `locations` map and a `defaultLocation`. Each named location declares a path the framework can read from and write to; `defaultLocation` is the catch-all for fresh writes when no file exists yet.

<%= example('default-config').region('init-command') %>

Without `defaultLocation`, `updateConfig` would fail because there's no file to write to.

### Choosing the right named locations

Where the config file gets created depends on what kind of tool you're building:

**Project tools** (linters, bundlers, test runners) — config lives at the project root, similar to `tsconfig.json` or `.prettierrc.json`. Users expect to find it next to `package.json` or `.git`. Since users may run the CLI from a subdirectory, walk up the tree to find the root:

<%= example('config-patterns').region('find-project-root') %>

**User-level tools** (CLIs installed globally, developer utilities, personal tools) — config lives in the user's home directory. Following the [XDG Base Directory](https://specifications.freedesktop.org/basedir-spec/latest/) convention, use `~/.config/`:

<%= example('config-patterns').region('user-level') %>

Your users would then see:

```bash
$ my-tool init
Config written to ~/.config/my-tool/config.json
```

**Hybrid tools** — some tools support both project-level and user-level config, with project config taking precedence. Register two providers — the project-level one resolves via walk-upward first, and the user-level one acts as a fallback via its USER named location:

<%= example('config-patterns').region('hybrid') %>

Each location accepts a string path, a `URL`, or a function returning either (sync or async). The provider classes are available from the `ConfigurationFiles` namespace:

```typescript
import { ConfigurationFiles } from 'cli-forge';
```

### Routing per-option writes to specific locations

When a single CLI has both user-level preferences (theme, telemetry, API tokens) and project-level settings (project name, build options), declare both on a single provider as named locations and pin each option with `defaultConfigLocation`:

<%= example('config-named-locations').region('named-locations') %>

Reads merge values from every named location (in declaration order). Writes follow this routing per key:

1. **Provenance** — if the value was loaded from a specific file, writes go back to that file.
2. **Per-option `defaultConfigLocation`** — pins fresh writes for that option to the named location.
3. **Global `defaultLocation`** — fresh-write fallback for options without a per-option override.

The location name is type-safe: `defaultConfigLocation` is constrained to the keys you declared in `locations`, so typos fail at compile time.

## Updating config from code

**What your users see:** Commands that persist settings to the config file. Changes survive between invocations.

**How to build it:** Call `app.updateConfig()` from any command handler:

<%= example('config-patterns').region('update-config') %>

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

If JSON and `package.json` don't fit your needs, implement the `ConfigurationProvider` interface. Here's a working key-value config loader that reads `key=value` files:

<%= example('config-patterns').region('custom-provider') %>

The interface requires `resolve` and `load`. The `updateConfig` and `describeConfig` methods are optional.

## Choosing a configuration style

| Your users need | Configuration style | Provider |
|---|---|---|
| A dedicated config file like `tsconfig.json` | Dedicated config file | `ConfigurationProviders.JsonFile(filename)` |
| Settings in `package.json` without extra files | package.json key | `ConfigurationProviders.PackageJson(key)` |
| Multiple places to put config | Multiple sources | Register several providers |
| A team base config with project overrides | Inheritable configs | Add `"extends"` to any JSON config |
| A `my-tool init` command | Init/bootstrap | Use `locations` + `defaultLocation` + `updateConfig` |
| Per-option write routing (USER vs PROJECT) | Named locations | Add `defaultConfigLocation` to options |
| YAML, TOML, or another format | Custom provider | Implement `ConfigurationProvider` |

For complete working examples with test assertions, see:

- [Configuration files](/examples/configuration-files) — basic provider setup
- [Config inheritance](/examples/config-inheritance) — extends and updateConfig
- [Multi-provider precedence](/examples/multi-provider-precedence) — merging across providers
