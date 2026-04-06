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
