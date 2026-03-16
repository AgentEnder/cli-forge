import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  buildDocsNavigation,
  hydrateDocs,
  scanCategories,
  scanDocs,
  type DocPage,
  type NavigationItem,
} from '../server/utils/docs';
import { loadExamples, type SiteExample } from '../server/utils/examples';
import { renderMarkdown } from '../server/utils/markdown';
import { scanPackages, type PackageInfo } from '../server/utils/packages';
import { workspaceRoot } from '../server/utils/workspace.js';

function sortNavigationItems(items: NavigationItem[]): NavigationItem[] {
  for (const item of items) {
    if (item.children) {
      item.children = sortNavigationItems(item.children);
    }
  }
  return items.sort((a, b) => {
    const orderA = a.order ?? 999;
    const orderB = b.order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.title.localeCompare(b.title);
  });
}

export async function onCreateGlobalContext(
  context: Partial<GlobalContextServer>
): Promise<void> {
  const docsDir = join(process.cwd(), 'docs');

  const [categories, examplesList, packageList] = await Promise.all([
    scanCategories(docsDir),
    loadExamples(),
    scanPackages(),
  ]);

  const rawDocs = await scanDocs(docsDir, categories);
  const docs = await hydrateDocs(rawDocs);

  // Load root README as the docs index page
  const root = workspaceRoot();
  try {
    const readmeContent = await readFile(join(root, 'README.md'), 'utf-8');
    const readmeHtml = await renderMarkdown(readmeContent);
    docs.unshift({
      slug: 'index',
      title: 'Home',
      description: 'CLI Forge -- A type-safe CLI builder for Node.js',
      section: 'Documentation',
      order: 0,
      filePath: join(root, 'README.md'),
      content: readmeContent,
      renderedHtml: readmeHtml,
    });
  } catch {
    /* no README */
  }

  // Load root CHANGELOG
  try {
    const changelogContent = await readFile(
      join(root, 'CHANGELOG.md'),
      'utf-8'
    );
    const changelogHtml = await renderMarkdown(changelogContent);
    docs.push({
      slug: 'changelog',
      title: 'Changelog',
      description: 'CLI Forge changelog',
      section: 'Documentation',
      order: 1,
      filePath: join(root, 'CHANGELOG.md'),
      content: changelogContent,
      renderedHtml: changelogHtml,
    });
  } catch {
    /* no CHANGELOG */
  }

  const docsNavigation = buildDocsNavigation(docs, categories);

  const packages = Object.fromEntries(
    packageList.map((pkg) => [pkg.dirName, pkg])
  );

  const navigation: NavigationItem[] = [
    ...docsNavigation,
    {
      title: 'Examples',
      path: '/examples',
      order: 50,
      children: examplesList.map((ex) => ({
        title: ex.title,
        path: `/examples/${ex.id}`,
      })),
    },
    {
      title: 'API',
      path: '/api',
      order: 100,
      children: packageList.map((pkg) => ({
        title: pkg.npmName,
        path: `/api/${pkg.dirName}`,
      })),
    },
  ];

  (context as Record<string, unknown>).examples = Object.fromEntries(
    examplesList.map((ex) => [ex.id, ex])
  );
  (context as Record<string, unknown>).docs = Object.fromEntries(
    docs.map((d) => [d.slug, d])
  );
  (context as Record<string, unknown>).packages = packages;
  (context as Record<string, unknown>).navigation =
    sortNavigationItems(navigation);
}

type GlobalContextServer = {
  examples: Record<string, SiteExample>;
  docs: Record<string, DocPage>;
  packages: Record<string, PackageInfo>;
  navigation: NavigationItem[];
};

declare global {
  namespace Vike {
    interface GlobalContextServer {
      examples: Record<string, SiteExample>;
      docs: Record<string, DocPage>;
      packages: Record<string, PackageInfo>;
      navigation: NavigationItem[];
    }
    interface GlobalContextClient {
      navigation: NavigationItem[];
    }
  }
}
