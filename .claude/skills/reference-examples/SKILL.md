---
name: reference-examples
description: Guide for referencing and embedding example code snippets in documentation. Use when writing guide docs that need to show code from examples, when linking to examples from guides, or when creating content.md files for multi-file examples. Trigger on work in docs-site/docs/guides/ or examples/*/content.md.
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
---

# Referencing examples in documentation

CLI Forge has two places where you can write prose alongside example code: **guide docs** (`docs-site/docs/guides/*.md`) and **example prose** (`examples/*/content.md`). Both support Eta template syntax for embedding example code.

## Template syntax

Both `content.md` and guide docs support Eta templates (`<%= %>`) that are expanded during the docs build.

### In guide docs (`docs/guides/*.md`)

Guides can reference any example by ID:

```markdown
## Middleware

Add middleware to transform args before handlers run:

<%= example('middleware').file('middleware.ts') %>

For more patterns, see the [composition example](/examples/middleware-composition).
```

Available helpers in guides:

- **`<%= example('id').file('path') %>`** — embed a file from a named example as a fenced code block
- **`<%= example('id').region('regionName') %>`** — embed a marked region from a named example

### In example prose (`content.md`)

`content.md` files are scoped to their example and use simpler helpers:

```markdown
## Common options

<%= file('builders/common.ts') %>

## Build command

<%= region('commands/build.ts', 'handler') %>
```

Available helpers in content.md:
- **`<%= file('path/to/file') %>`** — embed a file from the current example
- **`<%= region('path/to/file', 'regionName') %>`** — embed a marked region from the current example

### Region markers

Mark regions in source files to extract specific sections:

```typescript
// #region setup
import { cli } from 'cli-forge';

const app = cli('my-app');
// #endregion setup

// #region handler
app.command('run', {
  handler: (args) => { /* ... */ },
});
// #endregion handler
```

## When to use each approach

### Guide docs with example references

Best for **conceptual tutorials** that teach ideas with code support:

```markdown
## Adding options

Options let you accept flags like `--verbose` or `--port 3000`:

<%= example('basic-cli').region('options') %>

CLI Forge supports string, number, boolean, array, and object option types.
```

Advantages:
- Narrative-first — the prose drives the page, code supports it
- Code stays tested — examples have E2E assertions, so referenced code is always valid
- No duplication — reference the same example from multiple guides

### content.md (example-level prose)

Best for **code walkthroughs** of a specific pattern:

```markdown
## Composable builders

Start by defining reusable option builders:

<%= file('builders/common.ts') %>

Then compose them in commands:

<%= file('commands/build.ts') %>
```

Advantages:
- Code-first — rendered alongside the interactive file explorer
- Scoped — helpers reference files within the example directory
- Self-contained — the example page has everything needed to understand the pattern

### Inline code in guides

Best for **minimal snippets** that illustrate a concept:

```markdown
To add middleware:

\`\`\`typescript
cli('my-app')
  .middleware((args) => {
    console.log('Before command runs');
    return args;
  });
\`\`\`
```

Use this when:
- The snippet is small and doesn't need to be tested
- You're showing a concept, not a complete working example
- No existing example covers this specific point

## Best practices

1. **Prefer example references over inline code** — referenced code is tested, inline code can drift
2. **Don't duplicate example code** — if an example exists, reference it with `<%= example('id').file('path') %>`
3. **Link to example pages for exploration** — after embedding key snippets, link to the full example page
4. **Keep guide narrative focused** — embed only the code that supports the point being made, not entire files

## Choosing where to put content

| Content type | Where | Why |
|---|---|---|
| Conceptual tutorial (quick start, how-to) | `docs/guides/*.md` with `<%= example() %>` refs | Narrative-first, code is tested |
| Code walkthrough of a pattern | `examples/*/content.md` | Code-first, with interactive file explorer |
| API reference | Auto-generated (`docs/cli/`) | Generated from source, always up to date |
| Self-explanatory demo | `examples/*.ts` (single-file) | Code speaks for itself, description field is enough |
