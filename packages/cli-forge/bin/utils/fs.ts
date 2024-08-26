import { existsSync, mkdirSync } from 'node:fs';

export function ensureDirSync(dir: string) {
  try {
    mkdirSync(dir, { recursive: true });
  } catch (e) {
    if (!existsSync(dir)) {
      throw new Error(`Could not create directory: ${dir}`, { cause: e });
    }
  }
}
