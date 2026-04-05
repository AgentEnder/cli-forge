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
 * If given a file URL, converts it without depending on Node-only modules.
 * If given a string, returns it as-is.
 */
export function toFilePath(pathOrUrl: string | URL): string {
  if (!(pathOrUrl instanceof URL)) {
    return pathOrUrl;
  }

  if (pathOrUrl.protocol !== 'file:') {
    throw new Error(
      `Unsupported URL protocol "${pathOrUrl.protocol}" for configuration file path.`
    );
  }

  let pathname = decodeURIComponent(pathOrUrl.pathname);

  // Normalize Windows file URLs like file:///C:/path/to/file.json.
  if (/^\/[A-Za-z]:/.test(pathname)) {
    pathname = pathname.slice(1);
  }

  // Preserve UNC-style file URLs like file://server/share/config.json.
  if (pathOrUrl.host) {
    return `//${pathOrUrl.host}${pathname}`;
  }

  return pathname;
}
