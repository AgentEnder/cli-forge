import { LoadContext, Plugin } from '@docusaurus/types';
import { workspaceRoot } from '@nx/devkit';
import { sync as glob } from 'fast-glob';
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

import MonacoEditorWebpackPlugin from 'monaco-editor-webpack-plugin';

import { compressToEncodedURIComponent } from 'lz-string';

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';

import { stringify } from 'yaml';

import {
  CommandConfiguration,
  Example,
  collectExamples,
} from '../../../tools/scripts/collect-examples';

export const ExamplesDocsPlugin = async (
  context: LoadContext
): Promise<Plugin> => {
  const examplesRoot = join(workspaceRoot, 'examples') + sep;
  const examples = collectExamples(join(examplesRoot, '../examples'));

  for (const example of examples) {
    const relative = (
      example.files.length > 1 || example.multifile
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

    configureWebpack(config) {
      const cssRuleIdx = config.module.rules.findIndex(
        (rule) => (rule as any).test.toString() === '/\\.css$/i'
      );
      const cssRule = config.module.rules[cssRuleIdx] as Record<string, any>;
      cssRule.include = (p) =>
        p.endsWith('.css') && !p.includes('monaco-editor');
      config.module.rules.push({
        test: /\.css$/,
        include: /monaco-editor/,
        use: ['style-loader', 'css-loader'],
      });
      return {
        plugins: [
          new MonacoEditorWebpackPlugin({
            languages: ['typescript'],
            monacoEditorPath: join(
              __dirname,
              '../../node_modules/monaco-editor'
            ),
          }),
        ],
      };
    },

    async contentLoaded({ content, actions }) {
      const { createData, addRoute } = actions;

      const examplesJsonPath = await createData(
        'examples.json',
        JSON.stringify(examples, null, 2)
      );

      const dtsPath = await createData(
        'dts.json',
        JSON.stringify(getDtsFiles())
      );

      console.log('Adding playground route', `${context.baseUrl}playground`);

      addRoute({
        path: `${context.baseUrl}playground`,
        component: '@site/pages/playground/index.tsx',
        modules: {
          examples: examplesJsonPath,
          dts: dtsPath,
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

function formatCodeBlock(
  path: string,
  contents: string,
  fileMap: Record<string, string>,
  title: string
): string {
  const displayTitle = fileMap[path] ?? title;
  const ext = path.split('.').pop() ?? 'ts';
  const lang =
    ext === 'yml' || ext === 'yaml' ? 'yaml' : ext === 'json' ? 'json' : 'ts';
  return `\`\`\`${lang} title="${displayTitle}" showLineNumbers
${contents}
\`\`\``;
}

function processContentWithFileTags(
  content: string,
  files: Example['files'],
  data: Example['data']
): string {
  // Match {{file:path}} patterns
  const fileTagPattern = /\{\{file:([^}]+)\}\}/g;

  return content.replace(fileTagPattern, (match, relativePath) => {
    // Normalize the path for matching
    const normalizedPath = relativePath.trim();

    // Find the file in the collected files
    const file = files.find((f) => {
      // Match against the relative path from fileMap or the path suffix
      const fileMapMatch = Object.entries(data.fileMap).find(
        ([fullPath, displayName]) =>
          displayName === normalizedPath || fullPath.endsWith(normalizedPath)
      );
      if (fileMapMatch) {
        return f.path === fileMapMatch[0];
      }
      return f.path.endsWith(normalizedPath);
    });

    if (!file) {
      console.warn(
        `Warning: File "${relativePath}" not found in example "${data.id}"`
      );
      return match; // Keep original tag if file not found
    }

    return formatCodeBlock(file.path, file.contents, data.fileMap, data.title);
  });
}

function formatExampleMd({ files, data, content }: Example): string {
  const frontmatter = `---
${stringify({
  id: data.id,
  title: data.title,
  description: data.description,
})}hide_title: true
---`;

  const playgroundLink = link(
    `/playground/#${compressToEncodedURIComponent(
      [
        "// The following line doesn't do anything really, rather it tells",
        '// the TypeScript playground that this script should be evaluated as a nodejs script.',
        "import {} from 'node:fs'",
        '',
        getEntryPoint({ files, data })?.contents ?? '',
      ].join('\n')
    )}`,
    'View on TypeScript Playground'
  );

  const usageSection = data.commands.length
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
    : '';

  // If content.md exists, use it with file tag processing
  if (content) {
    const processedContent = processContentWithFileTags(content, files, data);
    return `${frontmatter}

# ${data.title}

${data.description ?? ''}

${processedContent}

${playgroundLink}

${usageSection}

${e2eExamplesDisclaimer}
`;
  }

  // Fallback: original behavior (description + all files sequentially)
  const bodyLines = [h1(data.title)];
  if (data.description) {
    bodyLines.push(data.description);
  }
  bodyLines.push(h2('Code'));

  const codeBlocks = files
    .map(({ path, contents }) =>
      formatCodeBlock(path, contents, data.fileMap, data.title)
    )
    .join('\n\n');

  return `${frontmatter}
${lines(bodyLines)}

${codeBlocks}

${playgroundLink}

${usageSection}

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
function getDtsFiles(): any {
  if (!existsSync(join(workspaceRoot, 'packages', 'cli-forge', 'dist'))) {
    throw new Error(
      'The cli-forge package must be built before running this command'
    );
  }
  const cliForgeDtsFiles = glob('**/*.d.ts', {
    cwd: join(workspaceRoot, 'packages', 'cli-forge', 'dist'),
  });

  const parserDtsFiles = glob('**/*.d.ts', {
    cwd: join(workspaceRoot, 'packages', 'parser', 'dist'),
  });

  const nodeDtsFiles = glob('**/*.d.ts', {
    cwd: join(workspaceRoot, 'node_modules', '@types', 'node'),
  }).concat('package.json');

  return Object.fromEntries([
    ...cliForgeDtsFiles.map((f) => [
      `file:///node_modules/cli-forge/${f}`,
      readFileSync(
        join(workspaceRoot, 'packages', 'cli-forge', 'dist', f),
        'utf-8'
      ),
    ]),
    // Also include package.json from the package root (not dist)
    [
      'file:///node_modules/cli-forge/package.json',
      readFileSync(
        join(workspaceRoot, 'packages', 'cli-forge', 'package.json'),
        'utf-8'
      ),
    ],
    ...parserDtsFiles.map((f) => [
      `file:///node_modules/@cli-forge/parser/${f}`,
      readFileSync(
        join(workspaceRoot, 'packages', 'parser', 'dist', f),
        'utf-8'
      ),
    ]),
    // Also include package.json from the package root (not dist)
    [
      'file:///node_modules/@cli-forge/parser/package.json',
      readFileSync(
        join(workspaceRoot, 'packages', 'parser', 'package.json'),
        'utf-8'
      ),
    ],
    ...nodeDtsFiles.map((f) => [
      `file:///node_modules/@types/node/${f}`,
      readFileSync(
        join(workspaceRoot, 'node_modules', '@types', 'node', f),
        'utf-8'
      ),
    ]),
  ]);
}
