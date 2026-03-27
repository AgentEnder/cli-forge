/**
 * Node.js-specific provider implementations.
 *
 * This module uses standard static imports of Node builtins.
 * The library build (vite.config.ts) rewrites these to dynamic
 * `import().catch()` in the ESM output so they fail gracefully
 * in browsers.  CJS output uses normal `require()`.
 */
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';

import type { EnvironmentProvider, FileSystemProvider } from './environment-provider';

/**
 * Default provider that delegates to Node's `process` global.
 */
export class NodeEnvironmentProvider implements EnvironmentProvider {
  getEnv(key: string): string | undefined {
    return process.env[key];
  }

  setEnv(key: string, value: string): void {
    process.env[key] = value;
  }

  cwd(): string {
    return process.cwd();
  }
}

/**
 * Default file-system provider that delegates to Node's `fs` and `path`.
 */
export class NodeFileSystemProvider implements FileSystemProvider {
  existsSync(p: string): boolean {
    return fs.existsSync(p);
  }

  readFileSync(p: string): string {
    return fs.readFileSync(p, 'utf-8');
  }

  writeFileSync(p: string, data: string): void {
    fs.writeFileSync(p, data);
  }

  async writeFile(p: string, data: string): Promise<void> {
    await fsPromises.writeFile(p, data);
  }

  appendFileSync(p: string, data: string): void {
    fs.appendFileSync(p, data);
  }

  readdirSync(dir: string): string[] {
    return fs.readdirSync(dir) as string[];
  }

  mkdirSync(dir: string, options?: { recursive?: boolean }): void {
    fs.mkdirSync(dir, options);
  }

  join(...parts: string[]): string {
    return path.join(...parts);
  }

  resolve(...parts: string[]): string {
    return path.resolve(...parts);
  }

  dirname(p: string): string {
    return path.dirname(p);
  }

  basename(p: string): string {
    return path.basename(p);
  }
}
