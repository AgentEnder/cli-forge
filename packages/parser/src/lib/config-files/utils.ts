import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function traverseForFile(
  configFileName: string,
  searchDir = process.cwd()
) {
  // Traverse up file system to find json file
  let prev: string | undefined;
  let current = searchDir;
  while (prev !== current) {
    prev = current;
    const testPath = join(current, configFileName);
    if (existsSync(testPath)) {
      return testPath;
    } else {
      current = dirname(current);
    }
  }
  return undefined;
}
