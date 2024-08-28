import { LoadContext } from '@docusaurus/types';
import { workspaceRoot } from '@nx/devkit';
import {
  blockQuote,
  codeBlock,
  h1,
  h2,
  lines,
  link,
  ul,
} from 'markdown-factory';

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, sep } from 'node:path';

import { parse as loadYaml, stringify } from 'yaml';

export async function ExamplesDocsPlugin(context: LoadContext) {
  const examplesRoot = join(workspaceRoot, 'examples') + sep;
  const examples = collectExamples(join(examplesRoot, '../examples'));
  for (const example of examples) {
    const relative = example.path.replace(examplesRoot, '');
    const destination = join(
      __dirname,
      '../../docs/examples',
      relative.replace('.ts', '.md')
    );
    ensureDirSync(dirname(destination));
    writeFileSync(destination, formatExampleMd(example));
  }
  ensureDirSync(join(__dirname, '../../docs/examples'));
  writeFileSync(
    join(__dirname, '../../docs/examples/index.md'),
    formatIndexMd(examples)
  );
  return {
    // a unique name for this plugin
    name: 'examples-docs-plugin',
  };
}

type FrontMatter = {
  id: string;
  title: string;
  description?: string;
  commands: (
    | string
    | {
        command: string;
        env: Record<string, string>;
      }
  )[];
};

function loadExampleFile(path: string): {
  contents: string;
  data: FrontMatter;
} {
  const contents = readFileSync(path, 'utf-8');
  const lines = contents.split('\n');
  const frontMatterLines = [];

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

function formatExampleMd({
  contents,
  data,
}: ReturnType<typeof collectExamples>[number]): string {
  const bodyLines = [h1(data.title)];
  if (data.description) {
    bodyLines.push(data.description);
  }
  bodyLines.push(h2('Code'));
  return `---
${stringify(data)}hide_title: true
---
${lines(bodyLines)}
\`\`\`ts title="${data.title}" showLineNumbers
${contents}
\`\`\`

${
  data.commands.length
    ? h2(
        'Usage',
        ...data.commands.map((config) => {
          const { command, env } =
            typeof config === 'string' ? { command: config, env: {} } : config;
          return codeBlock(
            `${
              Object.entries(env).length
                ? Object.entries(env)
                    .map((val) => val.join('='))
                    .join(' ') + ' '
                : ''
            }node ${command.replace('{filename}', './' + data.id)}.js`,
            'shell'
          );
        })
      )
    : ''
}

${e2eExamplesDisclaimer}
  `;
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

function formatIndexMd(examples: ReturnType<typeof collectExamples>): string {
  return `---
id: examples
title: Examples
---
${h1(
  'Examples',
  ul(
    examples.map((example) =>
      link(`examples/${example.data.id}`, example.data?.title)
    )
  ),
  e2eExamplesDisclaimer
)}
`;
}

const e2eExamplesDisclaimer = blockQuote(
  'These examples are ran as e2e tests on pull-requests and releases to verify they are accurate and up to date. If you see any issues, please open an issue on the github repo.'
);

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
function ensureDirSync(path: string): void {
  try {
    mkdirSync(path, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create directory: ${path}`);
  }
}
