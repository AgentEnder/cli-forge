import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function workspaceRoot(): string {
  let dir = __dirname;
  while (dir !== '.' && dir) {
    if (existsSync(join(dir, 'nx.json'))) {
      return dir;
    }
    dir = dirname(dir);
  }
  throw new Error(
    'Unable to locate workspace root from ' + __dirname
  );
}
