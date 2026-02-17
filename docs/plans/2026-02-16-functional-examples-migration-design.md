# Functional-Examples Migration Design

**Date:** 2026-02-16
**Status:** Approved
**Author:** AI Assistant

## Overview

This design describes the migration from custom example handling to the published `functional-examples` npm package. The goal is to replace custom collection, testing, and documentation scripts with the standard functional-examples library while maintaining all existing functionality.

## Motivation

Currently, cli-forge maintains custom scripts for:
- Example collection (`tools/scripts/collect-examples.ts`)
- E2E test execution (`e2e/run-examples.ts`)
- Documentation generation (`docs-site/src/plugins/examples-plugin.ts`)

These scripts duplicate functionality that now exists in the published `functional-examples` library. By migrating to functional-examples, we:
- Dogfood our own published library
- Reduce maintenance burden
- Gain access to improvements in functional-examples
- Follow a standard, documented API

## Architecture

### High-Level Structure

```
cli-forge/
├── functional-examples.config.ts   # Config for scanning & testing
├── examples/                        # Examples (updated metadata)
├── e2e/
│   └── (run-examples.ts deleted)   # Replaced by functional-examples CLI
├── docs-site/
│   └── src/plugins/
│       └── examples-plugin.ts      # Rewritten to use scanExamples() API
└── tools/scripts/
    └── (collect-examples.ts deleted) # Replaced by scanExamples()
```

### Dependency Flow

```
Testing:    nx target → functional-examples CLI → @functional-examples/test
Docs:       Docusaurus plugin → scanExamples() → region utilities → custom rendering
Examples:   YAML frontmatter/meta.yml → JavaScript extractor → unified Example type
```

### Integration Pattern

**CLI-First for Testing:** Use the functional-examples CLI directly for test execution. This is what it's designed for and requires zero custom test orchestration code.

**API-First for Docs:** Call `scanExamples()` directly from the Docusaurus plugin. Docs generation requires custom rendering (playground links, Monaco editor, etc.) that doesn't fit a generic template system.

## Dependencies & Configuration

### New Dependencies

```json
{
  "dependencies": {
    "functional-examples": "^0.x.x",
    "@functional-examples/javascript": "^0.x.x",
    "@functional-examples/yaml-manifest": "^0.x.x",
    "@functional-examples/test": "^0.x.x",
    "@functional-examples/documentation": "^0.x.x"
  }
}
```

All packages will use published npm versions (not workspace protocol).

### Configuration File

Create `functional-examples.config.ts` at the repository root:

```typescript
import { createJavaScriptExtractor } from '@functional-examples/javascript';
import { createYamlManifestExtractor } from '@functional-examples/yaml-manifest';
import { createTestPlugin } from '@functional-examples/test';
import type { Config } from 'functional-examples';

const config: Config = {
  // Scan examples directory
  root: './examples',

  // Extractors for metadata
  extractors: [
    createJavaScriptExtractor(), // YAML frontmatter in .ts files
    createYamlManifestExtractor(), // meta.yml in directories
  ],

  // Test plugin for e2e execution
  plugins: [
    createTestPlugin({
      runtime: 'tsx',
      tsconfig: './examples/tsconfig.json',
    }),
  ],
};

export default config;
```

### NX Target Update

Update `e2e/project.json`:

```json
{
  "targets": {
    "e2e:examples": {
      "command": "functional-examples test"
    }
  }
}
```

## Testing Integration

### What Gets Deleted

- `e2e/run-examples.ts` (entire file, ~180 lines)
- Custom command execution logic
- Custom assertion checking
- Custom TypeScript compilation check in test runner

### Replacement Behavior

The `@functional-examples/test` plugin handles all test execution. Examples define test commands in their metadata:

```typescript
// examples/basic-cli.ts
// ---
// id: basic-cli
// title: Basic CLI
// test:
//   commands:
//     - command: '{entryPoint} hello --name sir'
//       assertions:
//         - contains: 'Hello, sir!'
//     - command: '{entryPoint} goodbye --name madame'
//       exitCode: 0
// ---
```

### Execution Flow

1. `nx run e2e:e2e:examples` calls `functional-examples test`
2. functional-examples CLI loads `functional-examples.config.ts`
3. Scanner discovers all examples with test metadata
4. Test plugin executes commands via tsx
5. Assertions are validated (contains, exitCode, etc.)
6. Results reported with ✅/❌ output

### Type Checking

TypeScript type-checking of examples remains handled by existing `examples:build` target. This is separate from functional test execution.

## Documentation Integration

### Docusaurus Plugin Rewrite

The `docs-site/src/plugins/examples-plugin.ts` gets rewritten to use functional-examples APIs.

#### Core Scanning

Replace custom `collectExamples()` with functional-examples scanner:

```typescript
import { resolveConfig, scanExamples } from 'functional-examples';
import { getRegionContent, getFileContent } from '@functional-examples/documentation';

export const ExamplesDocsPlugin = async (context: LoadContext): Promise<Plugin> => {
  // Use functional-examples scanner
  const config = await resolveConfig({ root: join(workspaceRoot, 'examples') });
  const { examples } = await scanExamples(config);

  // Filter visible examples
  const visibleExamples = examples.filter(e => !e.metadata.hidden);

  // Generate docs as before
  for (const example of visibleExamples) {
    // ... generate markdown
  }
};
```

#### Region/File Expansion

Replace custom `{{file:path}}` regex processing with functional-examples utilities:

```typescript
import { getFileContent } from '@functional-examples/documentation';

async function expandFileTags(content: string, example: Example) {
  return content.replace(/\{\{file:([^}]+)\}\}/g, (match, path) => {
    const fileContent = getFileContent(example, path);
    return formatCodeBlock(fileContent, path);
  });
}
```

#### What Stays Custom

- Playground route generation with Monaco editor
- LZ-string compression for TypeScript Playground links
- Markdown formatting (frontmatter, headings, code blocks)
- Webpack config for Monaco editor integration

#### Expected Code Reduction

The plugin should shrink from ~355 lines to ~150 lines by delegating scanning and content processing to functional-examples.

## Example Schema & Migration

### Metadata Changes

Current examples use a flat structure. We'll migrate to functional-examples standard fields.

**Before:**
```typescript
// ---
// id: basic-cli
// title: Basic CLI
// description: A simple example
// commands:
//   - '{filename} hello --name sir'
// ---
```

**After:**
```typescript
// ---
// id: basic-cli
// title: Basic CLI
// description: A simple example
// test:
//   commands:
//     - command: '{entryPoint} hello --name sir'
//       assertions:
//         - contains: 'Hello, sir!'
// ---
```

### Standard Fields

From functional-examples:
- `id`, `title`, `description` — unchanged
- `test` — new namespace for test commands (from @functional-examples/test)
- `hidden` — already supported

### No Custom Extensions Needed

Playground links and LZ compression happen automatically in the Docusaurus plugin. No metadata needed.

### Migration Tasks

For all ~20+ examples:

1. **Restructure commands:**
   ```yaml
   # Before
   commands:
     - '{filename} hello'

   # After
   test:
     commands:
       - command: '{entryPoint} hello'
         assertions:
           - contains: 'expected output'
   ```

2. **Update placeholders:**
   - `{filename}` → `{entryPoint}`

3. **Add assertions:**
   - Extract expected output from current assertion logic
   - Add as `assertions` array in command config

### Multi-File Examples

Directory-based examples use `meta.yml`:

```yaml
id: multi-command-cli
title: Multi-Command CLI
entryPoint: ./cli.ts
fileMap:
  './cli.ts': 'cli.ts'
test:
  commands:
    - command: '{entryPoint} build'
      assertions:
        - contains: 'Build complete'
```

All examples migrated in one pass (no gradual migration).

## Build & Development Workflow

### Build Process Changes

**Docs build** (`nx build docs-site`):
```
Before: Docusaurus plugin → collect-examples.ts → examples array → generate docs
After:  Docusaurus plugin → scanExamples() → examples array → generate docs
```

**E2E tests** (`nx run e2e:e2e:examples`):
```
Before: Node script → tsx execution → custom assertions
After:  functional-examples CLI → test plugin → built-in assertions
```

### Development Commands

```bash
# Test examples (new implementation, same command)
nx run e2e:e2e:examples

# Alternative: direct CLI call
npx functional-examples test

# Build docs (same command, new implementation)
nx build docs-site

# Type-check examples (unchanged)
nx test type-tests
```

### Performance Expectations

- **Scanning:** Similar speed (both traverse filesystem once)
- **Testing:** Comparable (both use tsx for execution)
- **Docs build:** Potentially faster (less custom processing)

### Breaking Changes

**None for consumers:**
- Documentation URLs stay the same
- Playground links stay the same
- Generated docs format unchanged

**Internal only:**
- Developers run same `nx` commands
- Different implementation under the hood

## Implementation Plan

1. **Install dependencies** — Add functional-examples packages
2. **Create config** — Add `functional-examples.config.ts`
3. **Migrate examples** — Update all example metadata (commands → test.commands)
4. **Rewrite Docusaurus plugin** — Use scanExamples() + region utilities
5. **Update NX target** — Point e2e:examples to functional-examples CLI
6. **Delete old code** — Remove `collect-examples.ts` and `run-examples.ts`
7. **Verify** — Run tests and build docs to confirm parity
8. **Commit** — Single atomic commit with all changes

## Success Criteria

- [ ] All examples pass `nx run e2e:e2e:examples`
- [ ] Docs build successfully with `nx build docs-site`
- [ ] Generated docs match previous format
- [ ] Playground links work correctly
- [ ] No custom collection/test scripts remain
- [ ] TypeScript compilation still validates examples

## References

- functional-examples repository: `../functional-examples`
- Current collection script: `tools/scripts/collect-examples.ts`
- Current test runner: `e2e/run-examples.ts`
- Current Docusaurus plugin: `docs-site/src/plugins/examples-plugin.ts`
