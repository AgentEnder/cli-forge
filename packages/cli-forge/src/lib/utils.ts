import { existsSync } from 'fs';
import { join, resolve } from 'path';

export function getCallingFile() {
  // Since this function lives in a utility file, the parent file
  // would just be the file that invokes getCallingFile... We actually
  // want the parent of the file that calls this, which is this file's
  // grandparent.
  let grandparentFile: string | undefined;

  // Overrides prepare stack trace to be an identity fn, to get the callsites
  // associated with the current error.
  const _pst = Error.prepareStackTrace;
  Error.prepareStackTrace = function (err, stack) {
    return stack;
  };

  try {
    const err = new Error();
    const callsites = err.stack as any as NodeJS.CallSite[];

    let currentfile = callsites.shift()!.getFileName();
    let parentfile: string | undefined;

    while (callsites.length) {
      const callerfile = callsites.shift()!.getFileName();

      // We've reached the parent file
      if (currentfile !== callerfile) {
        // We've reached the grandparent file
        if (parentfile && parentfile !== callerfile) {
          grandparentFile = parentfile;
          break;
        }
        parentfile = callerfile;
      }
    }
  } finally {
    Error.prepareStackTrace = _pst;
  }

  return grandparentFile;
}

export function getParentPackageJson(searchPath: string) {
  let currentPath = searchPath;
  let packageJsonPath: string | undefined;

  while (true) {
    const packagePath = join(currentPath, 'package.json');

    if (existsSync(packagePath)) {
      packageJsonPath = packagePath;
      break;
    }

    const nextPath = resolve(currentPath, '..');

    if (nextPath === currentPath) {
      break;
    }

    currentPath = nextPath;
  }

  if (!packageJsonPath) {
    throw new Error('Could not find package.json');
  }

  return require(packageJsonPath) as {
    name: string;
    version: string;
    bin?: {
      [cmd: string]: string;
    };
    dependencies?: Record<string, string>;
  };
}
