# Type-Tests and Multi-File Examples Design

## Overview

Extend type-test coverage to match features demonstrated in examples, and add multi-file examples for complex features. Also enhance the examples plugin to support rich markdown with embedded file references.

## Plugin Enhancement

### Problem

Multi-file examples currently render all files sequentially at the bottom. No way to add context between files or explain how they relate.

### Solution

Add support for `content.md` in multi-file example directories. This file can contain `{{file:path}}` tags that get replaced with the corresponding code block.

**Tag syntax:** `{{file:relative/path.ts}}`

**Fallback:** When no content.md exists, use current behavior (description at top, all files below).

### Implementation

In `examples-plugin.ts`:

1. Check for `content.md` or `contentFile` in meta.yml
2. If found, parse markdown for `{{file:path}}` patterns
3. Replace each tag with the rendered code block for that file
4. If not found, use existing sequential rendering

## Multi-File Examples

### 1. middleware-composition/

Demonstrates middleware type composition with separate files.

**Files:**
- `meta.yml` - Metadata and test commands
- `content.md` - Rich documentation
- `cli.ts` - Main CLI
- `middleware/auth.ts` - Auth middleware adding `user`
- `middleware/timing.ts` - Timing middleware adding `startTime`
- `types.ts` - Shared types

### 2. composable-builders/

Demonstrates reusable option builders.

**Files:**
- `meta.yml`
- `content.md`
- `cli.ts` - Main CLI
- `builders/common.ts` - Shared options (verbose, config)
- `builders/output.ts` - Output format options
- `commands/build.ts` - Command using composed builders

### 3. multi-command-cli/

Demonstrates realistic CLI organization.

**Files:**
- `meta.yml`
- `content.md`
- `cli.ts` - Entry point
- `commands/serve.ts`
- `commands/build.ts`
- `commands/init.ts`

### 4. zod-validation/

Demonstrates Zod schema integration.

**Files:**
- `meta.yml`
- `content.md`
- `cli.ts` - CLI using zodMiddleware
- `schemas/config.ts` - Config schema
- `schemas/options.ts` - Option schemas

## Type-Tests

### 1. middleware-types.spec.ts

Tests middleware type transformation:
- Middleware adding properties to args
- Multiple middleware composing correctly
- Handler receiving accumulated type

**Fixtures:**
- `middleware-add-property.ts`
- `middleware-chain.ts`

### 2. composable-builders.spec.ts

Tests builder composition:
- `ArgumentsOf<T>` type extraction
- Generic `<T extends CLI>` preservation
- `chain()` type threading

**Fixtures:**
- `arguments-of-extraction.ts`
- `generic-builder-composition.ts`

### 3. choices-inference.spec.ts

Tests choice type narrowing:
- Static choices narrow to literal union
- No widening to string
- Dynamic choice functions

**Fixtures:**
- `choices-static.ts`
- `choices-dynamic.ts`

### 4. env-types.spec.ts

Tests environment variable types:
- Global `.env()` prefix
- Per-option env config
- Type preservation

**Fixtures:**
- `env-global.ts`
- `env-per-option.ts`

## Implementation Order

1. Plugin enhancement (unblocks rich examples)
2. Multi-file examples (demonstrates features)
3. Type-tests (validates inference)
