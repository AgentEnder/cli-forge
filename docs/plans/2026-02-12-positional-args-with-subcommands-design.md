# Positional Arguments with Subcommands

## Problem

When a command has both positional arguments and subcommands (e.g. `$0 [file] <lint|test>`), the parser greedily consumes non-flag tokens as positional arguments before the `unmatchedParser` callback can identify subcommands. This means `$0 lint` assigns `"lint"` to the `file` positional instead of dispatching to the `lint` subcommand.

## Root Cause

In `parser.ts`, the non-flag token handling checks `configuredPositionals[matchedPositionals]` first. If a positional config exists, the token is consumed immediately — `unmatchedParser` is never consulted.

```
non-flag token arrives
  → positional config exists? → consume as positional (GREEDY)
  → no positional config? → try unmatchedParser → push to unmatched
```

## Desired Behavior

Context-aware resolution: try subcommand lookup first, fall back to positional.

```
non-flag token arrives
  → unmatchedParser recognizes it? → handle as subcommand
  → positional config exists? → consume as positional
  → push to unmatched
```

## Test Scenarios

CLI shape: `app [file] <lint|test>`

| Invocation | Expected | Currently Works? |
|---|---|---|
| `app lint` | Runs lint, file=undefined | No |
| `app myfile lint` | file='myfile', runs lint | No |
| `app lint myfile` | Runs lint, myfile in lint's args | No |
| `app test --fix` | Runs test with --fix | No |
| `app myfile test --fix` | file='myfile', runs test with --fix | No |
| `app --verbose lint` | verbose=true, runs lint | Maybe |

## Implementation Approach

1. Add tests in `internal-cli.spec.ts` documenting current vs expected behavior
2. Fix parser token priority: consult `unmatchedParser` before positional matching
3. Verify all scenarios pass
