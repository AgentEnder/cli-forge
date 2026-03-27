import { useState, useRef, useCallback, useEffect } from 'react';

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

export default function PlaygroundPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [args, setArgs] = useState('--name CLI-Forge');
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [envVars, setEnvVars] = useState<EnvEntry[]>([]);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'env' | 'files'>('env');
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

  return (
    <div>
      <h1 className="text-3xl font-bold text-forge-flame-bright mb-3 font-[Cinzel]">
        Playground
      </h1>
      <p className="text-forge-ash mb-6 max-w-2xl">
        Write CLI Forge code and see how it responds to different arguments,
        environment variables, and configuration files.
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
            <div className="flex items-center px-3 py-2 border-b border-forge-iron bg-forge-bg/50">
              <span className="text-xs font-medium text-forge-ash-dim uppercase tracking-wider">
                Arguments
              </span>
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

      {/* Quick Examples */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-forge-smoke mb-3">
          Try these examples
        </h2>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example.label}
              onClick={() => {
                setCode(example.code);
                setArgs(example.args);
                setEnvVars(example.env ?? []);
                setFiles(example.files ?? []);
                setOutput([]);
                setError(null);
              }}
              className="px-3 py-1.5 text-sm border border-forge-iron rounded-lg hover:border-forge-flame hover:text-forge-flame-bright text-forge-ash transition-colors"
            >
              {example.label}
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

// ── Examples ─────────────────────────────────────────────────────────

const EXAMPLES: {
  label: string;
  code: string;
  args: string;
  env?: EnvEntry[];
  files?: FileEntry[];
}[] = [
  {
    label: 'Hello World',
    code: DEFAULT_CODE,
    args: '--name CLI-Forge',
  },
  {
    label: '--help',
    code: DEFAULT_CODE,
    args: '--help',
  },
  {
    label: 'Subcommands',
    code: `cli('git')
  .command('clone', {
    builder: (cmd) =>
      cmd.positional('repo', {
        type: 'string',
        required: true,
        description: 'Repository URL to clone',
      }),
    handler: (args) => {
      console.log(\`Cloning \${args.repo}...\`);
    },
  })
  .command('status', {
    handler: () => {
      console.log('On branch main');
      console.log('nothing to commit, working tree clean');
    },
  })
  .forge();
`,
    args: 'clone https://github.com/user/repo',
  },
  {
    label: 'Env Variables',
    code: `cli('server')
  .env('APP')
  .option('port', {
    type: 'number',
    description: 'Port to listen on',
    default: 3000,
  })
  .option('host', {
    type: 'string',
    description: 'Host to bind to',
    default: 'localhost',
  })
  .handler((args) => {
    console.log(\`Server listening on \${args.host}:\${args.port}\`);
  })
  .forge();
`,
    args: '',
    env: [
      { key: 'APP_PORT', value: '8080' },
      { key: 'APP_HOST', value: '0.0.0.0' },
    ],
  },
  {
    label: 'Config File',
    code: `cli('app')
  .config(
    getJsonFileConfigLoader('app.config.json')
  )
  .option('greeting', {
    type: 'string',
    default: 'Hello',
    description: 'The greeting to use',
  })
  .option('name', {
    type: 'string',
    default: 'World',
    description: 'Who to greet',
  })
  .handler((args) => {
    console.log(\`\${args.greeting}, \${args.name}!\`);
  })
  .forge();
`,
    args: '',
    files: [
      {
        path: '/app.config.json',
        content: JSON.stringify(
          { greeting: 'Howdy', name: 'Partner' },
          null,
          2
        ),
      },
    ],
  },
  {
    label: 'Validation',
    code: `cli('app')
  .option('port', {
    type: 'number',
    description: 'Port to listen on',
    required: true,
    validate: (v) => {
      if (v < 1 || v > 65535) throw new Error('Port must be 1-65535');
      return true;
    },
  })
  .option('host', {
    type: 'string',
    default: 'localhost',
    choices: ['localhost', '0.0.0.0', '127.0.0.1'],
    description: 'Host to bind to',
  })
  .handler((args) => {
    console.log(\`Server listening on \${args.host}:\${args.port}\`);
  })
  .forge();
`,
    args: '--port 3000 --host localhost',
  },
  {
    label: 'Boolean Flags',
    code: `cli('build')
  .option('watch', {
    type: 'boolean',
    alias: ['w'],
    description: 'Watch for changes',
  })
  .option('minify', {
    type: 'boolean',
    default: true,
    description: 'Minify output',
  })
  .option('sourcemap', {
    type: 'boolean',
    description: 'Generate source maps',
  })
  .handler((args) => {
    console.log('Build configuration:');
    console.log(\`  watch:     \${args.watch}\`);
    console.log(\`  minify:    \${args.minify}\`);
    console.log(\`  sourcemap: \${args.sourcemap}\`);
  })
  .forge();
`,
    args: '-w --no-minify --sourcemap',
  },
];
