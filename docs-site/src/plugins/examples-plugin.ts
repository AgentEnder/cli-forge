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
import { dirname, join } from 'node:path';

import { stringify } from 'yaml';

// Functional-examples imports
import { resolveConfig, scanExamples } from 'functional-examples';
import type { Example as FunctionalExample } from 'functional-examples';

/**
 * Get the entry point file from an example
 */
function getEntryPoint(example: FunctionalExample) {
  const entryPoint = example.metadata.entryPoint;
  console.log(
    entryPoint,
    example.files.map((f) => f.relativePath)
  );
  if (!entryPoint) {
    return example.files[0];
  }
  return example.files.find((file) => file.relativePath === entryPoint || file.absolutePath === entryPoint);
}

/**
 * Transform FunctionalExample to the old Example format expected by the playground
 */
function transformForPlayground(example: FunctionalExample) {
  return {
    files: example.files.map((file) => ({
      path: file.absolutePath,
      contents: file.parsed,
    })),
    data: {
      id: example.id,
      title: example.title,
      description: example.description,
      fileMap: (example.metadata.fileMap as Record<string, string>) ?? {},
      commands: [], // Not needed for playground
      entryPoint: getEntryPoint(example)?.absolutePath ?? example.files[0]?.absolutePath,
      hidden: example.metadata.hidden ?? false,
    },
  };
}

export const ExamplesDocsPlugin = async (
  context: LoadContext
): Promise<Plugin> => {
  // Use functional-examples scanner
  const config = await resolveConfig({
    root: join(workspaceRoot, 'examples')
  });
  const { examples } = await scanExamples(config);

  const visibleExamples = examples.filter((e) => !e.metadata.hidden);

  for (const example of visibleExamples) {
    // Use displayPath for the markdown filename
    const destination = join(
      __dirname,
      '../../docs/examples',
      `${example.displayPath}.md`
    );
    ensureDirSync(dirname(destination));
    writeFileSync(destination, formatExampleMd(example));
  }

  ensureDirSync(join(__dirname, '../../docs/examples'));
  writeFileSync(
    join(__dirname, '../../docs/examples/index.md'),
    formatIndexMd(visibleExamples)
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

    async contentLoaded({ actions }) {
      const { createData, addRoute } = actions;

      // Transform FunctionalExample to old Example format for playground
      const transformedExamples = examples.map(transformForPlayground);

      const examplesJsonPath = await createData(
        'examples.json',
        JSON.stringify(transformedExamples, null, 2)
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

function formatCodeBlock(
  path: string,
  contents: string,
  fileMap: Record<string, string> | undefined,
  title: string
): string {
  const displayTitle = fileMap?.[path] ?? title;
  const ext = path.split('.').pop() ?? 'ts';
  const lang =
    ext === 'yml' || ext === 'yaml' ? 'yaml' : ext === 'json' ? 'json' : 'ts';
  return `\`\`\`${lang} title="${displayTitle}" showLineNumbers
${contents}
\`\`\``;
}

function processContentWithFileTags(
  content: string,
  files: FunctionalExample['files'],
  metadata: FunctionalExample['metadata'],
  id: string,
  title: string
): string {
  // Match {{file:path}} patterns
  const fileTagPattern = /\{\{file:([^}]+)\}\}/g;

  return content.replace(fileTagPattern, (match, relativePath) => {
    // Normalize the path for matching
    const normalizedPath = relativePath.trim();

    // Find the file in the collected files
    const file = files.find((f) => {
      // Match against the relative path from fileMap or the path suffix
      const fileMap = metadata.fileMap as Record<string, string> | undefined;
      if (fileMap) {
        const fileMapMatch = Object.entries(fileMap).find(
          ([fullPath, displayName]) =>
            displayName === normalizedPath || fullPath.endsWith(normalizedPath)
        );
        if (fileMapMatch) {
          return f.relativePath === fileMapMatch[0] || f.absolutePath === fileMapMatch[0];
        }
      }
      return f.relativePath.endsWith(normalizedPath) || f.absolutePath.endsWith(normalizedPath);
    });

    if (!file) {
      console.warn(
        `Warning: File "${relativePath}" not found in example "${id}"`
      );
      return match; // Keep original tag if file not found
    }

    return formatCodeBlock(
      file.relativePath,
      file.parsed,
      metadata.fileMap as Record<string, string> | undefined,
      title
    );
  });
}

function formatExampleMd(example: FunctionalExample): string {
  const { id, title, description, files, metadata } = example;

  const frontmatter = `---
${stringify({
  id,
  title,
  description,
})}hide_title: true
---`;

  const entryPoint = getEntryPoint(example);
  const playgroundLink = link(
    `/playground/#${compressToEncodedURIComponent(
      [
        "// The following line doesn't do anything really, rather it tells",
        '// the TypeScript playground that this script should be evaluated as a nodejs script.',
        "import {} from 'node:fs'",
        '',
        entryPoint?.parsed ?? '',
      ].join('\n')
    )}`,
    'View on TypeScript Playground'
  );

  // Extract commands from metadata.test array
  const testCommands = (metadata.test as Array<{
    name?: string;
    options: { command: string; env?: Record<string, string> };
    assertions?: unknown;
  }>) ?? [];

  const usageSection = testCommands.length
    ? h2(
        'Usage',
        ...testCommands.map((testCase) => {
          const { name: testName, options } = testCase;
          const { command, env = {} } = options;
          // Escape command for code block (already inside backticks, no need for extra escaping)
          const displayCommand = command.replace('{filename}', './' + id + '.js');
          return lines(
            testName ? h3(testName) : '',
            '',
            codeBlock(
              `${
                Object.entries(env).length
                  ? Object.entries(env)
                      .map((val) => val.join('='))
                      .join(' ') + ' '
                  : ''
              }${displayCommand}`,
              'shell'
            )
          );
        })
      )
    : '';

  // Check if there's a content.md file
  const contentFile = files.find(f => f.relativePath.endsWith('content.md'));

  // If content.md exists, use it with file tag processing
  if (contentFile) {
    const processedContent = processContentWithFileTags(
      contentFile.raw,
      files,
      metadata,
      id,
      title
    );
    return `${frontmatter}

# ${title}

${description ?? ''}

${processedContent}

${playgroundLink}

${usageSection}

${e2eExamplesDisclaimer}
`;
  }

  // Fallback: original behavior (description + all files sequentially)
  const bodyLines = [h1(title)];
  if (description) {
    bodyLines.push(description);
  }
  bodyLines.push(h2('Code'));

  const codeBlocks = files
    .map(({ relativePath, parsed }) =>
      formatCodeBlock(
        relativePath,
        parsed,
        metadata.fileMap as Record<string, string> | undefined,
        title
      )
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

function formatIndexMd(examples: FunctionalExample[]): string {
  return `---
id: examples
title: Examples
---
${h1(
  'Examples',
  ul(
    examples.map((example) =>
      link(`examples/${example.id}`, example.title)
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
