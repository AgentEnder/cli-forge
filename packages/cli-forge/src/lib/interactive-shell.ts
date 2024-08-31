import * as readline from 'readline';
import { stringToArgs } from './utils';
import { InternalCLI } from './cli-forge';
import { execSync, spawnSync } from 'child_process';
import { getBin } from '@cli-forge/parser';

export interface InteractiveShellOptions {
  prompt?: string;
  prependArgs?: string[];
}

type NormalizedInteractiveShellOptions = Required<InteractiveShellOptions>;

function normalizeShellOptions(
  cli: InternalCLI,
  options?: InteractiveShellOptions
): NormalizedInteractiveShellOptions {
  return {
    prompt:
      options?.prompt ??
      (() => {
        const chain = [cli.name];
        if (cli.commandChain.length > 2) {
          chain.push('...', ...cli.commandChain[cli.command.length - 1]);
        } else {
          chain.push(...cli.commandChain);
        }
        return chain.join(' ') + '> ';
      })(),
    prependArgs: options?.prependArgs ?? [],
  };
}

export let INTERACTIVE_SHELL: InteractiveShell | undefined;

export class InteractiveShell {
  private readonly rl: readline.Interface;
  private listeners: any[] = [];

  constructor(cli: InternalCLI<any>, opts?: InteractiveShellOptions) {
    if (INTERACTIVE_SHELL) {
      throw new Error(
        'Only one interactive shell can be created at a time. Make sure the other instance is closed.'
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    INTERACTIVE_SHELL = this;

    const { prompt, prependArgs } = normalizeShellOptions(cli, opts);

    this.rl = readline
      .createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: prompt,
      })
      .on('SIGINT', () => {
        process.emit('SIGINT');
      });

    this.rl.prompt();

    this.registerLineListener(async (line) => {
      const nextArgs = stringToArgs(line);
      let currentCommand = cli;
      for (const subcommand of cli.commandChain) {
        currentCommand = currentCommand.registeredCommands[subcommand];
      }
      if (currentCommand.registeredCommands[nextArgs[0]]) {
        spawnSync(
          process.execPath,
          [
            ...process.execArgv,
            getBin(process.argv),
            ...prependArgs,
            ...nextArgs,
          ],
          { stdio: 'inherit' }
        );
      } else if (line.trim()) {
        try {
          execSync(line, { stdio: 'inherit' });
        } catch {
          // ignore
        }
      }
    });
  }

  registerLineListener(callback: (line: string) => Promise<void>) {
    const wrapped = async (line: string) => {
      this.rl.pause();
      await callback(line);
      this.rl.prompt();
    };
    this.listeners.push(wrapped);
    this.rl.on('line', wrapped);
  }

  close() {
    this.listeners.forEach((listener) => this.rl.off('line', listener));
    this.rl.close();
    readline.moveCursor(process.stdout, -1 * this.rl.getCursorPos().cols, 0);
    readline.clearScreenDown(process.stdout);
    if (INTERACTIVE_SHELL === this) {
      INTERACTIVE_SHELL = undefined;
    }
  }
}
