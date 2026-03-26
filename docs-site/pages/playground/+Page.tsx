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

export default function PlaygroundPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [args, setArgs] = useState('--name CLI-Forge');
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
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

      // Transform code:
      // 1. Strip import statements for cli-forge
      // 2. Replace .forge() with .forge(argv)
      let transformed = code
        // Remove ESM imports
        .replace(
          /import\s+\{[^}]*\}\s+from\s+['"]cli-forge['"];?\s*/g,
          ''
        )
        .replace(
          /import\s+(\w+)\s+from\s+['"]cli-forge['"];?\s*/g,
          ''
        )
        // Remove CJS requires
        .replace(
          /(?:const|let|var)\s+\{[^}]*\}\s*=\s*require\s*\(\s*['"]cli-forge['"]\s*\)\s*;?\s*/g,
          ''
        );

      // Replace .forge() with .forge(argv) — but only bare .forge() calls
      transformed = transformed.replace(
        /\.forge\(\s*\)/g,
        '.forge(__argv__)'
      );

      // Wrap in an async function with cli-forge available
      const { default: cliForge, cli: cliFn } = await import('cli-forge');
      const cli = cliFn || cliForge;

      const AsyncFunction = Object.getPrototypeOf(
        async function () {}
      ).constructor;
      const fn = new AsyncFunction('cli', '__argv__', transformed);
      await fn(cli, argv);
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
      setOutput([...logs]);
      setRunning(false);
    }
  }, [code, args]);

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

  return (
    <div>
      <h1 className="text-3xl font-bold text-forge-flame-bright mb-3 font-[Cinzel]">
        Playground
      </h1>
      <p className="text-forge-ash mb-6 max-w-2xl">
        Write CLI Forge code and see how it responds to different arguments.
        The <code className="text-forge-flame px-1 py-0.5 bg-forge-bg-surface rounded text-sm">cli</code> function
        is available globally — no import needed.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" onKeyDown={handleKeyDown}>
        {/* Editor Panel */}
        <div className="flex flex-col gap-3">
          <div className="border border-forge-iron rounded-lg overflow-hidden bg-forge-bg-surface">
            <div className="flex items-center justify-between px-3 py-2 border-b border-forge-iron bg-forge-bg/50">
              <span className="text-xs font-medium text-forge-ash-dim uppercase tracking-wider">
                Code
              </span>
              <span className="text-xs text-forge-ash-dim">
                {typeof navigator !== 'undefined' &&
                navigator.platform?.includes('Mac')
                  ? '⌘'
                  : 'Ctrl'}
                +Enter to run
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
                Click &quot;Run&quot; or press{' '}
                {typeof navigator !== 'undefined' &&
                navigator.platform?.includes('Mac')
                  ? '⌘'
                  : 'Ctrl'}
                +Enter to see output...
              </span>
            )}
            {output.map((line, i) => (
              <div key={i} className={`whitespace-pre-wrap ${line.startsWith('[stderr]') ? 'text-red-400' : line.startsWith('[warn]') ? 'text-yellow-400' : 'text-forge-smoke'}`}>
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

const EXAMPLES: { label: string; code: string; args: string }[] = [
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
    label: 'Validation',
    code: `cli('app')
  .option('port', {
    type: 'number',
    description: 'Port to listen on',
    required: true,
    validate: (v) => {
      if (v < 1 || v > 65535) throw new Error('Port must be between 1 and 65535');
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
  {
    label: 'Arrays',
    code: `cli('deploy')
  .option('env', {
    type: 'array',
    itemType: 'string',
    description: 'Environment variables (KEY=VALUE)',
  })
  .option('tags', {
    type: 'array',
    itemType: 'string',
    description: 'Tags for the deployment',
  })
  .handler((args) => {
    console.log('Deploying with:');
    if (args.env?.length) {
      console.log('  Environment:');
      for (const e of args.env) console.log(\`    \${e}\`);
    }
    if (args.tags?.length) {
      console.log(\`  Tags: \${args.tags.join(', ')}\`);
    }
  })
  .forge();
`,
    args: '--env NODE_ENV=production --env PORT=3000 --tags v1.0 --tags stable',
  },
];
