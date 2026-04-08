# `oneOf` Option Type Design

## Summary

A new `oneOf` option type that allows a single CLI flag to accept values of multiple types. This enables patterns like `--color` (boolean), `--no-color` (boolean), and `--color=always` (string) under one option.

## Motivation

Many CLI tools support flags that work as both boolean toggles and typed values. Examples:

- `gcc -O` / `gcc -O2` (boolean or number)
- `--color` / `--no-color` / `--color=always` (boolean or string)
- `--verbose` / `--verbose 3` (boolean or number)

Currently cli-forge requires choosing a single type per option, forcing workarounds like separate flags or string-only options with manual parsing.

## API Design

```typescript
.option('color', {
  type: 'oneOf',
  valueTypes: [
    { type: 'string', choices: ['auto', 'always', 'never'] as const },
    { type: 'boolean' },
  ],
  default: 'auto',
  description: 'Colorize output',
})
// Inferred type: 'auto' | 'always' | 'never' | boolean
```

## Property Placement

Properties are split between the top-level option config and per-value-type entries:

| Property | Top-level | Per-value-type |
|----------|-----------|----------------|
| `default` | Yes | |
| `alias` | Yes | |
| `env` | Yes | |
| `required` | Yes | |
| `hidden`, `group` | Yes | |
| `description` | Yes | Yes |
| `deprecated` | Yes | Yes |
| `choices` | | Yes |
| `coerce` | | Yes |
| `validate` | | Yes |

- **Top-level `description`**: describes the option as a whole.
- **Per-value-type `description`**: describes that specific type variant (used in help sub-lines).
- **Top-level `deprecated`**: deprecates the entire option.
- **Per-value-type `deprecated`**: deprecates just that variant.

## Value Type Config

Each entry in `valueTypes` is a subset of the corresponding option config:

```typescript
type OneOfValueTypeConfig =
  | Pick<StringOptionConfig, 'type' | 'choices' | 'coerce' | 'validate' | 'description' | 'deprecated'>
  | Pick<NumberOptionConfig, 'type' | 'choices' | 'coerce' | 'validate' | 'description' | 'deprecated'>
  | Pick<BooleanOptionConfig, 'type' | 'choices' | 'coerce' | 'validate' | 'description' | 'deprecated'>
  | Pick<ArrayOptionConfig, 'type' | 'choices' | 'coerce' | 'validate' | 'description' | 'deprecated'>;
```

## Parsing Resolution Rules

When parsing a `oneOf` option:

1. **Sort parsers**: non-boolean types maintain array order; boolean is always tried last.
2. **Special boolean cases** (checked first when boolean is in `valueTypes`):
   - Bare flag (`--color`) → `true`
   - Negation (`--no-color`) → `false`
   - Literal `true`/`false` after flag (`--color true`) → boolean
3. **General values**: try each non-boolean parser in array order; first successful parse wins.
4. **Matched type's `coerce`/`validate`/`choices`** run for the winning parser only.
5. **No match** → validation error.

### Examples

Given `valueTypes: [{ type: 'string' }, { type: 'boolean' }]`:

| Input | Result | Matched Type |
|-------|--------|-------------|
| `--color` | `true` | boolean |
| `--no-color` | `false` | boolean |
| `--color true` | `true` | boolean |
| `--color false` | `false` | boolean |
| `--color always` | `"always"` | string |
| `--color=always` | `"always"` | string |

Given `valueTypes: [{ type: 'number' }, { type: 'string' }]` (no boolean):

| Input | Result | Matched Type |
|-------|--------|-------------|
| `--port 3000` | `3000` | number |
| `--port auto` | `"auto"` | string |
| `--port` | error | none (no boolean type) |
| `--no-port` | error | none (no boolean type) |

## Type Inference

The inferred type is the union of all resolved types from each `valueTypes` entry:

```typescript
// Base types
oneOf [string, boolean]           → string | boolean
oneOf [number, boolean]           → number | boolean
oneOf [number, string]            → number | string

// With choices narrowing
oneOf [{ string, choices: ['a','b'] as const }, boolean]
                                  → 'a' | 'b' | boolean

// With coerce
oneOf [{ string, coerce: (v) => v.length }, boolean]
                                  → number | boolean
```

## Help Text

```
Options:
  --color    Colorize output [string|boolean] [default: "auto"]
               string: auto, always, never
               boolean: disable with --no-color
```

The type tag shows the union. Per-value-type descriptions and choices appear as sub-lines.

## Testing Plan

### Type Tests (`type-tests/`)
- Union type inference from `valueTypes`
- Choices narrowing within union
- Coerce return types feed into union
- Default type must be assignable to the union
- Mixed type combinations (string+boolean, number+string, number+boolean, all three)

### Unit Tests (`parser.spec.ts`)
- Priority ordering: non-boolean first, boolean last
- Bare flag: works with boolean in valueTypes, errors without
- `--no-flag`: works with boolean in valueTypes, errors without
- `true`/`false` literals: claimed by boolean when present
- Per-value-type `choices`, `coerce`, `validate` applied to matched type
- Error: bare flag without boolean, no parser matches value

### E2E Example
- Runnable example demonstrating `--color` pattern with assertions
