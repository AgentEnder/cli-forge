import { workspaceRoot } from '@nx/devkit';
import { execSync } from 'node:child_process';

import { readFileSync, readdirSync } from 'node:fs';
import { basename, join, sep } from 'node:path';

import { parse as loadYaml } from 'yaml';

const examplesRoot = join(workspaceRoot, 'examples') + sep;
const examples = collectExamples(join(examplesRoot, '../examples'));

let success = true;

for (const example of examples) {
  const { commands } = example.data;
  if (!commands || commands.length === 0) {
    // If no commands are provided, just run the example
    success &&= runExampleCommand(
      `tsx --tsconfig ${join(examplesRoot, 'tsconfig.json')} ${example.path}`,
      example.data.id
    );
  } else {
    // Otherwise, run each command
    for (const config of commands) {
      const command = typeof config === 'string' ? config : config.command;
      const env = typeof config === 'string' ? {} : config.env;
      success &&= runExampleCommand(
        {
          command: `tsx --tsconfig ${join(
            examplesRoot,
            'tsconfig.json'
          )} ${command.replace('{filename}', example.path)}`,
          env,
        },
        `${example.data.id} > ${command}`
      );
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

type FrontMatter = {
  id: string;
  title: string;
  description?: string;
  commands: (string | { command: string; env: Record<string, string> })[];
};

function runExampleCommand(
  config: FrontMatter['commands'][number],
  label: string
) {
  const command = typeof config === 'string' ? config : config.command;
  const env = typeof config === 'string' ? {} : config.env;
  try {
    process.stdout.write('▶️ ' + label);
    const a = performance.now();
    execSync(command, { stdio: 'pipe', env: { ...process.env, ...env } });
    const b = performance.now();
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
      console.error(e.stderr.toString());
    }

    return false;
  }
  return true;
}

function loadExampleFile(path: string): {
  contents: string;
  data: FrontMatter;
} {
  const contents = readFileSync(path, 'utf-8');
  const lines = contents.split('\n');
  const frontMatterLines: string[] = [];

  let line = lines.shift();
  if (line && line.startsWith('// ---')) {
    while (true) {
      line = lines.shift();
      if (!line) {
        throw new Error('Unexpected end of file');
      }
      if (line.startsWith('// ---')) {
        break;
      } else {
        frontMatterLines.push(line.replace(/^\/\/\s?/, '').trimEnd());
      }
    }
  } else if (line) {
    lines.unshift(line);
  }
  try {
    const yaml = frontMatterLines.join('\n');

    return {
      contents: lines.join('\n'),
      data: yaml ? loadYaml(yaml) : {},
    };
  } catch (e) {
    throw new Error(
      `Invalid front matter in ${path}.` +
        '\n' +
        frontMatterLines.map((l) => `\t${l}`).join('\n'),
      { cause: e }
    );
  }
}

function normalizeFrontMatter(
  example: Omit<ReturnType<typeof collectExamples>[number], 'data'> & {
    data: Partial<FrontMatter>;
  }
): ReturnType<typeof collectExamples>[number] {
  const { data, path } = example;
  const defaultName = basename(path).replace('.ts', '');

  return {
    ...example,
    data: {
      id: data?.id ?? defaultName.replace(/\//g, '-'),
      title: data?.title ?? defaultName,
      commands: [],
      ...data,
    },
  };
}

// returns all .ts files from given path
function collectExamples(root: string): {
  path: string;
  contents: string;
  data: FrontMatter;
}[] {
  const files = readdirSync(root, { withFileTypes: true });
  const collected: {
    path: string;
    contents: string;
    data: FrontMatter;
  }[] = [];
  for (const file of files) {
    if (file.isDirectory()) {
      collected.push(...collectExamples(join(root, file.name)));
    } else {
      if (file.name.endsWith('.ts')) {
        const path = join(root, file.name);
        const loaded = loadExampleFile(path);
        collected.push(
          normalizeFrontMatter({
            path,
            data: loaded.data,
            contents: loaded.contents,
          })
        );
      }
    }
  }
  return collected;
}
