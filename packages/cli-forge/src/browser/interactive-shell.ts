import type { InternalCLI } from '../lib/internal-cli';

export interface InteractiveShellOptions {
  prompt?: string;
  prependArgs?: string[];
}

/**
 * Browser-safe interactive shell stub.
 *
 * The interactive subshell is a Node-only feature because it depends on
 * readline and child_process APIs.
 */
export let INTERACTIVE_SHELL: InteractiveShell | undefined;

export class InteractiveShell {
  constructor(_cli: InternalCLI<any>, _opts?: InteractiveShellOptions) {
    throw new Error('Interactive shell is only available in Node.js runtimes');
  }
}
