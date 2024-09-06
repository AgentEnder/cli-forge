import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { CLI } from './public-api';

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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const currentfile = callsites.shift()!.getFileName();
    let parentfile: string | undefined;

    while (callsites.length) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

  // eslint-disable-next-line no-constant-condition
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

  return JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
    name: string;
    version: string;
    bin?: {
      [cmd: string]: string;
    };
    dependencies?: Record<string, string>;
  };
}

export function stringToArgs(str: string) {
  const quotePairs = new Map<string, string>([
    ['"', '"'],
    ["'", "'"],
    ['`', '`'],
  ]);
  const escapeChars = new Set(['\\']);

  let activeQuote: string | undefined;

  const args = [];
  let currentArg = '';

  let prev: string | undefined;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (activeQuote) {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (i >= str.length) {
          break;
        } else if (
          str[i] === quotePairs.get(activeQuote) &&
          !(prev && escapeChars.has(prev))
        ) {
          break;
        }
        if (!escapeChars.has(str[i])) {
          currentArg += str[i];
        }
        prev = str[i];
        i++;
      }
      activeQuote = undefined;
    } else if (quotePairs.has(char) && !(prev && escapeChars.has(prev))) {
      activeQuote = char;
    } else if (
      char === ' ' &&
      prev !== ' ' &&
      !(prev && escapeChars.has(prev))
    ) {
      args.push(currentArg);
      currentArg = '';
    } else if (!escapeChars.has(char) || (prev && escapeChars.has(prev))) {
      currentArg += char;
    }
    prev = char;
  }
  args.push(currentArg);
  return args;
}

/**
 * Resolves the arguments added to a CLI instance by a builder function. Useful
 * for typing the arguments of a command handler when using composable builders.
 *
 * @typeParam T - A function that takes a CLI instance and returns a new CLI instance with additional options, commands etc.
 */
export type ArgumentsOf<T> = T extends (...args: any[]) => CLI<infer TArgs>
  ? TArgs
  : never;
