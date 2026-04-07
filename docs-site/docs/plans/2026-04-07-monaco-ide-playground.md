# Monaco IDE Playground Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the textarea-based playground with a Monaco IDE embed that supports multi-file examples, a file-explorer sidebar, a `.env` file for environment variables, and a bottom terminal panel.

**Architecture:** The playground page is rewritten as a fixed-height (`h-[650px]`) IDE chrome with three zones — a top bar, a center split (file sidebar + Monaco editor), and a bottom terminal (args input + output). All files including `.env` live in a `Map<path, content>` state; Monaco uses one model per file and swaps models on sidebar click. Type declarations for `cli-forge` and `@cli-forge/parser` are read from their `dist/` directories at SSR time and registered via `addExtraLib` on editor mount.

**Tech Stack:** `@monaco-editor/react` (CDN-loaded), React 19, Vike, Tailwind CSS v4, existing forge design tokens.

---

### Task 1: Install Monaco dependency

**Files:**
- Modify: `docs-site/package.json`

**Step 1: Install the package**

Run from the workspace root:
```bash
pnpm add @monaco-editor/react --filter docs-site
```

**Step 2: Verify install**

```bash
grep monaco docs-site/package.json
```
Expected: `"@monaco-editor/react": "^4.x.x"` appears in dependencies.

**Step 3: Commit**
```bash
git add docs-site/package.json pnpm-lock.yaml
git commit -m "chore(docs-site): add @monaco-editor/react dependency"
```

---

### Task 2: Ship type declarations from dist via +data.ts

**Files:**
- Modify: `docs-site/pages/playground/+data.ts`

The server-side data loader reads every `.d.mts` file recursively from both package dist directories and ships them to the client so Monaco can register them.

**Step 1: Add the helper at the top of +data.ts**

After the existing imports, add:

```typescript
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { workspaceRoot } from '../../server/utils/workspace.js';

function readDtsFiles(dir: string, base: string): { path: string; content: string }[] {
  const results: { path: string; content: string }[] = [];
  let entries: ReturnType<typeof readdirSync>;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...readDtsFiles(fullPath, base));
    } else if (entry.name.endsWith('.d.mts') || entry.name.endsWith('.d.cts')) {
      results.push({
        path: relative(base, fullPath).replace(/\\/g, '/'),
        content: readFileSync(fullPath, 'utf-8'),
      });
    }
  }
  return results;
}
```

**Step 2: Add TypeDeclarations to the exported interface**

```typescript
export interface TypeDeclarationFile {
  path: string;
  content: string;
}

export interface PlaygroundData {
  examples: Record<string, PlaygroundExample>;
  typeDeclarations: {
    cliForge: TypeDeclarationFile[];
    parser: TypeDeclarationFile[];
  };
}
```

**Step 3: Populate in data()**

Replace the `return { examples }` at the bottom of `data()` with:

```typescript
  const root = workspaceRoot();
  const cliForgeDistDir = join(root, 'packages/cli-forge/dist');
  const parserDistDir = join(root, 'packages/parser/dist');

  return {
    examples,
    typeDeclarations: {
      cliForge: readDtsFiles(cliForgeDistDir, cliForgeDistDir),
      parser: readDtsFiles(parserDistDir, parserDistDir),
    },
  };
```

**Step 4: Verify it builds without errors**
```bash
nx build docs-site 2>&1 | tail -10
```
Expected: build succeeds (or fails only on unrelated issues).

---

### Task 3: Rewrite +Page.tsx — file state model and helpers

**Files:**
- Modify: `docs-site/pages/playground/+Page.tsx`

This task replaces the entire file. Do it in stages. Start by replacing the top of the file (imports, constants, types, and helper functions) — do NOT touch the JSX yet; just get the helpers right.

**Step 1: Replace imports and constants at the top**

```typescript
import { useState, useRef, useCallback, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useData } from 'vike-react/useData';
import { usePageContext } from 'vike-react/usePageContext';
import { Link } from '../../components/Link';
import type { PlaygroundData, PlaygroundExample } from './+data';

const DEFAULT_CODE = `import { cli } from 'cli-forge';

cli('my-app')
  .option('name', {
    type: 'string',
    description: 'Your name',
    default: 'World',
  })
  .handler((args) => {
    console.log(\`Hello, \${args.name}!\`);
  })
  .forge();
`;

const DEFAULT_ENV_CONTENT = `# cli-forge does not auto-load .env files.
# Add KEY=VALUE pairs here to set environment variables for the playground runner.

`;

type FileEntry = { path: string; content: string };
```

**Step 2: Add the helper functions**

```typescript
function detectLanguage(path: string): string {
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
  if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.env') || path === '.env') return 'ini';
  if (path.endsWith('.yaml') || path.endsWith('.yml')) return 'yaml';
  return 'plaintext';
}

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

function isCodeFile(path: string): boolean {
  return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(path);
}

function initFilesFromExample(ex: PlaygroundExample): FileEntry[] {
  const files: FileEntry[] = ex.files.map((f) => ({
    path: f.path,
    content: f.content,
  }));

  // Build .env content from first command's env vars if present
  const firstCmd = ex.commands[0];
  const envVarLines = firstCmd?.env
    ? Object.entries(firstCmd.env)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n')
    : '';
  files.push({ path: '.env', content: DEFAULT_ENV_CONTENT + envVarLines });

  return files;
}

function initFilesDefault(): FileEntry[] {
  return [
    { path: 'cli.ts', content: DEFAULT_CODE },
    { path: '.env', content: DEFAULT_ENV_CONTENT },
  ];
}

function firstCodeFile(files: FileEntry[]): string {
  return files.find((f) => isCodeFile(f.path))?.path ?? files[0]?.path ?? 'cli.ts';
}
```

**Step 3: No test needed here (pure functions) — just confirm TypeScript compiles**

Because this is a UI file and the helpers are straightforward, skip a separate test file. TypeScript will catch type errors during build. Proceed to next task.

---

### Task 4: Rewrite +Page.tsx — run logic

Still in `docs-site/pages/playground/+Page.tsx`. Replace the `run` callback with one that reads env vars from the `.env` file entry instead of the old `envVars` state array.

**Step 1: Replace the run callback**

The run logic is largely the same as before, but `envRecord` is now derived from the `.env` file content:

```typescript
const run = useCallback(async () => {
  setRunning(true);
  setOutput([]);
  setError(null);

  const logs: string[] = [];
  const origLog = console.log;
  const origError = console.error;
  const origWarn = console.warn;

  const capture = (prefix: string) => (...args: unknown[]) => {
    const line = args
      .map((a) => (typeof a === 'string' ? a : JSON.stringify(a, null, 2) ?? String(a)))
      .join(' ');
    logs.push(prefix ? `${prefix} ${line}` : line);
  };
  console.log = capture('');
  console.error = capture('[stderr]');
  console.warn = capture('[warn]');

  try {
    const argv = parseArgs(args);

    // Env vars come from the .env file
    const envFile = files.find((f) => f.path === '.env');
    const envRecord = envFile ? parseEnvFile(envFile.content) : {};

    // Virtual FS from all non-.env, non-code files
    const filesRecord: Record<string, string> = {};
    for (const { path, content } of files) {
      if (!isCodeFile(path) && path !== '.env') {
        filesRecord[path.startsWith('/') ? path : '/' + path] = content;
      }
    }

    // Get the entry point: first code file
    const entryFile = files.find((f) => isCodeFile(f.path));
    let code = entryFile?.content ?? DEFAULT_CODE;

    let transformed = code
      .replace(/import\s+\{[^}]*\}\s+from\s+['"](?:cli-forge|@cli-forge\/parser)['"];?\s*/g, '')
      .replace(/import\s+(\w+)\s+from\s+['"](?:cli-forge|@cli-forge\/parser)['"];?\s*/g, '')
      .replace(
        /(?:const|let|var)\s+\{[^}]*\}\s*=\s*require\s*\(\s*['"](?:cli-forge|@cli-forge\/parser)['"]\s*\)\s*;?\s*/g,
        ''
      )
      .replace(/\.forge\(\s*\)/g, '.forge(__argv__)');

    const cliForge = await import('cli-forge');
    const parserPkg = await import('@cli-forge/parser');
    const cli = cliForge.cli || cliForge.default;

    parserPkg.setEnvironmentProvider(
      new parserPkg.MemoryEnvironmentProvider({ env: envRecord, cwd: '/' })
    );
    parserPkg.setFileSystemProvider(new parserPkg.MemoryFileSystemProvider(filesRecord));

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fn = new AsyncFunction(
      'cli',
      'ConfigurationProviders',
      'getJsonFileConfigLoader',
      'getPackageJsonConfigurationLoader',
      '__argv__',
      transformed
    );
    await fn(
      cli,
      cliForge.ConfigurationProviders,
      parserPkg.ConfigurationFiles.getJsonFileConfigLoader,
      parserPkg.ConfigurationFiles.getPackageJsonConfigurationLoader,
      argv
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes('process.exit')) setError(msg);
  } finally {
    console.log = origLog;
    console.error = origError;
    console.warn = origWarn;
    try {
      const parserPkg = await import('@cli-forge/parser');
      parserPkg.setEnvironmentProvider(new parserPkg.MemoryEnvironmentProvider());
      parserPkg.setFileSystemProvider(new parserPkg.MemoryFileSystemProvider());
    } catch { /* ignore */ }
    setOutput([...logs]);
    setRunning(false);
  }
}, [files, args]);
```

---

### Task 5: Rewrite +Page.tsx — IDE component (JSX)

Still in `docs-site/pages/playground/+Page.tsx`. This is the main visual redesign.

**Step 1: Replace the PlaygroundPage component**

```typescript
export default function PlaygroundPage() {
  const { examples, typeDeclarations } = useData<PlaygroundData>();
  const pageContext = usePageContext();

  const urlExampleId =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('example')
      : (pageContext.urlParsed?.search as any)?.example ?? null;

  const loadedExample = urlExampleId ? examples[urlExampleId] : null;

  const [files, setFiles] = useState<FileEntry[]>(
    loadedExample ? initFilesFromExample(loadedExample) : initFilesDefault()
  );
  const [activeFile, setActiveFile] = useState<string>(() =>
    firstCodeFile(loadedExample ? initFilesFromExample(loadedExample) : initFilesDefault())
  );
  const [args, setArgs] = useState<string>(
    loadedExample?.commands[0]?.args ?? '--help'
  );
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [activeExample, setActiveExample] = useState<PlaygroundExample | null>(loadedExample);
  const outputRef = useRef<HTMLDivElement>(null);

  // ... run callback from Task 4 goes here ...

  const applyExample = useCallback((ex: PlaygroundExample) => {
    const nextFiles = initFilesFromExample(ex);
    setFiles(nextFiles);
    setActiveFile(firstCodeFile(nextFiles));
    setArgs(ex.commands[0]?.args ?? '--help');
    setOutput([]);
    setError(null);
    setActiveExample(ex);
  }, []);

  const updateFileContent = useCallback((path: string, content: string) => {
    setFiles((prev) => prev.map((f) => (f.path === path ? { ...f, content } : f)));
  }, []);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    // Register type declarations
    for (const { path, content } of typeDeclarations.cliForge) {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        content,
        `file:///node_modules/cli-forge/dist/${path}`
      );
    }
    for (const { path, content } of typeDeclarations.parser) {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        content,
        `file:///node_modules/@cli-forge/parser/dist/${path}`
      );
    }
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.Bundler,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
    });
    // Register the forge dark theme
    monaco.editor.defineTheme('forge-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a5040', fontStyle: 'italic' },
        { token: 'string', foreground: 'ffb347' },
        { token: 'keyword', foreground: 'ff8c38', fontStyle: 'bold' },
        { token: 'number', foreground: 'ffd5a0' },
        { token: 'type', foreground: 'a08060' },
      ],
      colors: {
        'editor.background': '#1e140d',
        'editor.foreground': '#c4a882',
        'editor.lineHighlightBackground': '#261a1180',
        'editorCursor.foreground': '#ffb347',
        'editor.selectionBackground': '#3a2c2080',
        'editorLineNumber.foreground': '#3a2c20',
        'editorLineNumber.activeForeground': '#6a5040',
        'editorIndentGuide.background1': '#2a1f16',
        'editorWidget.background': '#170f0a',
        'editorSuggestWidget.background': '#170f0a',
        'editorSuggestWidget.border': '#2a1f16',
        'editorSuggestWidget.selectedBackground': '#261a11',
      },
    });
    monaco.editor.setTheme('forge-dark');
  }, [typeDeclarations]);

  const activeFileContent = files.find((f) => f.path === activeFile)?.content ?? '';
  const modKey =
    typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl';

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-forge-flame-bright font-[Cinzel]">
            Playground
            {activeExample && (
              <span className="text-lg text-forge-ash font-normal font-sans ml-3">
                / {activeExample.title}
              </span>
            )}
          </h1>
          <p className="text-forge-ash mt-1 max-w-2xl text-sm">
            {activeExample
              ? activeExample.description
              : 'Write CLI Forge code and see how it responds to different arguments and environment variables.'}
          </p>
        </div>
        {activeExample && (
          <Link
            href={`/examples/${activeExample.id}`}
            className="text-xs text-forge-ash hover:text-forge-flame-bright transition-colors shrink-0 mt-2"
          >
            View example docs →
          </Link>
        )}
      </div>

      {/* Mobile degradation */}
      <div className="lg:hidden border border-forge-iron rounded-lg p-8 text-center bg-forge-bg-surface">
        <p className="text-forge-ash mb-3">
          The playground requires a desktop browser for the best experience.
        </p>
        {activeExample && (
          <Link
            href={`/examples/${activeExample.id}`}
            className="text-forge-flame-bright hover:underline text-sm"
          >
            View the example documentation instead →
          </Link>
        )}
      </div>

      {/* IDE window — desktop only */}
      <div
        className="hidden lg:flex flex-col border border-forge-iron rounded-lg overflow-hidden bg-forge-bg-surface"
        style={{ height: '650px' }}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            run();
          }
        }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-forge-iron bg-forge-bg/80 shrink-0">
          <div className="flex items-center gap-2">
            {/* Traffic light dots for IDE feel */}
            <span className="w-3 h-3 rounded-full bg-forge-iron-light" />
            <span className="w-3 h-3 rounded-full bg-forge-iron-light" />
            <span className="w-3 h-3 rounded-full bg-forge-iron-light" />
            <span className="text-xs text-forge-ash-dim ml-2 font-mono">
              {activeFile}
            </span>
          </div>
          <button
            onClick={run}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-1 bg-forge-flame hover:bg-forge-flame-bright text-forge-bg font-semibold text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? '◌ Running…' : '▶ Run'}
            <span className="text-forge-bg/60 font-normal">{modKey}↩</span>
          </button>
        </div>

        {/* Editor row: sidebar + Monaco */}
        <div className="flex flex-1 min-h-0">
          {/* File explorer sidebar */}
          <div className="w-44 shrink-0 border-r border-forge-iron bg-forge-bg/50 flex flex-col overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-forge-ash-dim border-b border-forge-iron">
              Explorer
            </div>
            {files.map((file) => (
              <button
                key={file.path}
                onClick={() => setActiveFile(file.path)}
                className={`w-full text-left px-3 py-1.5 text-xs font-mono truncate transition-colors ${
                  file.path === activeFile
                    ? 'bg-forge-bg-surface-alt text-forge-smoke'
                    : 'text-forge-ash hover:bg-forge-bg-raised hover:text-forge-smoke'
                }`}
              >
                {file.path === activeFile && (
                  <span className="text-forge-flame mr-1.5">›</span>
                )}
                {file.path}
              </button>
            ))}
          </div>

          {/* Monaco editor */}
          <div className="flex-1 min-w-0">
            <Editor
              height="100%"
              language={detectLanguage(activeFile)}
              value={activeFileContent}
              onChange={(v) => updateFileContent(activeFile, v ?? '')}
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineHeight: 20,
                fontFamily: "'JetBrains Mono', 'Cascadia Code', monospace",
                scrollBeyondLastLine: false,
                renderLineHighlight: 'line',
                padding: { top: 12, bottom: 12 },
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
              }}
            />
          </div>
        </div>

        {/* Bottom terminal panel */}
        <div className="shrink-0 border-t border-forge-iron flex flex-col" style={{ height: '200px' }}>
          {/* Args input row */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-forge-iron bg-forge-bg/80 shrink-0">
            <span className="text-forge-ash-dim font-mono text-sm shrink-0">$</span>
            <input
              type="text"
              value={args}
              onChange={(e) => setArgs(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && run()}
              placeholder="--flag value …"
              className="flex-1 bg-transparent text-forge-smoke font-mono text-sm outline-none placeholder:text-forge-iron-light"
            />
            {/* Example command presets */}
            {activeExample && activeExample.commands.length > 1 && (
              <div className="flex gap-1 shrink-0">
                {activeExample.commands.map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => setArgs(cmd.args)}
                    className="px-2 py-0.5 text-[10px] border border-forge-iron rounded hover:border-forge-flame hover:text-forge-flame-bright text-forge-ash-dim transition-colors"
                    title={cmd.args}
                  >
                    {cmd.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Output */}
          <div
            ref={outputRef}
            className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed"
          >
            {output.length === 0 && !error && !running && (
              <span className="text-forge-iron-light">
                Press {modKey}+Enter or click Run to execute…
              </span>
            )}
            {output.map((line, i) => (
              <div
                key={i}
                className={`whitespace-pre-wrap ${
                  line.startsWith('[stderr]')
                    ? 'text-forge-danger'
                    : line.startsWith('[warn]')
                    ? 'text-forge-warning'
                    : 'text-forge-smoke'
                }`}
              >
                {line}
              </div>
            ))}
            {error && (
              <div className="text-forge-danger whitespace-pre-wrap mt-2 pt-2 border-t border-forge-iron">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Examples picker */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-forge-ash-dim uppercase tracking-wider mb-3">
          Load an example
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.values(examples).map((ex) => (
            <button
              key={ex.id}
              onClick={() => applyExample(ex)}
              className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                activeExample?.id === ex.id
                  ? 'border-forge-flame text-forge-flame-bright bg-forge-flame/10'
                  : 'border-forge-iron hover:border-forge-flame hover:text-forge-flame-bright text-forge-ash'
              }`}
            >
              {ex.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Add the parseArgs utility at the bottom** (unchanged from original — keep it as-is)

**Step 3: Build and check for TypeScript errors**
```bash
nx build docs-site 2>&1 | grep -E "error TS|Error" | head -20
```

**Step 4: Commit**
```bash
git add docs-site/pages/playground/+Page.tsx docs-site/pages/playground/+data.ts
git commit -m "feat(docs-site): replace textarea playground with Monaco IDE embed"
```

---

### Task 6: Smoke-test the playground in the browser

**Step 1: Start the dev server**
```bash
nx serve docs-site
```

**Step 2: Open the playground**

Navigate to `http://localhost:4321/cli-forge/playground` (or whatever port nx serves on).

**Expected:**
- IDE window renders with sidebar and Monaco editor
- Default `cli.ts` is active and editable with syntax highlighting
- `.env` file is visible in the sidebar; clicking it switches to ini/dotenv language mode
- Run button executes the code and output appears in the terminal panel
- Below `lg` breakpoint (resize browser): IDE hides, degradation message shows

**Step 3: Test with a multi-file example**

Click "Configuration Files" in the examples picker.

**Expected:**
- All example files appear in the sidebar
- `.env` tab present at bottom of sidebar with pre-populated vars (if any)
- Switching files in the sidebar swaps Monaco content instantly
- Running the example works as before

**Step 4: Verify IntelliSense**

In the Monaco editor, type `cli('` — autocomplete should offer `cli-forge` types. Hover over `cli` — should show type signature.

**Step 5: Commit if all good**
```bash
git add -p  # nothing new to stage — already committed in Task 5
```

---

### Notes

- Monaco loads from CDN (`cdn.jsdelivr.net`) by default. This requires internet during development and for users. Self-hosting is possible later by configuring `loader.config({ paths: { vs: '/monaco-editor/min/vs' } })` and copying assets.
- The `.env` file is not added to `filesRecord` (it's only used to build `envRecord`). Non-code, non-`.env` files become virtual FS entries accessible via `ConfigurationFiles` providers.
- If the dist `.d.mts` files aren't present (e.g. first run before building), `readDtsFiles` silently returns `[]` — the editor still works, just without IntelliSense.
