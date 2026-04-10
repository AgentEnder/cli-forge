## Boolean-or-string: the `--color` pattern

The most common use case for `oneOf` is a flag that toggles a feature on/off
but also accepts specific modes. Think `git --color`, `ls --color`, or
`webpack --devtool`.

<%= file('color-output.ts') %>

The `valueTypes` array lists the types the flag can accept. **Boolean is
always tried last**, regardless of where it appears in the array, but it has
exclusive claim on three patterns:

| Input | Result | Why |
|-------|--------|-----|
| `--color` | `true` | Bare flag — only boolean can match with no value |
| `--no-color` | `false` | Negation prefix — boolean-only |
| `--color true` | `true` | Literal `true`/`false` — boolean claims these |
| `--color always` | `"always"` | Any other value — string parser wins |

When the string entry includes `choices`, only those values are accepted.
Passing `--color invalid` would fail validation because `"invalid"` is not
in `['auto', 'always', 'never']`.

## Number-or-string: priority ordering

For non-boolean types, **array order determines priority**. The first parser
that successfully handles the value wins. This is useful when a value could
be interpreted as multiple types.

<%= file('verbosity.ts') %>

Here `number` is listed before `string`, so `--verbose 3` parses as the
number `3`, not the string `"3"`. If the value is not numeric (like
`--verbose debug`), the number parser fails and the string parser takes over.

Without boolean in `valueTypes`, bare flags (`--verbose`) and negation
(`--no-verbose`) are errors — the option always requires an explicit value.

## Inside object properties

`oneOf` can be used as the type for an object property. This lets a single
dot-notation path accept values of different types. In this example, each
filter property accepts **either** a shorthand string (`--filter.prs ">5"`)
**or** structured sub-properties via dot-notation (`--filter.prs.min 1`).

<%= file('object-property.ts') %>

When the value is set directly (e.g. `--filter.prs ">5"`), the `oneOf`
parser tries each value type in order. The object parser fails on `">5"`
(not valid JSON), so the string parser takes over.

When dot-notation is used (e.g. `--filter.prs.min 1`), the object parser
recognizes the `oneOf` type and searches its `valueTypes` for an object
branch that has the requested sub-property.

| Input | Result |
|-------|--------|
| `--filter.prs ">5"` | `{ prs: ">5" }` — string branch wins |
| `--filter.prs.min 1` | `{ prs: { min: 1 } }` — object branch, dot-notation |
| `--filter.prs.min 1 --filter.prs.max 10` | `{ prs: { min: 1, max: 10 } }` |
| `--filter.prs ">5" --filter.stars.min 100` | `{ prs: ">5", stars: { min: 100 } }` — mixed |
