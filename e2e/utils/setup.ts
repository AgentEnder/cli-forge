import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const e2eRoot = join(__dirname, '../../tmp/e2e');
export let e2eSubDir = join(e2eRoot, 'default');
export let e2eProjectDir: string | null = null;

export function ensureCleanWorkingDirectory(): string {
  try {
    mkdirSync(e2eRoot, { recursive: true });
  } catch {
    if (!existsSync(e2eRoot)) {
      throw new Error(`Could not create directory: ${e2eRoot}`);
    }
  }

  try {
    rmSync(e2eSubDir, { recursive: true });
  } catch (e) {
    if (e.code !== 'ENOENT') {
      e2eSubDir = join(e2eRoot, Math.random().toString(36).substring(7));
    }
  }

  try {
    mkdirSync(e2eSubDir, { recursive: true });
  } catch {
    if (!existsSync(e2eSubDir)) {
      throw new Error(`Could not create directory: ${e2eSubDir}`);
    }
  }

  e2eProjectDir = null;

  return e2eSubDir;
}

export function setProjectDir(dir: string) {
  e2eProjectDir = join(e2eSubDir, dir);
}
