import { useState, useRef, useCallback, useEffect } from 'react';
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
  .option('greeting', {
    type: 'string',
    description: 'The greeting to use',
    default: 'Hello',
  })
  .handler((args) => {
    console.log(\`\${args.greeting}, \${args.name}!\`);
  })
  .forge();
`;

type EnvEntry = { key: string; value: string };
type FileEntry = { path: string; content: string };

function isCodeFile(path: string): boolean {
  return /\.(ts|js|tsx|jsx|mjs|cjs)$/.test(path);
}

function isDataFile(path: string): boolean {
  return /\.(json|ya?ml|toml|env|cfg|conf|config|ini)$/.test(path);
}

/**
 * Loads an example into the playground state.
 * - Code files go into the editor (concatenated if multiple)
 * - Data/config files go into the Files panel
 * - Env vars from the first command go into the Env panel
 */
function loadExample(ex: PlaygroundExample) {
  const codeFiles = ex.files.filter((f) => isCodeFile(f.path));
  const dataFiles = ex.files.filter((f) => isDataFile(f.path));

  // Use the first code file as the main code, or all files if none match
  const mainCode =
    codeFiles.length > 0
      ? codeFiles.map((f) => f.content).join('\n\n')
      : ex.files[0]?.content ?? DEFAULT_CODE;

  // Data files become virtual FS entries
  const fileEntries: FileEntry[] = dataFiles.map((f) => ({
    path: f.path.startsWith('/') ? f.path : '/' + f.path,
    content: f.content,
  }));

  // First command's env vars
  const firstCmd = ex.commands[0];
  const envEntries: EnvEntry[] = firstCmd?.env
    ? Object.entries(firstCmd.env).map(([key, value]) => ({ key, value }))
    : [];

  const defaultArgs = firstCmd?.args ?? '--help';

  return { code: mainCode, args: defaultArgs, files: fileEntries, envVars: envEntries };
}

export default function PlaygroundPage() {
  const { examples } = useData<PlaygroundData>();
  const pageContext = usePageContext();

  // Check for ?example=<id> in URL
  const urlExampleId =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('example')
      : (pageContext.urlParsed?.search as any)?.example ?? null;

  const loadedExample = urlExampleId ? examples[urlExampleId] : null;
  const initial = loadedExample ? loadExample(loadedExample) : null;

  const [code, setCode] = useState(initial?.code ?? DEFAULT_CODE);
  const [args, setArgs] = useState(initial?.args ?? '--name CLI-Forge');
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [envVars, setEnvVars] = useState<EnvEntry[]>(initial?.envVars ?? []);
  const [files, setFiles] = useState<FileEntry[]>(initial?.files ?? []);
  const [activeTab, setActiveTab] = useState<'env' | 'files'>(
    (initial?.files?.length ?? 0) > 0 ? 'files' : 'env'
  );
  const [activeExample, setActiveExample] = useState<PlaygroundExample | null>(loadedExample);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const run = useCallback(async () => {
    setRunning(true);
    setOutput([]);
    setError(null);

    const logs: string[] = [];

    // Capture console methods
    const origLog = console.log;
    const origError = console.error;
    const origWarn = console.warn;

    const capture =
      (prefix: string) =>
      (...args: unknown[]) => {
        const line = args
          .map((a) =>
            typeof a === 'string' ? a : JSON.stringify(a, null, 2) ?? String(a)
          )
          .join(' ');
        logs.push(prefix ? `${prefix} ${line}` : line);
      };

    console.log = capture('');
    console.error = capture('[stderr]');
    console.warn = capture('[warn]');

    try {
      // Parse args string into array
      const argv = parseArgs(args);

      // Build env record from entries
      const envRecord: Record<string, string> = {};
      for (const { key, value } of envVars) {
        if (key.trim()) envRecord[key.trim()] = value;
      }

      // Build files record from entries
      const filesRecord: Record<string, string> = {};
      for (const { path, content } of files) {
        if (path.trim()) filesRecord[path.trim()] = content;
      }

      // Transform code:
      // 1. Strip import statements for cli-forge / @cli-forge/parser
      // 2. Replace .forge() with .forge(argv)
      let transformed = code
        // Remove ESM imports from cli-forge or @cli-forge/parser
        .replace(
          /import\s+\{[^}]*\}\s+from\s+['"](?:cli-forge|@cli-forge\/parser)['"];?\s*/g,
          ''
        )
        .replace(
          /import\s+(\w+)\s+from\s+['"](?:cli-forge|@cli-forge\/parser)['"];?\s*/g,
          ''
        )
        // Remove CJS requires
        .replace(
          /(?:const|let|var)\s+\{[^}]*\}\s*=\s*require\s*\(\s*['"](?:cli-forge|@cli-forge\/parser)['"]\s*\)\s*;?\s*/g,
          ''
        );

      // Replace .forge() with .forge(argv) — but only bare .forge() calls
      transformed = transformed.replace(
        /\.forge\(\s*\)/g,
        '.forge(__argv__)'
      );

      // Import cli-forge and @cli-forge/parser, set up providers
      const cliForge = await import('cli-forge');
      const parserPkg = await import('@cli-forge/parser');
      const cli = cliForge.cli || cliForge.default;

      // Install in-memory providers
      parserPkg.setEnvironmentProvider(
        new parserPkg.MemoryEnvironmentProvider({ env: envRecord, cwd: '/' })
      );
      parserPkg.setFileSystemProvider(
        new parserPkg.MemoryFileSystemProvider(filesRecord)
      );

      const AsyncFunction = Object.getPrototypeOf(
        async function () {}
      ).constructor;
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
      // ValidationFailedError from --help is expected
      if (!msg.includes('process.exit')) {
        setError(msg);
      }
    } finally {
      console.log = origLog;
      console.error = origError;
      console.warn = origWarn;

      // Restore default providers
      try {
        const parserPkg = await import('@cli-forge/parser');
        parserPkg.setEnvironmentProvider(
          new parserPkg.MemoryEnvironmentProvider()
        );
        parserPkg.setFileSystemProvider(
          new parserPkg.MemoryFileSystemProvider()
        );
      } catch {
        // ignore
      }

      setOutput([...logs]);
      setRunning(false);
    }
  }, [code, args, envVars, files]);

  // Handle Ctrl/Cmd+Enter to run
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        run();
      }
      // Handle Tab in textarea
      if (e.key === 'Tab' && e.target === textareaRef.current) {
        e.preventDefault();
        const textarea = textareaRef.current!;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newCode = code.substring(0, start) + '  ' + code.substring(end);
        setCode(newCode);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        });
      }
    },
    [code, run]
  );

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + 'px';
    }
  }, [code]);

  const modKey =
    typeof navigator !== 'undefined' && navigator.platform?.includes('Mac')
      ? '\u2318'
      : 'Ctrl';

  const applyExample = useCallback(
    (ex: PlaygroundExample) => {
      const state = loadExample(ex);
      setCode(state.code);
      setArgs(state.args);
      setEnvVars(state.envVars);
      setFiles(state.files);
      setActiveTab(state.files.length > 0 ? 'files' : 'env');
      setActiveExample(ex);
      setOutput([]);
      setError(null);
    },
    []
  );

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-3">
        <h1 className="text-3xl font-bold text-forge-flame-bright font-[Cinzel]">
          Playground
          {activeExample && (
            <span className="text-lg text-forge-ash font-normal font-sans ml-3">
              / {activeExample.title}
            </span>
          )}
        </h1>
        {activeExample && (
          <Link
            href={`/examples/${activeExample.id}`}
            className="text-xs text-forge-ash hover:text-forge-flame-bright transition-colors shrink-0 mt-2"
          >
            View example docs
          </Link>
        )}
      </div>
      <p className="text-forge-ash mb-6 max-w-2xl">
        {activeExample
          ? activeExample.description
          : 'Write CLI Forge code and see how it responds to different arguments, environment variables, and configuration files.'}
      </p>

      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        onKeyDown={handleKeyDown}
      >
        {/* Editor Panel */}
        <div className="flex flex-col gap-3">
          <div className="border border-forge-iron rounded-lg overflow-hidden bg-forge-bg-surface">
            <div className="flex items-center justify-between px-3 py-2 border-b border-forge-iron bg-forge-bg/50">
              <span className="text-xs font-medium text-forge-ash-dim uppercase tracking-wider">
                Code
              </span>
              <span className="text-xs text-forge-ash-dim">
                {modKey}+Enter to run
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="w-full bg-transparent text-forge-smoke font-mono text-sm p-4 resize-none outline-none min-h-[300px] leading-relaxed"
            />
          </div>

          {/* Args input */}
          <div className="border border-forge-iron rounded-lg overflow-hidden bg-forge-bg-surface">
            <div className="flex items-center justify-between px-3 py-2 border-b border-forge-iron bg-forge-bg/50">
              <span className="text-xs font-medium text-forge-ash-dim uppercase tracking-wider">
                Arguments
              </span>
              {activeExample && activeExample.commands.length > 1 && (
                <div className="flex gap-1">
                  {activeExample.commands.map((cmd, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setArgs(cmd.args);
                        if (cmd.env) {
                          setEnvVars(
                            Object.entries(cmd.env).map(([key, value]) => ({
                              key,
                              value,
                            }))
                          );
                        }
                      }}
                      className="px-2 py-0.5 text-[10px] border border-forge-iron rounded hover:border-forge-flame hover:text-forge-flame-bright text-forge-ash-dim transition-colors"
                      title={cmd.args}
                    >
                      {cmd.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 p-3">
              <span className="text-forge-ash-dim font-mono text-sm shrink-0">
                $
              </span>
              <input
                type="text"
                value={args}
                onChange={(e) => setArgs(e.target.value)}
                placeholder="--flag value ..."
                className="flex-1 bg-transparent text-forge-smoke font-mono text-sm outline-none placeholder:text-forge-iron-light"
              />
              <button
                onClick={run}
                disabled={running}
                className="px-4 py-1.5 bg-forge-flame hover:bg-forge-flame-bright text-forge-bg font-semibold text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {running ? 'Running...' : 'Run'}
              </button>
            </div>
          </div>

          {/* Environment / Files panel */}
          <div className="border border-forge-iron rounded-lg overflow-hidden bg-forge-bg-surface">
            <div className="flex items-center border-b border-forge-iron bg-forge-bg/50">
              <button
                onClick={() => setActiveTab('env')}
                className={`px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                  activeTab === 'env'
                    ? 'text-forge-flame-bright border-b-2 border-forge-flame'
                    : 'text-forge-ash-dim hover:text-forge-ash'
                }`}
              >
                Env Vars
                {envVars.length > 0 && (
                  <span className="ml-1.5 text-forge-ash-dim">
                    ({envVars.length})
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                  activeTab === 'files'
                    ? 'text-forge-flame-bright border-b-2 border-forge-flame'
                    : 'text-forge-ash-dim hover:text-forge-ash'
                }`}
              >
                Files
                {files.length > 0 && (
                  <span className="ml-1.5 text-forge-ash-dim">
                    ({files.length})
                  </span>
                )}
              </button>
            </div>
            <div className="p-3">
              {activeTab === 'env' && (
                <EnvVarsEditor entries={envVars} onChange={setEnvVars} />
              )}
              {activeTab === 'files' && (
                <FilesEditor entries={files} onChange={setFiles} />
              )}
            </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="border border-forge-iron rounded-lg overflow-hidden bg-forge-bg-surface flex flex-col">
          <div className="flex items-center px-3 py-2 border-b border-forge-iron bg-forge-bg/50">
            <span className="text-xs font-medium text-forge-ash-dim uppercase tracking-wider">
              Output
            </span>
          </div>
          <div className="flex-1 p-4 font-mono text-sm min-h-[300px] max-h-[600px] overflow-auto">
            {output.length === 0 && !error && (
              <span className="text-forge-iron-light">
                Click &quot;Run&quot; or press {modKey}+Enter to see output...
              </span>
            )}
            {output.map((line, i) => (
              <div
                key={i}
                className={`whitespace-pre-wrap ${
                  line.startsWith('[stderr]')
                    ? 'text-red-400'
                    : line.startsWith('[warn]')
                    ? 'text-yellow-400'
                    : 'text-forge-smoke'
                }`}
              >
                {line}
              </div>
            ))}
            {error && (
              <div className="text-red-400 whitespace-pre-wrap mt-2 pt-2 border-t border-forge-iron">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Examples */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-forge-smoke mb-3">
          Try an example
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

// ── Sub-components ───────────────────────────────────────────────────

function EnvVarsEditor({
  entries,
  onChange,
}: {
  entries: EnvEntry[];
  onChange: (entries: EnvEntry[]) => void;
}) {
  const update = (idx: number, field: 'key' | 'value', val: string) => {
    const next = [...entries];
    next[idx] = { ...next[idx], [field]: val };
    onChange(next);
  };
  const remove = (idx: number) => onChange(entries.filter((_, i) => i !== idx));
  const add = () => onChange([...entries, { key: '', value: '' }]);

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={entry.key}
            onChange={(e) => update(i, 'key', e.target.value)}
            placeholder="KEY"
            className="w-1/3 bg-forge-bg text-forge-smoke font-mono text-xs px-2 py-1.5 rounded border border-forge-iron outline-none focus:border-forge-ember placeholder:text-forge-iron-light"
          />
          <span className="text-forge-ash-dim text-xs">=</span>
          <input
            type="text"
            value={entry.value}
            onChange={(e) => update(i, 'value', e.target.value)}
            placeholder="value"
            className="flex-1 bg-forge-bg text-forge-smoke font-mono text-xs px-2 py-1.5 rounded border border-forge-iron outline-none focus:border-forge-ember placeholder:text-forge-iron-light"
          />
          <button
            onClick={() => remove(i)}
            className="text-forge-ash-dim hover:text-red-400 text-xs px-1 transition-colors"
            aria-label="Remove"
          >
            &times;
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="text-xs text-forge-ash hover:text-forge-flame-bright transition-colors"
      >
        + Add variable
      </button>
      {entries.length === 0 && (
        <p className="text-xs text-forge-iron-light">
          Environment variables are available via{' '}
          <code className="text-forge-flame">.env()</code> on the parser.
        </p>
      )}
    </div>
  );
}

function FilesEditor({
  entries,
  onChange,
}: {
  entries: FileEntry[];
  onChange: (entries: FileEntry[]) => void;
}) {
  const update = (idx: number, field: 'path' | 'content', val: string) => {
    const next = [...entries];
    next[idx] = { ...next[idx], [field]: val };
    onChange(next);
  };
  const remove = (idx: number) => onChange(entries.filter((_, i) => i !== idx));
  const add = () => onChange([...entries, { path: '', content: '' }]);

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={entry.path}
              onChange={(e) => update(i, 'path', e.target.value)}
              placeholder="/app.config.json"
              className="flex-1 bg-forge-bg text-forge-smoke font-mono text-xs px-2 py-1.5 rounded border border-forge-iron outline-none focus:border-forge-ember placeholder:text-forge-iron-light"
            />
            <button
              onClick={() => remove(i)}
              className="text-forge-ash-dim hover:text-red-400 text-xs px-1 transition-colors"
              aria-label="Remove"
            >
              &times;
            </button>
          </div>
          <textarea
            value={entry.content}
            onChange={(e) => update(i, 'content', e.target.value)}
            placeholder='{ "key": "value" }'
            rows={3}
            className="w-full bg-forge-bg text-forge-smoke font-mono text-xs px-2 py-1.5 rounded border border-forge-iron outline-none focus:border-forge-ember resize-none placeholder:text-forge-iron-light"
          />
        </div>
      ))}
      <button
        onClick={add}
        className="text-xs text-forge-ash hover:text-forge-flame-bright transition-colors"
      >
        + Add file
      </button>
      {entries.length === 0 && (
        <p className="text-xs text-forge-iron-light">
          Virtual files are available via{' '}
          <code className="text-forge-flame">.config()</code> providers.
        </p>
      )}
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

