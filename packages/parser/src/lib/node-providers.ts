/**
 * Node.js-specific provider implementations.
 *
 * This module uses top-level imports of `fs`, `fs/promises`, and `path`.
 * In CJS builds these are `require()` calls that resolve normally in Node.
 * In ESM builds they become `import` statements — bundlers targeting the
 * browser will either tree-shake this module away (since it's only imported
 * when `isNodeLike()` is true at the module-level singleton init) or
 * replace the builtins with empty stubs.
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
