import { fileURLToPath } from 'node:url';

import { getFileSystemProvider } from '../environment-provider';

export function traverseForFile(
  configFileName: string,
  searchDir: string
): string | undefined {
  const fs = getFileSystemProvider();
  // Traverse up file system to find json file
  let prev: string | undefined;
  let current = searchDir;
  while (prev !== current) {
    prev = current;
    const testPath = fs.join(current, configFileName);
    if (fs.existsSync(testPath)) {
      return testPath;
    } else {
      current = fs.dirname(current);
    }
  }
  return undefined;
}

/**
 * Normalizes a string or URL to a file system path string.
 * If given a URL, converts it via `fileURLToPath` (only `file://` URLs are supported).
 * If given a string, returns it as-is.
 */
export function toFilePath(pathOrUrl: string | URL): string {
  return pathOrUrl instanceof URL ? fileURLToPath(pathOrUrl) : pathOrUrl;
}
