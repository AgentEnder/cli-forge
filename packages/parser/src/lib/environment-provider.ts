/**
 * Abstracts access to environment variables and the working directory.
 *
 * The parser uses this interface for every `process.env` read/write and
 * `process.cwd()` call, which means consumers can supply a custom
 * implementation (e.g. an in-memory provider for browser playgrounds).
 */
export interface EnvironmentProvider {
  /**
   * Read an environment variable. Return `undefined` when the variable
   * is not set.
   */
  getEnv(key: string): string | undefined;

  /**
   * Write (or overwrite) an environment variable.
   */
  setEnv(key: string, value: string): void;

  /**
   * Return the current working directory, used as the root for
   * configuration-file resolution.
   */
  cwd(): string;
}

/**
 * Abstracts file-system and path operations so the parser and CLI layer
 * can run in environments without Node's `fs` / `path` modules
 * (e.g. browsers with an in-memory virtual FS).
 */
export interface FileSystemProvider {
  // ── file operations ──────────────────────────────────────────────

  /** Check whether a file or directory exists at `path`. */
  existsSync(path: string): boolean;

  /** Read the entire contents of `path` as a UTF-8 string. */
  readFileSync(path: string): string;

  /** Overwrite (or create) `path` with `data`. */
  writeFileSync(path: string, data: string): void;

  /** Async version of {@link writeFileSync}. */
  writeFile(path: string, data: string): Promise<void>;

  /** Append `data` to the end of `path`. */
  appendFileSync(path: string, data: string): void;

  /** List the entries (file and directory names) inside `dir`. */
  readdirSync(dir: string): string[];

  /** Create `dir` and any missing parent directories. */
  mkdirSync(dir: string, options?: { recursive?: boolean }): void;

  // ── path operations ──────────────────────────────────────────────

  /** Join path segments with the platform separator. */
  join(...parts: string[]): string;

  /** Resolve a sequence of paths into an absolute path. */
  resolve(...parts: string[]): string;

  /** Return the directory portion of `path`. */
  dirname(path: string): string;

  /** Return the final segment of `path`. */
  basename(path: string): string;
}

// ── Re-export Node implementations ───────────────────────────────────
// These live in a separate module so the top-level `import fs` only
// appears in a file that bundlers can tree-shake when targeting browsers.

export { NodeEnvironmentProvider, NodeFileSystemProvider } from './node-providers';

// ── In-memory implementations ────────────────────────────────────────

/**
 * An in-memory environment provider for testing, browser playgrounds,
 * or any context where real process state should not be touched.
 */
export class MemoryEnvironmentProvider implements EnvironmentProvider {
  private readonly env: Record<string, string>;
  private readonly workingDirectory: string;

  constructor(opts?: {
    env?: Record<string, string>;
    cwd?: string;
  }) {
    this.env = { ...opts?.env };
    this.workingDirectory = opts?.cwd ?? '/';
  }

  getEnv(key: string): string | undefined {
    return this.env[key];
  }

  setEnv(key: string, value: string): void {
    this.env[key] = value;
  }

  cwd(): string {
    return this.workingDirectory;
  }
}

/**
 * An in-memory file-system provider backed by a `Record<string, string>`.
 * Files are keyed by their full path; directories are inferred.
 */
export class MemoryFileSystemProvider implements FileSystemProvider {
  readonly files: Record<string, string>;

  constructor(files?: Record<string, string>) {
    this.files = { ...files };
  }

  existsSync(path: string): boolean {
    const normalized = this.normalize(path);
    if (normalized in this.files) return true;
    // Check if any file lives under this path (i.e. it's a directory)
    const prefix = normalized.endsWith('/') ? normalized : normalized + '/';
    return Object.keys(this.files).some((k) => k.startsWith(prefix));
  }

  readFileSync(path: string): string {
    const normalized = this.normalize(path);
    if (!(normalized in this.files)) {
      throw new Error(`ENOENT: no such file '${path}'`);
    }
    return this.files[normalized];
  }

  writeFileSync(path: string, data: string): void {
    this.files[this.normalize(path)] = data;
  }

  async writeFile(path: string, data: string): Promise<void> {
    this.writeFileSync(path, data);
  }

  appendFileSync(path: string, data: string): void {
    const normalized = this.normalize(path);
    this.files[normalized] = (this.files[normalized] ?? '') + data;
  }

  readdirSync(dir: string): string[] {
    const normalized = this.normalize(dir);
    const prefix = normalized.endsWith('/') ? normalized : normalized + '/';
    const entries = new Set<string>();
    for (const key of Object.keys(this.files)) {
      if (key.startsWith(prefix)) {
        const rest = key.slice(prefix.length);
        const firstSegment = rest.split('/')[0];
        if (firstSegment) entries.add(firstSegment);
      }
    }
    return [...entries];
  }

  mkdirSync(): void {
    // Directories are implicit — nothing to do.
  }

  join(...parts: string[]): string {
    return this.normalize(parts.join('/'));
  }

  resolve(...parts: string[]): string {
    return this.normalize(parts.join('/'));
  }

  dirname(p: string): string {
    const normalized = this.normalize(p);
    const idx = normalized.lastIndexOf('/');
    return idx <= 0 ? '/' : normalized.slice(0, idx);
  }

  basename(p: string): string {
    const normalized = this.normalize(p);
    const idx = normalized.lastIndexOf('/');
    return idx < 0 ? normalized : normalized.slice(idx + 1);
  }

  private normalize(p: string): string {
    // Collapse repeated slashes, resolve . and .., ensure leading /
    const parts = p.split('/').filter(Boolean);
    const resolved: string[] = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        resolved.pop();
      } else {
        resolved.push(part);
      }
    }
    return '/' + resolved.join('/');
  }
}

// ── Environment detection ────────────────────────────────────────────

/**
 * Returns `true` when running inside Node.js (or a Node-compatible runtime
 * like Bun/Deno with Node compat).  Returns `false` in browsers and other
 * non-Node environments.
 */
function isNodeLike(): boolean {
  return (
    typeof process !== 'undefined' &&
    typeof process.versions !== 'undefined' &&
    typeof process.versions.node === 'string'
  );
}

// ── Module-level singletons ──────────────────────────────────────────

// The Node providers are re-exported above from `./node-providers`,
// which statically imports `fs` and `path`.  In CJS builds this is a
// normal `require('fs')` that works in Node.  In ESM builds it becomes
// a static `import` — bundlers targeting the browser replace the Node
// builtins with empty stubs automatically.
//
// We import the classes here (separate from the re-export) so we can
// use them for the default singleton initialisation.
import { NodeEnvironmentProvider, NodeFileSystemProvider } from './node-providers';

let _env: EnvironmentProvider = isNodeLike()
  ? new NodeEnvironmentProvider()
  : new MemoryEnvironmentProvider();

let _fs: FileSystemProvider = isNodeLike()
  ? new NodeFileSystemProvider()
  : new MemoryFileSystemProvider();

/**
 * Return the current global {@link EnvironmentProvider}.
 */
export function getEnvironmentProvider(): EnvironmentProvider {
  return _env;
}

/**
 * Replace the global {@link EnvironmentProvider}.
 * Call before parsing to redirect all env-var reads/writes.
 */
export function setEnvironmentProvider(provider: EnvironmentProvider): void {
  _env = provider;
}

/**
 * Return the current global {@link FileSystemProvider}.
 */
export function getFileSystemProvider(): FileSystemProvider {
  return _fs;
}

/**
 * Replace the global {@link FileSystemProvider}.
 * Call before parsing to redirect all file-system operations.
 */
export function setFileSystemProvider(provider: FileSystemProvider): void {
  _fs = provider;
}
