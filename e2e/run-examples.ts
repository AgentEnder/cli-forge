import { workspaceRoot } from '@nx/devkit';
import { execSync } from 'node:child_process';

import { readFileSync, readdirSync } from 'node:fs';
import { basename, join, sep } from 'node:path';

import { parse as loadYaml } from 'yaml';

const examplesRoot = join(workspaceRoot, 'examples') + sep;
const examples = collectExamples(join(examplesRoot, '../examples'));
for (const example of examples) {
  const { commands } = example.data;
  if (!commands || commands.length === 0) {
    // If no commands are provided, just run the example
    execSync(
      `tsx --tsconfig ${join(examplesRoot, 'tsconfig.json')} ${example.path}`
    );
  } else {
    // Otherwise, run each command
    for (const command of commands) {
      execSync(
        `tsx --tsconfig ${join(
          examplesRoot,
          'tsconfig.json'
        )} ${command.replace('{filename}', example.path)}`
      );
    }
  }
}

type FrontMatter = {
  id: string;
  title: string;
  description?: string;
  commands: string[];
};

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
        frontMatterLines.push(line.replace(/^\/\/\s?/, ''));
      }
    }
  } else if (line) {
    lines.unshift(line);
  }

  const yaml = frontMatterLines.join('\n');

  return {
    contents: lines.join('\n'),
    data: yaml ? loadYaml(yaml) : {},
  };
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
