---
title: Validation and Constraints
description: Validate input with choices, conflicts, implications, strict mode, and custom validators
nav:
  order: 6
---

# Validation and constraints

CLI Forge validates arguments after parsing, catching invalid input before your handler runs. You can restrict values with choices, enforce relationships between options, reject unknown flags, and write custom validation logic.

## Limiting values with choices

Use the `choices` property to restrict an option to a set of allowed values. If the user provides a value outside this set, CLI Forge throws a validation error.

Pass a static array to narrow the TypeScript type to a union of allowed values:

<%= example('limit-choices').region('static-choices') %>

Choices can also be a function that returns an array, which is useful for values computed at runtime:

<%= example('limit-choices').region('dynamic-choices') %>

When you use a static array, TypeScript narrows the argument type automatically (e.g., `'sir' | 'madame'`). Choices are checked **after** `coerce`, so if you also use a coerce function, make sure it returns a value in the choices array.

## Conflicts and implications

Use `.conflicts()` and `.implies()` to enforce relationships between options:

<%= example('conflicts-and-implications').region('builder') %>

- **`.conflicts('a', 'b')`** — options `a` and `b` cannot both be provided. Useful for mutually exclusive modes like `--dry-run` and `--force`.
- **`.implies('a', 'b')`** — if option `a` is provided, option `b` must also be provided. Useful for options that only make sense together, like `--force` requiring `--backup`.

Both are checked during validation and produce clear error messages.

## Strict mode

By default, CLI Forge collects unrecognized arguments into an `unmatched` array without raising errors. Strict mode changes this behavior to throw a validation error for any unrecognized argument:

<%= example('strict-mode').region('cli') %>

### Non-strict mode (default)

Without strict mode, unknown arguments are silently collected. This is useful when your CLI wraps another tool and needs to pass arguments through:

<%= example('non-strict-mode').region('cli') %>

## Custom validation

For validation logic that goes beyond choices and conflicts, use the `validate` property on an option:

```typescript
cli('my-app')
  .option('port', {
    type: 'number',
    validate: (value) => {
      if (value < 1 || value > 65535) {
        return 'Port must be between 1 and 65535';
      }
      return true;
    },
  });
```

The `validate` function receives the parsed value and should return `true` for valid input or an error message string for invalid input. Custom validators run after type coercion and choices checks.

## Required options

Mark an option as required to ensure the user provides a value:

```typescript
cli('my-app')
  .option('name', {
    type: 'string',
    required: true,
  });
```

If a required option is not provided via CLI arguments, environment variables, or configuration files, CLI Forge throws a validation error.

## Validation order

CLI Forge runs validations in this order:

1. **Type coercion** — convert raw strings to the declared type
2. **Defaults** — apply default values for missing options
3. **Custom `coerce`** — run user-defined coerce functions
4. **Required** — check that required options have values
5. **Choices** — check values against allowed sets
6. **Custom `validate`** — run user-defined validation functions
7. **Conflicts** — check mutual exclusivity
8. **Implications** — check conditional requirements
9. **Strict unmatched check** — reject unknown arguments (if strict mode is enabled)

Understanding this order matters when combining validators. For example, a `coerce` function runs before `choices`, so the coerced value must match a choice — not the raw input.

## Quick reference

| Feature | Method/Property | Purpose |
|---|---|---|
| Allowed values | `choices: [...]` | Restrict to specific values |
| Mutual exclusion | `.conflicts('a', 'b')` | Prevent using both options |
| Conditional requirement | `.implies('a', 'b')` | Require `b` when `a` is set |
| Reject unknowns | `.strict()` | Error on unrecognized args |
| Custom logic | `validate: (v) => ...` | Arbitrary validation |
| Mandatory input | `required: true` | Ensure a value is provided |
