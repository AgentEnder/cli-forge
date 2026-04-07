import { useState, useCallback, lazy, Suspense } from 'react';
import type { OnMount } from '@monaco-editor/react';
import { useData } from 'vike-react/useData';
import { usePageContext } from 'vike-react/usePageContext';
import { Link } from '../../components/Link';
import type { PlaygroundData, PlaygroundExample } from './+data';

// Lazy-load Monaco so it never runs during SSR/prerender
const Editor = lazy(() => import('@monaco-editor/react'));

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

export default function PlaygroundPage() {
  const { examples, typeDeclarations } = useData<PlaygroundData>();
  const pageContext = usePageContext();

  const urlExampleId =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('example')
      : (pageContext.urlParsed?.search as any)?.example ?? null;

  const loadedExample = urlExampleId ? examples[urlExampleId] : null;

  const initFiles = loadedExample ? initFilesFromExample(loadedExample) : initFilesDefault();
  const [files, setFiles] = useState<FileEntry[]>(initFiles);
  const [activeFile, setActiveFile] = useState<string>(() => firstCodeFile(initFiles));
  const [args, setArgs] = useState<string>(
    loadedExample?.commands[0]?.args ?? '--help'
  );
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [activeExample, setActiveExample] = useState<PlaygroundExample | null>(loadedExample);

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
      const code = entryFile?.content ?? DEFAULT_CODE;

      const transformed = code
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
      } catch {
        /* ignore */
      }
      setOutput([...logs]);
      setRunning(false);
    }
  }, [files, args]);

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

  const handleEditorMount: OnMount = useCallback(
    (_editor, monaco) => {
      // Register package.json files so TypeScript can resolve bare module
      // specifiers like `import { cli } from 'cli-forge'` to the correct
      // types entry point via the exports / typings fields.
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        typeDeclarations.cliForgePackageJson,
        'file:///node_modules/cli-forge/package.json'
      );
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        typeDeclarations.parserPackageJson,
        'file:///node_modules/@cli-forge/parser/package.json'
      );
      // Register all declaration files
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
        // ModuleResolutionKind.Bundler = 99 in newer Monaco versions
        // Bundler = 99 in Monaco's numeric enum; the named value may not exist in older type versions
        moduleResolution: (monaco.languages.typescript.ModuleResolutionKind as any).Bundler ?? 99,
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
    },
    [typeDeclarations]
  );

  const activeFileContent = files.find((f) => f.path === activeFile)?.content ?? '';
  const modKey =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl';

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
                aria-pressed={file.path === activeFile}
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
            <Suspense fallback={<div className="h-full w-full bg-forge-bg/30" />}>
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
            </Suspense>
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
                    title={cmd.name}
                  >
                    {cmd.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Output */}
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed">
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

// ── Utilities ────────────────────────────────────────────────────────

function parseArgs(input: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuote: string | null = null;
  let escaped = false;

  for (const char of input) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (inQuote) {
      if (char === inQuote) {
        inQuote = null;
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      inQuote = char;
      continue;
    }
    if (char === ' ' || char === '\t') {
      if (current) {
        args.push(current);
        current = '';
      }
      continue;
    }
    current += char;
  }
  if (current) args.push(current);
  return args;
}
