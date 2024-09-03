import { SpawnOptions, spawn } from 'child_process';
import { e2eProjectDir, e2eSubDir } from './setup';

export function runCommand(
  command: string,
  args: string[],
  options: SpawnOptions
) {
  const child = spawn(command, args, {
    shell: true,
    stdio: 'pipe',
    cwd: e2eProjectDir ?? e2eSubDir,
    ...options,
  });

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
