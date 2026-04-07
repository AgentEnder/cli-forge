## Per-option environment variables

The simplest way to make a single option env-configurable is to add an `env`
key directly to its definition. No `.env()` call is required — the parser
reads from the named variable whenever the flag is absent on the command line.

<%= file('per-option-env.ts') %>

The exact string you provide becomes the environment variable name. No prefix
is applied, so `env: 'PORT'` reads from `PORT`, not `GREET_APP_PORT`. Options
that have no `env` key — like `--verbose` above — cannot be set from the
environment at all, which is useful for flags that should only be passed
explicitly by the caller.

## Global environment variable support

Calling `.env()` turns on environment variable support for every option in one
go. cli-forge converts the CLI name to `UPPER_SNAKE_CASE` and uses it as a
prefix, then appends the option name in the same format.

<%= file('with-global-env.ts') %>

With a CLI named `greet-app`, the auto-derived variable names are:

| Option | Environment variable |
|--------|----------------------|
| `--name` | `GREET_APP_NAME` |
| `--greeting` | `GREET_APP_GREETING` |

You can still override the key for a specific option by providing `env: 'MY_KEY'`
on that option, or opt a single option out of env support with `env: false`.
