import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function workspaceRoot(): string {
  let dir = import.meta.dirname;
  while (dir !== '.' && dir) {
    if (existsSync(join(dir, 'nx.json'))) {
      return dir;
    }
    dir = dirname(dir);
  }
  throw new Error(
    'Unable to locate workspace root from ' + import.meta.dirname
  );
}
