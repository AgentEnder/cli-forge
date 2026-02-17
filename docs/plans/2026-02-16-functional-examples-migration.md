# Functional-Examples Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace custom example handling (collection, testing, docs) with published functional-examples npm packages.

**Architecture:** CLI-first for testing (functional-examples test command), API-first for docs (scanExamples + region utilities). Single-pass migration of all examples to new metadata schema.

**Tech Stack:** functional-examples, @functional-examples/test, @functional-examples/javascript, @functional-examples/yaml-manifest, @functional-examples/documentation

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`
- Create: `pnpm-lock.yaml` (auto-updated)

**Step 1: Add functional-examples dependencies**

Add to package.json dependencies:

```bash
pnpm add functional-examples @functional-examples/javascript @functional-examples/yaml-manifest @functional-examples/test @functional-examples/documentation
```

**Step 2: Verify installation**

Run: `pnpm list | grep functional-examples`

Expected output should show all 5 packages installed.

**Step 3: Commit dependencies**

```bash
git add package.json pnpm-lock.yaml
git commit -m "build: add functional-examples dependencies"
```

---

## Task 2: Create Configuration File

**Files:**
- Create: `functional-examples.config.ts`

**Step 1: Create config file**

```typescript
import { createJavaScriptExtractor } from '@functional-examples/javascript';
import { createYamlManifestExtractor } from '@functional-examples/yaml-manifest';
import { createTestPlugin } from '@functional-examples/test';
import type { Config } from 'functional-examples';

const config: Config = {
  root: './examples',
  extractors: [
    createJavaScriptExtractor(),
    createYamlManifestExtractor(),
  ],
  plugins: [
    createTestPlugin({
      runtime: 'tsx',
      tsconfig: './examples/tsconfig.json',
    }),
  ],
};

export default config;
```

**Step 2: Verify config loads**

Run: `npx functional-examples scan`

Expected: Should scan examples/ and report found examples (may fail on metadata validation, that's ok for now)

**Step 3: Commit config**

```bash
git add functional-examples.config.ts
git commit -m "feat: add functional-examples configuration"
```

---

## Task 3: Migrate Single Example (basic-cli.ts) as Test Case

**Files:**
- Modify: `examples/basic-cli.ts:1-9`

**Step 1: Read current example metadata**

File: `examples/basic-cli.ts`

Current frontmatter (lines 1-9):
```yaml
// ---
// id: basic-cli
// title: Basic CLI
// description: |
//   This is a simple example that demonstrates how to create a basic CLI using cli-forge
// commands:
//  - '{filename} hello --name sir'
//  - '{filename} goodbye --name madame'
// ---
```

**Step 2: Migrate to new schema**

Replace frontmatter with:

```yaml
// ---
// id: basic-cli
// title: Basic CLI
// description: |
//   This is a simple example that demonstrates how to create a basic CLI using cli-forge
// test:
//   commands:
//     - command: 'tsx --no-cache --tsconfig {tsconfig} {entryPoint} hello --name sir'
//       assertions:
//         - contains: 'Hello, sir!'
//     - command: 'tsx --no-cache --tsconfig {tsconfig} {entryPoint} goodbye --name madame'
//       assertions:
//         - contains: 'Goodbye, madame'
// ---
```

**Step 3: Test single example**

Run: `npx functional-examples test --filter basic-cli`

Expected: ✅ basic-cli tests pass

**Step 4: Commit migrated example**

```bash
git add examples/basic-cli.ts
git commit -m "feat: migrate basic-cli example to functional-examples schema"
```

---

## Task 4: Migrate Remaining Single-File Examples

**Files:**
- Modify: `examples/middleware.ts`
- Modify: `examples/arguments-of.ts`
- Modify: `examples/choices.ts`
- Modify: `examples/composable-options.ts`
- Modify: `examples/localization.ts`
- Modify: `examples/default-values.ts`
- Modify: `examples/interactive-subshell.ts`
- Modify: `examples/parser-only.ts`
- Modify: `examples/test-harness.ts`
- Modify: `examples/conflicts-and-implications.ts`
- Modify: `examples/option-groups.ts`
- Modify: `examples/env.ts`
- Modify: `examples/zod.ts`
- Modify: `examples/object-dot-notation-simple.ts`
- Modify: `examples/sdk.ts`
- Modify: `examples/strict-mode.ts`
- Modify: `examples/non-strict-mode.ts`
- Modify: `examples/i18next-integration.ts`
- Modify: `examples/orchestrated-workflow.ts`
- Modify: `examples/execution-lifecycle.ts`

**Step 1: For each file, migrate frontmatter**

Pattern:
1. Read current `commands` array
2. Move under `test.commands`
3. Wrap each command string as `{ command, assertions }`
4. Change `{filename}` → `tsx --no-cache --tsconfig {tsconfig} {entryPoint}`
5. Add appropriate `contains` assertions

**Step 2: Test each example after migration**

Run after each: `npx functional-examples test --filter <example-id>`

**Step 3: Commit batch**

```bash
git add examples/*.ts
git commit -m "feat: migrate single-file examples to functional-examples schema"
```

---

## Task 5: Migrate Multi-File Examples (meta.yml)

**Files:**
- Modify: `examples/composable-builders/meta.yml`
- Modify: `examples/configuration-files/meta.yml`
- Modify: `examples/zod-validation/meta.yml`
- Modify: `examples/middleware-composition/meta.yml`
- Modify: `examples/object-arguments/meta.yml`
- Modify: `examples/circular-config-detection/meta.yml`
- Modify: `examples/multi-command-cli/meta.yml`

**Step 1: Migrate each meta.yml**

Pattern for each file:

Before:
```yaml
id: example-name
title: Example Title
entryPoint: ./cli.ts
commands:
  - '{filename} command'
```

After:
```yaml
id: example-name
title: Example Title
entryPoint: ./cli.ts
test:
  commands:
    - command: 'tsx --no-cache --tsconfig {tsconfig} {entryPoint} command'
      assertions:
        - contains: 'expected output'
```

**Step 2: Test each multi-file example**

Run: `npx functional-examples test --filter <example-id>`

**Step 3: Commit meta.yml migrations**

```bash
git add examples/*/meta.yml
git commit -m "feat: migrate multi-file example metadata to functional-examples schema"
```

---

## Task 6: Verify All Examples Pass Tests

**Files:**
- None (verification step)

**Step 1: Run full test suite**

Run: `npx functional-examples test`

Expected: All examples should pass ✅

**Step 2: Fix any failing examples**

If any fail:
1. Check assertion matches actual output
2. Adjust `contains` assertion
3. Re-run test for that example
4. Commit fix

**Step 3: Document test results**

Run: `npx functional-examples test > /tmp/test-results.txt`

Review output to confirm all ✅

---

## Task 7: Update E2E NX Target

**Files:**
- Modify: `e2e/project.json:16-19`

**Step 1: Update e2e:examples target**

Replace lines 16-19:

Before:
```json
"e2e:examples": {
  "command": "tsx {projectRoot}/run-examples.ts",
  "dependsOn": ["^build"]
}
```

After:
```json
"e2e:examples": {
  "command": "functional-examples test",
  "dependsOn": ["^build"]
}
```

**Step 2: Test NX target**

Run: `nx run e2e:e2e:examples`

Expected: All examples pass via NX

**Step 3: Commit NX config**

```bash
git add e2e/project.json
git commit -m "feat: update e2e:examples to use functional-examples CLI"
```

---

## Task 8: Rewrite Docusaurus Plugin - Part 1 (Scanning)

**Files:**
- Modify: `docs-site/src/plugins/examples-plugin.ts:1-35`

**Step 1: Update imports**

Replace lines 1-28 with:

```typescript
import { LoadContext, Plugin } from '@docusaurus/types';
import { workspaceRoot } from '@nx/devkit';
import { sync as glob } from 'fast-glob';
import {
  blockQuote,
  codeBlock,
  h1,
  h2,
  h3,
  lines,
  link,
  ul,
} from 'markdown-factory';
import MonacoEditorWebpackPlugin from 'monaco-editor-webpack-plugin';
import { compressToEncodedURIComponent } from 'lz-string';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { stringify } from 'yaml';

// NEW: functional-examples imports
import { resolveConfig, scanExamples } from 'functional-examples';
import type { Example } from 'functional-examples';
```

**Step 2: Replace collectExamples with scanExamples**

Replace lines 30-35 with:

```typescript
export const ExamplesDocsPlugin = async (
  context: LoadContext
): Promise<Plugin> => {
  const examplesRoot = join(workspaceRoot, 'examples') + sep;

  // Use functional-examples scanner
  const config = await resolveConfig({
    root: join(workspaceRoot, 'examples')
  });
  const { examples } = await scanExamples(config);

  const visibleExamples = examples.filter((e) => !e.metadata.hidden);
```

**Step 3: Verify plugin compiles**

Run: `nx build docs-site --skip-nx-cache`

Expected: Build may fail on type errors (we'll fix in next task), but imports should resolve

**Step 4: Commit scanning changes**

```bash
git add docs-site/src/plugins/examples-plugin.ts
git commit -m "feat(docs): replace collectExamples with scanExamples"
```

---

## Task 9: Rewrite Docusaurus Plugin - Part 2 (Type Mapping)

**Files:**
- Modify: `docs-site/src/plugins/examples-plugin.ts:38-60`

**Step 1: Update example processing loop**

The `Example` type from functional-examples differs from the old custom type. Update the loop starting around line 38:

Before pattern:
```typescript
for (const example of visibleExamples) {
  const relative = (
    example.files.length > 1 || example.multifile
      ? dirname(example.files[0].path)
      : example.files[0].path
  ).replace(examplesRoot, '');
```

After pattern:
```typescript
for (const example of visibleExamples) {
  // functional-examples Example type:
  // { id, title, description, metadata, files: Array<{path, content}> }
  const entryFile = example.files[0];
  const isMultiFile = example.files.length > 1;

  const relative = (
    isMultiFile ? dirname(entryFile.path) : entryFile.path
  ).replace(examplesRoot, '');
```

**Step 2: Update metadata access**

Change all `example.data.` to `example.metadata.` and `example.` where appropriate:

- `example.data.id` → `example.id`
- `example.data.title` → `example.title`
- `example.data.description` → `example.description`
- `example.data.hidden` → `example.metadata.hidden`
- `example.data.commands` → `example.metadata.test?.commands`
- `example.data.entryPoint` → `example.metadata.entryPoint`
- `example.data.fileMap` → `example.metadata.fileMap`

**Step 3: Update file iteration**

Change:
```typescript
example.files.forEach(({ path, contents }) => ...)
```

To:
```typescript
example.files.forEach(({ path, content }) => ...)
```

(Note: `contents` → `content` without the 's')

**Step 4: Verify plugin compiles**

Run: `nx build docs-site --skip-nx-cache`

Expected: Should compile without type errors

**Step 5: Commit type mapping**

```bash
git add docs-site/src/plugins/examples-plugin.ts
git commit -m "feat(docs): update plugin to use functional-examples types"
```

---

## Task 10: Rewrite Docusaurus Plugin - Part 3 (Content Processing)

**Files:**
- Modify: `docs-site/src/plugins/examples-plugin.ts:140-175`

**Step 2: Update formatExampleMd function**

Around line 177, update the function signature and content processing:

Before:
```typescript
function formatExampleMd({ files, data, content }: Example): string {
```

After:
```typescript
function formatExampleMd(example: Example): string {
  const { files, id, title, description, metadata } = example;
  const content = metadata.content;
```

**Step 3: Update frontmatter generation**

Change:
```typescript
const frontmatter = `---
${stringify({
  id: data.id,
  title: data.title,
  description: data.description,
})}hide_title: true
---`;
```

To:
```typescript
const frontmatter = `---
${stringify({
  id,
  title,
  description,
})}hide_title: true
---`;
```

**Step 4: Update command processing**

Around line 199-222, update commands array access:

Before:
```typescript
const usageSection = data.commands.length
  ? h2(
      'Usage',
      ...data.commands.map((config) => {
```

After:
```typescript
const commands = metadata.test?.commands || [];
const usageSection = commands.length
  ? h2(
      'Usage',
      ...commands.map((config) => {
        // config is already { command, assertions } structure
        const { command, title, description } = config;
```

**Step 5: Update getEntryPoint function**

Around line 118-124:

Before:
```typescript
function getEntryPoint(example: Example) {
  return example.files.find((file) => file.path === example.data.entryPoint);
}
```

After:
```typescript
function getEntryPoint(example: Example) {
  return example.files.find((file) =>
    file.path === example.metadata.entryPoint
  );
}
```

**Step 6: Update formatCodeBlock calls**

Change all:
```typescript
formatCodeBlock(path, contents, data.fileMap, data.title)
```

To:
```typescript
formatCodeBlock(path, content, metadata.fileMap || {}, title)
```

**Step 7: Verify build works**

Run: `nx build docs-site --skip-nx-cache`

Expected: Docs should build successfully

**Step 8: Commit content processing**

```bash
git add docs-site/src/plugins/examples-plugin.ts
git commit -m "feat(docs): update content processing for functional-examples"
```

---

## Task 11: Delete Old Collection Script

**Files:**
- Delete: `tools/scripts/collect-examples.ts`

**Step 1: Verify script is no longer referenced**

Run: `grep -r "collect-examples" --exclude-dir=node_modules --exclude-dir=.git .`

Expected: Should only find references in old commit messages or this plan

**Step 2: Delete file**

```bash
git rm tools/scripts/collect-examples.ts
```

**Step 3: Commit deletion**

```bash
git commit -m "refactor: remove custom collect-examples script"
```

---

## Task 12: Delete Old E2E Test Runner

**Files:**
- Delete: `e2e/run-examples.ts`

**Step 1: Verify e2e:examples target is updated**

Check `e2e/project.json` uses `functional-examples test` (should be done in Task 7)

**Step 2: Delete file**

```bash
git rm e2e/run-examples.ts
```

**Step 3: Commit deletion**

```bash
git commit -m "refactor: remove custom e2e test runner"
```

---

## Task 13: Clean Up Unused Imports

**Files:**
- Modify: `docs-site/src/plugins/examples-plugin.ts` (if needed)
- Modify: `tools/scripts/` (check for other scripts importing collect-examples)

**Step 1: Check for dead imports**

Run ESLint or check manually for unused imports in the Docusaurus plugin

**Step 2: Remove any references to old types**

Delete any custom `Example`, `FrontMatter`, `CommandConfiguration` type definitions if they exist

**Step 3: Verify build**

Run: `nx build docs-site --skip-nx-cache`

**Step 4: Commit cleanup**

```bash
git add docs-site/src/plugins/examples-plugin.ts
git commit -m "refactor: remove unused custom types and imports"
```

---

## Task 14: Full Integration Test

**Files:**
- None (verification)

**Step 1: Clean build docs**

```bash
nx reset
nx build docs-site
```

Expected: Build succeeds, docs generated in `docs-site/dist/`

**Step 2: Verify example pages**

Check that example markdown files exist:
```bash
ls docs-site/docs/examples/basic-cli.md
ls docs-site/docs/examples/multi-command-cli.md
```

Expected: Files exist with proper frontmatter and content

**Step 3: Run full e2e test suite**

```bash
nx run e2e:e2e:examples
```

Expected: All examples pass ✅

**Step 4: Run type tests**

```bash
nx test type-tests
```

Expected: All type tests pass

**Step 5: Run full test suite**

```bash
nx run-many -t test
```

Expected: All tests pass

---

## Task 15: Verify Playground Still Works

**Files:**
- None (verification)

**Step 1: Start docs dev server**

```bash
nx serve docs-site
```

**Step 2: Navigate to playground**

Visit: `http://localhost:3000/playground`

Expected: Monaco editor loads, examples dropdown populated

**Step 3: Test example loading**

Select "basic-cli" from dropdown

Expected: Code loads in editor, can run/modify

**Step 4: Test TypeScript Playground links**

Navigate to any example page (e.g., `/examples/basic-cli`)

Click "View on TypeScript Playground" link

Expected: Opens TypeScript playground with code pre-loaded (LZ-compressed)

**Step 5: Stop dev server**

Ctrl+C

---

## Task 16: Update CLAUDE.md (if needed)

**Files:**
- Modify: `CLAUDE.md` (if examples section exists)

**Step 1: Check for examples documentation**

Read `CLAUDE.md` for any references to old scripts

**Step 2: Update references**

If found, update to mention functional-examples:

```markdown
## Examples System

Examples are managed using `functional-examples`:
- Config: `functional-examples.config.ts`
- Test: `nx run e2e:e2e:examples` or `npx functional-examples test`
- Scan: `npx functional-examples scan`
```

**Step 3: Commit if changed**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for functional-examples"
```

---

## Task 17: Final Commit

**Files:**
- All changed files

**Step 1: Review all changes**

```bash
git status
git diff --staged
```

**Step 2: Ensure all tasks committed**

Verify commit history shows all tasks:

```bash
git log --oneline -20
```

Expected: ~15+ commits showing migration steps

**Step 3: Create summary commit (if needed)**

If any loose changes remain:

```bash
git add -A
git commit -m "feat: complete functional-examples migration

- Replace custom collection/test scripts with functional-examples
- Migrate all examples to new metadata schema
- Update Docusaurus plugin to use scanExamples API
- Delete old custom scripts

BREAKING CHANGE: Internal only - e2e test runner replaced with functional-examples CLI"
```

---

## Success Verification Checklist

Run these commands to verify successful migration:

```bash
# 1. All examples pass tests
nx run e2e:e2e:examples
# Expected: ✅ All examples pass

# 2. Docs build successfully
nx build docs-site
# Expected: Build succeeds

# 3. Type tests pass
nx test type-tests
# Expected: All type tests pass

# 4. Example pages generated
ls docs-site/docs/examples/ | wc -l
# Expected: ~20+ markdown files

# 5. Old scripts deleted
test -f tools/scripts/collect-examples.ts && echo "FAIL: Old script exists" || echo "PASS: Old script deleted"
test -f e2e/run-examples.ts && echo "FAIL: Old runner exists" || echo "PASS: Old runner deleted"

# 6. Config exists
test -f functional-examples.config.ts && echo "PASS: Config exists" || echo "FAIL: Config missing"

# 7. Dependencies installed
pnpm list | grep functional-examples | wc -l
# Expected: 5 packages
```

---

## Rollback Plan (If Needed)

If migration fails and rollback is needed:

```bash
# 1. Reset to pre-migration commit
git log --oneline | grep "build: add functional-examples dependencies"
# Note the commit hash BEFORE this commit
git reset --hard <commit-before-migration>

# 2. Clean dependencies
pnpm install

# 3. Rebuild
nx reset
nx run-many -t build
```
