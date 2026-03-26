let _existsSync: ((path: string) => boolean) | undefined;
let _dirname: ((path: string) => string) | undefined;
let _join: ((...paths: string[]) => string) | undefined;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  _existsSync = require('node:fs').existsSync;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodePath = require('node:path');
  _dirname = nodePath.dirname;
  _join = nodePath.join;
} catch {
  // Running in a browser environment — config file traversal is unavailable.
}

export function traverseForFile(
  configFileName: string,
  searchDir?: string
): string | undefined {
  if (!_existsSync || !_dirname || !_join) return undefined;
  const startDir = searchDir ?? (typeof process !== 'undefined' ? process.cwd() : '/');
  // Traverse up file system to find json file
  let prev: string | undefined;
  let current = startDir;
  while (prev !== current) {
    prev = current;
    const testPath = _join(current, configFileName);
    if (_existsSync(testPath)) {
      return testPath;
    } else {
      current = _dirname(current);
    }
  }
  return undefined;
}
