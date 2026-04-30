---
title: Argument Parsing
description: How CLI Forge parses, types, and validates arguments — and the option types available
nav:
  order: 3
---

# Argument parsing

CLI Forge turns raw `process.argv` into a fully-typed args object. You declare options on a builder, and the parser handles tokenization, type coercion, defaults, environment variables, config files, and validation. This guide is a reference for what's available and how the pieces fit together.

## How parsing works

When you call `.forge()`, every command level runs through the same normalization pipeline before its handler executes:

1. **Tokenize** raw CLI arguments
2. **Apply environment variables** for options that read from `env`
3. **Apply configuration files** registered with `.config()`
4. **Apply defaults** for missing options
5. **Coerce** values via the option's `coerce` function
6. **Validate**: check `required`, `choices`, custom `validate`, `conflicts`, `implies`, and (in strict mode) unknown arguments

Earlier sources beat later ones: a CLI flag overrides an env var, which overrides a config file, which overrides a default. For nested commands, parsing happens at each level so subcommand options can reference parent options.

For the full lifecycle including builders, middleware, and init hooks, see the [execution lifecycle example](/examples/execution-lifecycle).

## Option types

CLI Forge supports six option kinds plus positional arguments. Each kind contributes its TypeScript type to the inferred args object.

### String

The default kind. Accepts any string value.

<%= example('argument-types').region('string-option') %>

Pass on the CLI as `--name release`. Restrict allowed values with `choices` (see [Validation](#validation) below).

### Number

Coerces the input to a JavaScript number. Non-numeric input fails validation.

<%= example('argument-types').region('number-option') %>

Pass on the CLI as `--port 8080`.

### Boolean

Boolean flags accept three forms: bare flag, explicit value, and negated flag.

<%= example('argument-types').region('boolean-option') %>

All of these set the option:

- `--verbose` → `true`
- `--verbose true` / `--verbose false` → `true` / `false`
- `--no-verbose` → `false`

### Array

Arrays collect multiple values into a single `string[]` or `number[]`, depending on `items`.

<%= example('argument-types').region('array-option') %>

The same option can be passed three ways:

- Space-separated: `--tags api db admin`
- Comma-separated: `--tags api,db,admin`
- Repeated flags: `--tags api --tags db --tags admin`

For `items: 'number'`, each value is coerced to a number individually.

### Object

Object options carry nested structure with full type inference. You declare the shape with `properties`, and the parser accepts either dot-notation flags or a JSON string (or both, mixed).

For a quick demonstration of nested types and dot-notation, see the [object dot-notation example](/examples/object-dot-notation-simple).

For a deeper walkthrough — defaults at any level, conditionally required nested properties, validation, and JSON input — see the [object arguments example](/examples/object-arguments).

Pass on the CLI as:

- Dot-notation: `--config.server.host localhost --config.server.port 8080`
- JSON string: `--config '{"server":{"host":"localhost","port":8080}}'`
- Mixed (later values win): `--config '{"server":{}}' --config.server.port 8080`

Object options are verbose for users — prefer flat options for common settings, and reserve objects for genuinely nested configuration.

### `oneOf`

`oneOf` lets a single flag accept values of different types, with the parser trying each `valueType` in order.

A common pattern is a flag that doubles as a boolean toggle and a typed selector, like `--color` / `--no-color` / `--color=always`:

<%= example('one-of-option').file('color-output.ts') %>

Boolean handling is exclusive when `boolean` appears in `valueTypes`: the bare flag (`--color`), negation (`--no-color`), and the literals `true`/`false` always go to the boolean parser. All other inputs are tried against the remaining types in array order.

For `oneOf` of `number | string` and nested object branches, see the [oneOf example](/examples/one-of-option).

### Positional arguments

Positional arguments are values without a leading `--flag`. Register them with `.positional()` instead of `.option()`. They're matched by order on the command line.

<%= example('argument-types').region('positional') %>

With this declaration, `argument-types deploy production` binds `target` to `"production"`. Positionals can be `required: true`, accept defaults, or use any of the other option types — the same `type` system applies.

## Validation

Validation runs after coercion and before the handler. Each feature is opt-in.

### Choices

Restrict an option to a set of allowed values. With a static array, TypeScript narrows the value to the literal union (e.g. `'sir' | 'madame'`).

<%= example('limit-choices').region('static-choices') %>

Choices can also be a function for runtime-computed values:

<%= example('limit-choices').region('dynamic-choices') %>

### Required

Set `required: true` to fail validation when no value is provided from any source (CLI, env, config, default).

### Custom validate

Provide a `validate(value)` function that returns `true` for valid input or an error message string. Runs after `coerce` and `choices`.

### Conflicts and implications

Express relationships between options with `.conflicts()` and `.implies()`:

<%= example('conflicts-and-implications').region('builder') %>

- **`.conflicts('a', 'b')`** — `a` and `b` cannot both be provided.
- **`.implies('a', 'b')`** — providing `a` requires `b` to also be provided.

### Strict mode

By default, unknown arguments are silently collected into an `unmatched` array. Strict mode rejects them:

<%= example('strict-mode').region('cli') %>

Use non-strict mode when wrapping another tool that needs pass-through arguments.

For the deeper validation reference (validation order, custom validators, error handling), see the [validation guide](./validation).

## Value sources

In addition to CLI flags, options can be populated from environment variables, configuration files, or defaults. Precedence (highest wins): **CLI flags > env vars > config files > defaults**.

### Environment variables

Two opt-in modes:

- **Per-option** — set `env: 'MY_VAR'` on individual options to pull from a specific variable.
- **Global** — call `.env()` to enable env-var support for every option, with names auto-derived from the CLI name and option name.

<%= example('env-options').file('per-option-env.ts') %>

The same CLI with global env support:

<%= example('env-options').file('with-global-env.ts') %>

### Configuration files

Register a configuration provider with `.config()` to load values from JSON or `package.json`. Multiple providers can be registered; the first to supply a value wins. Config files can `extends` other configs for shared base configurations.

See the [configuration files guide](./configuration-files) for the full reference.

### Defaults

Three forms — direct value, `{ value, description }`, and `{ factory, description }` — see the [default values example](/examples/default-values) for when each form makes sense (notably, `description` keeps generated docs deterministic when the actual default depends on env or arch).

## Quick reference

| Feature | Where to declare | Purpose |
|---|---|---|
| `type: 'string'` | option | Plain string value |
| `type: 'number'` | option | Numeric value, coerced from string |
| `type: 'boolean'` | option | Flag, supports `--no-` negation |
| `type: 'array'` + `items` | option | List of strings or numbers |
| `type: 'object'` + `properties` | option | Nested structure via dot-notation or JSON |
| `type: 'oneOf'` + `valueTypes` | option | Multi-typed flag (e.g. boolean-or-string) |
| `.positional(name, opts)` | builder | Argument matched by position, not by flag |
| `choices: [...]` | option | Restrict to a fixed set, narrows TS type |
| `required: true` | option | Fail if no value from any source |
| `default: ...` | option | Fallback when no source provides a value |
| `coerce: (v) => ...` | option | Transform the parsed value |
| `validate: (v) => ...` | option | Custom validation, returns `true` or error string |
| `env: 'NAME'` | option | Read from a specific environment variable |
| `.env()` | CLI | Enable env-var support for every option |
| `.config(provider)` | CLI | Load values from JSON or `package.json` |
| `.conflicts('a', 'b')` | builder | Mutually exclusive options |
| `.implies('a', 'b')` | builder | `a` requires `b` |
| `.strict()` | CLI | Reject unrecognized arguments |
