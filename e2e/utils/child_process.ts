import { SpawnOptions, spawn } from 'child_process';
import { e2eProjectDir, e2eSubDir } from './setup';

const localRegistry = process.env.E2E_NPM_REGISTRY ?? 'http://localhost:4873';

export function runCommand(
  command: string,
  args: string[],
  options: SpawnOptions & { stdin?: string }
) {
  const { stdin: stdinInput, ...spawnOptions } = options;

  const child = spawn(command, args, {
    shell: true,
    stdio: 'pipe',
    cwd: e2eProjectDir ?? e2eSubDir,
    env: {
      ...process.env,
      npm_config_registry: localRegistry,
      NPM_CONFIG_REGISTRY: localRegistry,
      ...(spawnOptions.env ?? {}),
    },
    ...spawnOptions,
  });

  // If stdin data was provided, write it and close the stream so the
  // child process sees EOF and doesn't hang waiting for more input.
  if (stdinInput !== undefined && child.stdin) {
    child.stdin.write(stdinInput);
    child.stdin.end();
  }

  return new Promise<{
    stdout: string;
    stderr: string;
  }>((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data;
    });

    child.stderr?.on('data', (data) => {
      stderr += data;
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(
          new Error(`Command failed: ${command} ${args.join(' ')}

        ${stderr}`)
        );
      }
    });
  });
}
