---
title: Browser Usage
description: Using cli-forge in browser environments like playgrounds, documentation sites, and web-based tools
nav:
  order: 8
---

# Browser Usage

Both `cli-forge` and `@cli-forge/parser` ship with browser-compatible builds. This means you can run CLI parsing, help generation, and command execution directly in the browser — useful for interactive playgrounds, documentation sites, and web-based developer tools.

## How it works

Each package publishes three build outputs:

| Output | Path | Description |
|--------|------|-------------|
| **CJS** | `dist/*.cjs` | CommonJS for Node.js `require()` |
| **ESM** | `dist/*.mjs` | ES modules for Node.js `import` |
| **Browser** | `dist/browser/index.mjs` | Single ESM bundle with no Node.js dependencies |

The browser build replaces Node-specific providers (file system, environment variables, `readline`, `child_process`) with safe no-op stubs. Features that depend on Node APIs — like config file loading, interactive shells, and shell completions — gracefully degrade rather than throwing errors.

## Bundler support

The browser build is exposed via the `"browser"` [export condition](https://nodejs.org/api/packages.html#conditional-exports) in each package's `package.json`:

```json
"exports": {
  ".": {
    "browser": "./dist/browser/index.mjs",
    "import": "./dist/index.mjs",
    "require": "./dist/index.cjs"
  }
}
```

### Works automatically

- **Vite** — resolves the `"browser"` condition by default
- **webpack** — resolves `"browser"` when `target` is `'web'` (the default)

### Requires configuration

- **esbuild** — pass `--conditions=browser` or set `conditions: ['browser']` in the API
- **Rollup** — use `@rollup/plugin-node-resolve` with `browser: true`

If your bundler doesn't resolve the `"browser"` condition, you'll get the Node ESM build which imports `fs`, `path`, etc. and will fail in the browser.

## In-memory providers

For interactive use cases (like the [Playground](/playground)), you can swap the default providers with in-memory implementations:

```typescript
import { cli } from 'cli-forge';
import {
  setEnvironmentProvider,
  setFileSystemProvider,
  MemoryEnvironmentProvider,
  MemoryFileSystemProvider,
} from '@cli-forge/parser';

// Set up virtual environment
setEnvironmentProvider(
  new MemoryEnvironmentProvider({
    env: { MY_APP_PORT: '8080' },
    cwd: '/app',
  })
);

setFileSystemProvider(
  new MemoryFileSystemProvider({
    '/app/config.json': JSON.stringify({ port: 3000 }),
  })
);

// Now cli-forge will read env vars and config files from memory
const app = cli('my-app')
  .env('MY_APP')
  .config(ConfigurationProviders.JsonFile('config.json'))
  .option('port', { type: 'number', default: 3000 })
  .handler((args) => {
    console.log(`Port: ${args.port}`);
  });

await app.forge(['--help']);
```

### `MemoryEnvironmentProvider`

| Method | Behavior |
|--------|----------|
| `getEnv(key)` | Returns from the in-memory env record |
| `setEnv(key, value)` | Writes to the in-memory env record |
| `cwd()` | Returns the configured working directory (default `'/'`) |

### `MemoryFileSystemProvider`

Backed by a `Record<string, string>` where keys are absolute paths and values are file contents. Directories are inferred from file paths.

| Method | Behavior |
|--------|----------|
| `existsSync(path)` | Checks if the path exists as a file or directory prefix |
| `readFileSync(path)` | Returns the file content or throws `ENOENT` |
| `writeFileSync(path, data)` | Stores the content at the given path |
| `readdirSync(dir)` | Lists entries under the directory |
| `join(...parts)` | Joins with `/` and normalizes |
| `resolve(...parts)` | Same as `join` (no real CWD resolution) |
| `dirname(path)` / `basename(path)` | Pure string operations |

## What doesn't work in the browser

The following features require Node.js and are no-ops or throw descriptive errors in the browser:

- **Config file loading from disk** — use `MemoryFileSystemProvider` instead
- **Environment variable reading from `process.env`** — use `MemoryEnvironmentProvider` instead
- **Interactive shell** (`enableInteractiveShell`) — requires `readline` and a TTY
- **Shell completion installation** — requires writing to the user's shell config files
- **`process.exit()`** — the error handler's `exit()` action is a no-op
- **Version detection from `package.json`** — set an explicit version with `.version('1.0.0')` instead
