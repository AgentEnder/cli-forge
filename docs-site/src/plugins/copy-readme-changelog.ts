import { LoadContext } from '@docusaurus/types';
import { workspaceRoot } from '@nx/devkit';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stringify } from 'yaml';

export async function CopyReadmeAndChangelogPlugin(context: LoadContext) {
  const readme = readFileSync(join(workspaceRoot, './README.md'), 'utf-8');
  const changelog = readFileSync(
    join(workspaceRoot, './CHANGELOG.md'),
    'utf-8'
  );
  const contributing = readFileSync(
    join(workspaceRoot, './CONTRIBUTING.md'),
    'utf-8'
  );

  writeFileSync(
    join(__dirname, '../../docs/index.md'),
    replaceLogo(
      addFrontMatter(readme, {
        id: 'index',
        title: 'Home',
        hide_title: true,
        slug: '/',
        sidebar_position: 1,
      })
    )
  );
  writeFileSync(
    join(__dirname, '../../docs/changelog.md'),
    addFrontMatter(changelog, {
      id: 'changelog',
      title: 'Changelog',
      hide_title: true,
      sidebar_position: 2,
      slug: '/changelog',
    })
  );
  writeFileSync(
    join(__dirname, '../../docs/CONTRIBUTING.md'),
    addFrontMatter(contributing, {
      id: 'contributing',
      title: 'Contributing',
      hide_title: true,
      sidebar_position: 3,
    })
  );

  return {
    // a unique name for this plugin
    name: 'copy-readme-and-changelog-plugin',
  };
}

function replaceLogo(contents: string) {
  const lines = contents.split('\n');
  const logoStart = lines.findIndex((line) =>
    line.includes('<!-- BEGIN LOGO -->')
  );
  const logoEnd = lines.findIndex((line) => line.includes('<!-- END LOGO -->'));
  lines.splice(
    logoStart + 1,
    logoEnd - logoStart - 1,
    '![CLI Forge Logo](../static/img/logo.svg)'
  );
  return lines.join('\n');
}

function addFrontMatter(
  contents: string,
  frontMatter: Record<string, string | boolean | number>
) {
  return `---
${stringify(frontMatter).trim()}
---
${contents}`;
}
