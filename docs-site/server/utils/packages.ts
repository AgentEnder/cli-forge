import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { extractHeadings, type TocEntry } from './docs';
import { renderMarkdown } from './markdown';
import { workspaceRoot } from './workspace.js';

export interface PackageInfo {
  dirName: string;
  npmName: string;
  description: string;
  version: string;
  npmUrl: string;
  githubUrl: string;
  readmeContent: string;
  renderedHtml: string;
  headings: TocEntry[];
}

const GITHUB_REPO = 'https://github.com/AgentEnder/cli-forge';

export async function scanPackages(): Promise<PackageInfo[]> {
  const root = workspaceRoot();
  const packagesDir = join(root, 'packages');

  let entries: import('node:fs').Dirent[];
  try {
    entries = await readdir(packagesDir, { withFileTypes: true });
  } catch {
    console.warn('[docs-site] No packages/ directory found');
    return [];
  }

  const packages: PackageInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const pkgDir = join(packagesDir, entry.name);
    let pkgJson: Record<string, unknown>;

    try {
      const raw = await readFile(join(pkgDir, 'package.json'), 'utf-8');
      pkgJson = JSON.parse(raw);
    } catch {
      continue;
    }

    const npmName = (pkgJson.name as string) ?? entry.name;
    const description = (pkgJson.description as string) ?? '';
    const version = (pkgJson.version as string) ?? '0.0.0';

    let readmeContent = '';
    try {
      readmeContent = await readFile(join(pkgDir, 'README.md'), 'utf-8');
    } catch {
      // No README
    }

    let renderedHtml = '';
    if (readmeContent) {
      try {
        renderedHtml = await renderMarkdown(readmeContent);
      } catch (err) {
        console.warn(
          `[docs-site] README rendering failed for "${entry.name}":`,
          (err as Error).message
        );
      }
    }

    packages.push({
      dirName: entry.name,
      npmName,
      description,
      version,
      npmUrl: `https://www.npmjs.com/package/${npmName}`,
      githubUrl: `${GITHUB_REPO}/tree/main/packages/${entry.name}`,
      readmeContent,
      renderedHtml,
      headings: extractHeadings(renderedHtml),
    });
  }

  return packages.sort((a, b) => a.dirName.localeCompare(b.dirName));
}
