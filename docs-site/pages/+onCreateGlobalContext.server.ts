import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadTypedocContext } from 'vike-plugin-typedoc/server';
import {
  buildDocsNavigation,
  extractHeadings,
  hydrateDocs,
  scanCategories,
  scanDocs,
  type DocPage,
  type NavigationItem,
} from '../server/utils/docs';
import { loadExamples, type SiteExample } from '../server/utils/examples';
import {
  configureRehypeTypedoc,
  configureRemarkCodeProps,
  renderMarkdown,
} from '../server/utils/markdown';
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

  // Phase 1: Load TypeDoc context and configure rehype-typedoc
  // so inline code auto-linking works in all subsequent markdown rendering.
  let typedocNavigation: NavigationItem[] = [];
  try {
    const typedoc = await loadTypedocContext(context);
    configureRehypeTypedoc(typedoc.getRehypePlugins());
    configureRemarkCodeProps({
      resolveSignature: (symbolName, pkg) => {
        const exports = typedoc.apiDocs.allExports;
        const matches = exports.filter((exp) => exp.name === symbolName);

        if (pkg) {
          const match = matches.find((exp) => exp.package === pkg);
          return match?.signature;
        }

        if (matches.length === 1) return matches[0].signature;
        if (matches.length > 1) {
          throw new Error(
            `Ambiguous ::typedoc symbol "${symbolName}" found in packages: ${matches
              .map((m) => m.package)
              .join(', ')}. Use pkg attribute to disambiguate.`
          );
        }
        return undefined;
      },
    });
    typedocNavigation = typedoc.navigation;
  } catch (err) {
    console.warn(
      '[docs-site] TypeDoc context not available (run typedoc first):',
      (err as Error).message
    );
  }

  // Phase 2: Load all content in parallel.
  // renderMarkdown calls within these loaders will now
  // automatically apply typedoc symbol links.
  const [categories, { siteExamples: examplesList, scannedExamples }, packageList] =
    await Promise.all([
      scanCategories(docsDir),
      loadExamples(),
      scanPackages(),
    ]);

  const rawDocs = await scanDocs(docsDir, categories);
  const docs = await hydrateDocs(rawDocs, scannedExamples);

  // Load root README and CHANGELOG as standalone doc pages
  // (not part of any section — they get top-level nav entries)
  const root = workspaceRoot();
  try {
    let readmeContent = await readFile(join(root, 'README.md'), 'utf-8');
    // Rewrite the logo image path to point to the public asset
    const baseUrl = (process.env.BASE_URL || '/cli-forge').replace(/\/$/, '');
    readmeContent = readmeContent.replace(
      /!\[CLI Forge Logo\]\([^)]+\)/,
      `![CLI Forge Logo](${baseUrl}/logo.svg)`
    );
    const readmeHtml = await renderMarkdown(readmeContent);
    docs.push({
      slug: 'index',
      title: 'Home',
      description: 'CLI Forge -- A type-safe CLI builder for Node.js',
      section: '_toplevel',
      order: 0,
      filePath: join(root, 'README.md'),
      content: readmeContent,
      renderedHtml: readmeHtml,
      headings: extractHeadings(readmeHtml),
    });
  } catch {
    /* no README */
  }

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
      section: '_toplevel',
      order: 999,
      filePath: join(root, 'CHANGELOG.md'),
      content: changelogContent,
      renderedHtml: changelogHtml,
      headings: extractHeadings(changelogHtml),
    });
  } catch {
    /* no CHANGELOG */
  }

  // Build docs navigation from scanned docs only (exclude _toplevel pages)
  const sectionDocs = docs.filter((d) => d.section !== '_toplevel');
  const docsNavigation = buildDocsNavigation(sectionDocs, categories);

  const packages = Object.fromEntries(
    packageList.map((pkg) => [pkg.dirName, pkg])
  );

  const navigation: NavigationItem[] = [
    { title: 'Home', path: '/docs', order: -2 },
    ...docsNavigation,
    { title: 'Changelog', path: '/changelog', order: 999 },
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
      children: [
        ...packageList.map((pkg) => {
          // Merge TypeDoc nav items into package nav
          const apiNav = typedocNavigation.find(
            (item) => item.path === `/api/${pkg.dirName}`
          );
          return {
            title: pkg.npmName,
            path: `/api/${pkg.dirName}`,
            children: apiNav?.children,
          };
        }),
      ],
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
