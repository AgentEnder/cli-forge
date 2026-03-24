# Prompt Layer Design

## Overview

Add an interactive prompting layer to `cli-forge` that fulfills missing option values by prompting the user. The prompting system is provider-based, allowing users to plug in any prompt library (clack, inquirer, readline, etc.).

## Option-Level Configuration

A new `prompt` property is added to option configs **in the CLI layer only** (not the parser):

```typescript
type PromptConfig = boolean | string;
prompt?: PromptConfig | ((args: Partial<TArgs>) => PromptConfig | null | undefined);
```

**Static values:**

| Value | Behavior |
|-------|----------|
| `undefined` (not specified) | Prompt only if the option is required (via `required` or `implies`) and a provider is registered |
| `true` | Always prompt for this option |
| `"What is your name?"` | Always prompt, using this string as the label |
| `false` | Never prompt, even if required and missing |

**Function values:**

The function receives the accumulated args (as `Partial<TArgs>`) at prompt-collection time, enabling conditional prompting based on other option values:

```typescript
.option('apiKey', {
  type: 'string',
  prompt: (args) => args.authFile ? false : 'Enter your API key'
})
```

In the callback, `null` and `undefined` returns are treated as falsy (don't prompt). This differs from the static case where `undefined` (not specified) means "prompt if required" — when a callback is provided, the user has explicitly opted into controlling the behavior.

When an option has a `default` value and prompting is triggered, the default is passed to the provider for use as placeholder/pre-filled text.

### Type Integration

The CLI layer's `option()` overloads accept an extended config type that adds `prompt`:

```typescript
type PromptConfig = boolean | string;

type CLIOptionConfig<T extends OptionConfig, TArgs> = T & {
  prompt?: PromptConfig | ((args: Partial<TArgs>) => PromptConfig | null | undefined);
};
```

The `prompt` property is stripped before delegating to the parser's `option()` method, since the parser doesn't know about it. It is stored separately on the CLI for use during `forge()`.

## Prompt Provider Interface

```typescript
interface PromptOption {
  name: string;
  config: InternalOptionConfig & { prompt?: PromptConfig };
}

interface PromptProvider {
  /** If provided, this provider only handles options where filter returns true */
  filter?: (name: string, config: InternalOptionConfig) => boolean;
  /** Prompt for a single option */
  prompt?: (option: PromptOption) => Promise<unknown>;
  /** Prompt for multiple options at once (preferred over prompt when available) */
  promptBatch?: (options: PromptOption[]) => Promise<Record<string, unknown>>;
}
```

A provider must have at least one of `prompt` or `promptBatch` (validated at registration time).

## Registration

```typescript
cli('app')
  .withPromptProvider(provider1)  // filtered provider
  .withPromptProvider(provider2)  // fallback provider (no filter)
  .forge();
```

Multiple `.withPromptProvider()` calls register providers in order. The method returns `this` for chaining (no type parameter changes needed).

## Resolution Algorithm

During `forge()`, after the discovery loop completes and before the final strict parse:

1. **Collect promptable options** — scan all configured options:
   - If `prompt` is a function, call it with accumulated args to resolve the value
   - Resolved `prompt === false` (or callback returned `null`/`undefined`) → skip
   - Resolved `prompt === true` or `prompt` is a string → include
   - `prompt` was not specified (`undefined` on the option, not from a callback) → include only if `required` is true (or implied by another set option) AND the option has no value in the accumulated args

2. **Match options to providers** — for each promptable option:
   - Iterate registered providers **with filters** (in registration order)
   - Use the first provider whose `filter(name, config)` returns `true`
   - If no filtered provider matches, use the first registered provider **without a filter**
   - If no provider matches at all → throw error

3. **Group options by matched provider**

4. **Execute prompts** — for each provider with matched options:
   - If provider has `promptBatch` → call once with all matched options
   - Else → call `prompt` for each option individually, collect results

5. **Inject values** — merge prompted values into accumulated args

6. **Proceed to final strict parse** — validation runs with prompted values included

## Lifecycle Position

```
Discovery loop completes
  ↓
Collect promptable options
  ↓
Match to providers + execute prompts
  ↓
Inject prompted values into accumulated args
  ↓
Final strict parse (validate: true)
  ↓
Help/version check
  ↓
Handler execution
```

## Clack Provider

Exported from `cli-forge/prompt-providers/clack`:

```typescript
import { createClackPromptProvider } from 'cli-forge/prompt-providers/clack';

cli('app')
  .withPromptProvider(createClackPromptProvider())
  .forge();
```

### Option Type Mapping

| Option Type | Clack Prompt |
|-------------|-------------|
| `string` | `text()` |
| `number` | `text()` with numeric validation |
| `boolean` | `confirm()` |
| `string` with `choices` | `select()` |
| `number` with `choices` | `select()` |
| `array` | `multiselect()` if choices, otherwise `text()` with comma separation |

### Label Resolution

Priority: `prompt` string > `description` > option `name`

### Default Handling

If the option has a `default` value, it is passed as `initialValue` / `defaultValue` to the clack prompt.

## Package Configuration

### New Entry Point

Add to `cli-forge/package.json` exports:

```json
{
  "exports": {
    "./prompt-providers/clack": {
      "require": "./dist/prompt-providers/clack.js",
      "types": "./dist/prompt-providers/clack.d.ts"
    }
  }
}
```

### New Optional Peer Dependency

```json
{
  "peerDependencies": {
    "@clack/prompts": "catalog:"
  },
  "peerDependenciesMeta": {
    "@clack/prompts": {
      "optional": true
    }
  }
}
```

## Error Cases

| Scenario | Behavior |
|----------|----------|
| Option needs prompting, no provider matches | Throw: "Option 'name' requires prompting but no prompt provider is available" |
| Provider missing both `prompt` and `promptBatch` | Throw at registration: "Prompt provider must implement at least one of 'prompt' or 'promptBatch'" |
| Provider's `prompt`/`promptBatch` rejects | Error propagates to `forge()` error handlers |
| User cancels prompt (e.g. Ctrl+C) | Provider is responsible for throwing; error propagates |

## Non-Goals

- The parser (`@cli-forge/parser`) is not modified — prompting is a CLI-layer concern
- No built-in readline provider (users can trivially write one)
- No interactive validation loop (prompt once, then validate via normal parse)
