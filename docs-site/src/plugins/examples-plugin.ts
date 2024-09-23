import { LoadContext, Plugin } from '@docusaurus/types';
import { workspaceRoot } from '@nx/devkit';
import {
  blockQuote,
  codeBlock,
  h1,
  h2,
  h3,
  lines,
  link,
  ul,
} from 'markdown-factory';

import { compressToEncodedURIComponent } from 'lz-string';

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';

import { stringify } from 'yaml';

import {
  CommandConfiguration,
  Example,
  collectExamples,
} from '../../../tools/scripts/collect-examples';

function getRelativePath(filepath: string, root: string) {
  return filepath.replace(root, '').replace(/\\/g, '/').replace('^/', '');
}

export const ExamplesDocsPlugin = async (
  context: LoadContext
): Promise<Plugin> => {
  const examplesRoot = join(workspaceRoot, 'examples') + sep;
  const examples = collectExamples(join(examplesRoot, '../examples'));

  for (const example of examples) {
    const relative = (
      example.files.length > 1
        ? dirname(example.files[0].path)
        : example.files[0].path
    ).replace(examplesRoot, '');
    const destination = join(
      __dirname,
      '../../docs/examples',
      relative.endsWith('.ts')
        ? relative.replace('.ts', '.md')
        : `${relative}.md`
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

    async contentLoaded({ content, actions }) {
      const { createData, addRoute } = actions;

      const examplesJsonPath = await createData(
        'examples.json',
        JSON.stringify(examples, null, 2)
      );

      console.log('Adding playground route', `${context.baseUrl}playground`);

      addRoute({
        path: `${context.baseUrl}playground`,
        component: '@site/pages/playground.tsx',
        modules: {
          examples: examplesJsonPath,
        },
        exact: true,
      });
    },
  };
};

function getEntryPoint(example: Example) {
  console.log(
    example.data.entryPoint,
    example.files.map((f) => f.path)
  );
  return example.files.find((file) => file.path === example.data.entryPoint);
}

function formatExampleMd({ files, data }: Example): string {
  const bodyLines = [h1(data.title)];
  if (data.description) {
    bodyLines.push(data.description);
  }
  bodyLines.push(h2('Code'));
  return `---
${stringify({
  id: data.id,
  title: data.title,
  description: data.description,
})}hide_title: true
---
${lines(bodyLines)} 

${files
  .map(
    ({ path, contents }) =>
      `\`\`\`ts title="${data.fileMap[path] ?? data.title}" showLineNumbers
${contents}
    \`\`\``
  )
  .join('\n\n')}

${link(
  `https://www.typescriptlang.org/play?#code/${compressToEncodedURIComponent(
    [
      "// The following line doesn't do anything really, rather it tells",
      '// the TypeScript playground that this script should be evaluated as a nodejs script.',
      "import {} from 'node:fs'",
      '',
      getEntryPoint({ files, data }).contents,
    ].join('\n')
  )}`,
  'View on TypeScript Playground'
)}

${
  data.commands.length
    ? h2(
        'Usage',
        ...data.commands.map((config) => {
          const n: CommandConfiguration =
            typeof config === 'string' ? { command: config, env: {} } : config;
          const { env, title, description, command } = n;
          return lines(
            title ? h3(title) : '',
            description,
            codeBlock(
              `${
                Object.entries(env ?? {}).length
                  ? Object.entries(env)
                      .map((val) => val.join('='))
                      .join(' ') + ' '
                  : ''
              }node ${command.replace('{filename}', './' + data.id + '.js')}`,
              'shell'
            )
          );
        })
      )
    : ''
}

${e2eExamplesDisclaimer}
  `;
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

function ensureDirSync(path: string): void {
  try {
    mkdirSync(path, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create directory: ${path}`);
  }
}
