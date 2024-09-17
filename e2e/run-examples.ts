import { workspaceRoot } from '@nx/devkit';
import { execSync } from 'node:child_process';

import { dirname, join, sep } from 'node:path';

import {
  CommandConfiguration,
  FrontMatter,
  collectExamples,
} from '../tools/scripts/collect-examples';

const examplesRoot = join(workspaceRoot, 'examples') + sep;
const examples = collectExamples(join(examplesRoot, '../examples'));

let success = true;

for (const example of examples) {
  const { commands } = example.data;
  if (!commands || commands.length === 0) {
    // If no commands are provided, just run the example
    success &&= runExampleCommand(
      {
        command: `tsx --tsconfig ${join(examplesRoot, 'tsconfig.json')} ${
          example.data.entryPoint
        }`,
        env: {},
      },
      example.data.id,
      dirname(example.data.entryPoint)
    );
  } else {
    // Otherwise, run each command
    for (const config of commands) {
      const commandConfiguration =
        typeof config === 'string' ? { command: config, env: {} } : config;
      const command = commandConfiguration.command;
      (commandConfiguration.command = `tsx --tsconfig ${join(
        examplesRoot,
        'tsconfig.json'
      )} ${command.replace('{filename}', example.data.entryPoint)}`),
        (success &&= runExampleCommand(
          commandConfiguration,
          `${example.data.id} > ${command}`,
          dirname(example.data.entryPoint)
        ));
    }
  }
}

try {
  process.stdout.write('▶️ Checking TypeScript types for all examples');
  const a = performance.now();
  execSync(`tsc -p tsconfig.json --noEmit`, { cwd: examplesRoot });
  const b = performance.now();
  process.stdout.write('\r');
  console.log(
    `✅ TypeScript compilation (${Math.round((b - a) * 10) / 10}ms)`.padEnd(
      process.stdout.columns,
      ' '
    )
  );
} catch (e) {
  process.stdout.write('\r');
  console.log('❌ TypeScript compilation');

  if (e.stdout) {
    console.log(e.stdout.toString());
  }

  if (e.stderr) {
    console.error(e.stderr.toString());
  }

  success = false;
}

if (!success) {
  process.exit(1);
}

function runExampleCommand(
  config: CommandConfiguration,
  label: string,
  cwd: string
) {
  const command = typeof config === 'string' ? config : config.command;
  const env = typeof config === 'string' ? {} : config.env;
  try {
    process.stdout.write('▶️ ' + label);
    const a = performance.now();
    const output = execSync(command, {
      stdio: 'pipe',
      env: { ...process.env, ...env },
      cwd,
    }).toString();
    const b = performance.now();
    checkAssertions(output, config.assertions);
    // move cursor to the beginning of the line
    process.stdout.write('\r');
    console.log(
      `✅ ${label} (${Math.round((b - a) * 10) / 10}ms)`.padEnd(
        process.stdout.columns,
        ' '
      )
    );
  } catch (e) {
    // move cursor to the beginning of the line
    process.stdout.write('\r');
    console.log(`❌ ${label}`.padEnd(process.stdout.columns, ' '));

    if (e.stdout) {
      console.log(e.stdout.toString());
    }

    if (e.stderr) {
      console.log(e.stderr.toString());
    }

    if (!e.stdout && !e.stderr) {
      console.log(e.toString());
    }

    return false;
  }
  return true;
}

function checkAssertions(
  output: string,
  assertions: CommandConfiguration['assertions']
) {
  if (!assertions) return true;

  for (const assertion of assertions) {
    if (assertion.contains && !output.includes(assertion.contains)) {
      throw new Error(
        `Output does not contain "${assertion.contains}". Received:\n${output}`
      );
    }
  }

  return true;
}
