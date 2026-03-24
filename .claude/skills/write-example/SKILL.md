---
name: write-example
description: Guide for writing, modifying, or understanding examples in the cli-forge repo. Use when creating new examples, adding test assertions, writing content.md prose, or understanding the example system. Trigger on work in examples/ directory.
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
---

# Writing examples

Examples in this repo serve **three purposes simultaneously**:

1. **Human-readable code samples** — developers browsing the repo understand how things work
2. **Docs-site pages** — rendered at `/examples/[slug]` with syntax highlighting and interactive file explorer
3. **E2E tests** — `functional-examples test` runs assertions defined in example metadata

Every example should be written with all three audiences in mind.

## Example formats

### Single-file examples (`examples/*.ts`)

Use YAML front-matter in comments at the top of the file:

```typescript
// ---
// id: my-example
// title: My Example
// description: |
//   Markdown description of what this example demonstrates.
//   Supports **bold**, `code`, lists, etc.
// test:
//   - name: "Test description"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json my-example.ts --flag value'
//     assertions:
//       stdout:
//         contains: 'expected output'
// ---
import { cli } from 'cli-forge';

// ... example code
```

Required fields: `id`, `title`, `description`.

### Multi-file examples (`examples/<name>/`)

Directory structure:

```
examples/my-example/
├── meta.yml       # Metadata, description, test assertions
├── content.md     # Optional: narrative prose with embedded file references
├── cli.ts         # Main entry point
└── ...            # Supporting files (builders, commands, configs, etc.)
```

**`meta.yml` format:**

```yaml
id: my-example
title: My Example
description: |
  Markdown description of what this example demonstrates.
test:
  - name: "Test description"
    options:
      command: 'npx tsx --no-cache --tsconfig ../tsconfig.json cli.ts --flag value'
    assertions:
      stdout:
        contains: 'expected output'
```

**`content.md` format** (optional — creates narrative prose on the example page):

```markdown
## Section heading

Explanation of what this code does.

<%= file('path/to/file.ts') %>

More explanation.

<%= region('path/to/file.ts', 'regionName') %>
```

Template helpers available in `content.md`:
- `<%= file('relative/path') %>` — embed entire file as a fenced code block
- `<%= region('relative/path', 'name') %>` — embed a marked region from a file

Region markers in source files:
```typescript
// #region regionName
const code = 'inside the region';
// #endregion regionName
```

## Test assertions

Tests are defined in the `test` array in metadata. The test runner (`functional-examples test`) executes
commands and checks assertions.

### Basic test

```yaml
test:
  - name: "Descriptive test name"
    options:
      command: 'npx tsx --no-cache --tsconfig ./tsconfig.json example.ts args'
    assertions:
      exitCode: 0
      stdout:
        contains: 'expected substring'
```

### Available assertion types

- `exitCode` — expected numeric exit code
- `stdout.contains` / `stderr.contains` — substring match
- `stdout.matches` / `stderr.matches` — regex match (use `.*` for flexible matching across output)

### Command conventions

- Always use `npx tsx --no-cache --tsconfig ./tsconfig.json` (single-file) or `--tsconfig ../tsconfig.json` (multi-file) to run examples
- Use `--no-cache` to avoid stale module caching in tests
- Commands run from the example's directory (the file's parent for single-file, the directory for multi-file)

## Visibility control

Hide an example from the `/examples/` gallery while keeping it as an E2E test:

```yaml
hidden: true
```

The example still runs in tests and can be referenced from content.md of other examples.

## Checklist: adding a new example

1. Decide format: **single-file** (self-contained demo) or **multi-file** (complex, multi-module example)
2. Create the file(s) with proper metadata (`id`, `title`, `description`)
3. Write the example code — it should be complete and runnable
4. Add test assertions that validate the example works correctly
5. For multi-file examples, consider adding `content.md` to provide narrative context
6. Run `npx functional-examples test` to verify assertions pass
7. Run `nx build docs-site` to verify the example renders correctly on the docs site

## Checklist: modifying an existing example

1. Read the example's metadata (`meta.yml` or YAML front-matter) to understand its current state
2. Check if any `content.md` references the files you're changing
3. Make your changes
4. Run `npx functional-examples test` to confirm assertions still pass
5. If you changed the description or content.md, rebuild docs to verify rendering
