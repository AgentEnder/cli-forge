import { createGuideRenderer } from '@functional-examples/documentation';
import type { ScannedExample } from 'functional-examples';
import matter from 'gray-matter';
import { readdir, readFile } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { renderMarkdown, stripH1 } from './markdown';

export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

export interface DocPage {
  slug: string;
  title: string;
  description: string;
  section: string;
  order: number;
  filePath: string;
  content: string;
  renderedHtml: string;
  headings: TocEntry[];
}

export interface NavigationItem {
  title: string;
  path?: string;
  order?: number;
  children?: NavigationItem[];
}

export interface CategoryMeta {
  title: string;
  order: number;
}

const CATEGORY_FILENAME = '_category_.yml';

function titleCase(dirName: string): string {
  return dirName
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Scans a directory for _category_.yml files.
 */
export async function scanCategories(docsDir: string): Promise<Map<string, CategoryMeta>> {
  const categories = new Map<string, CategoryMeta>();

  let entries: string[];
  try {
    entries = (await readdir(docsDir, { recursive: true } as any)) as string[];
  } catch {
    return categories;
  }

  for (const entry of entries) {
    if (!entry.endsWith(CATEGORY_FILENAME)) continue;
    const filePath = join(docsDir, entry);
    const raw = await readFile(filePath, 'utf-8');
    const data = parseYaml(raw) as Record<string, unknown> | null;

    const dirKey = dirname(entry).replace(/\\/g, '/');

    categories.set(dirKey, {
      title: (data?.label as string) ?? (data?.title as string) ?? titleCase(dirKey),
      order: (data?.position as number) ?? (data?.order as number) ?? 999,
    });
  }

  return categories;
}

/**
 * Scans a docs directory recursively for markdown files with frontmatter.
 */
export async function scanDocs(docsDir: string, categories: Map<string, CategoryMeta>): Promise<DocPage[]> {
  const pages: DocPage[] = [];

  let entries: string[];
  try {
    entries = (await readdir(docsDir, { recursive: true } as any)) as string[];
  } catch {
    console.warn('[docs-site] No docs directory found at', docsDir);
    return [];
  }

  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue;
    // Skip category files
    if (entry.endsWith(CATEGORY_FILENAME)) continue;

    const filePath = join(docsDir, entry);
    const raw = await readFile(filePath, 'utf-8');
    const { data, content } = matter(raw);

    const slug = entry.replace(/\.md$/, '').replace(/\\/g, '/');

    const dirKey = dirname(entry).replace(/\\/g, '/');
    const category = categories.get(dirKey);
    const section =
      category?.title ?? (dirKey === '.' ? 'Documentation' : titleCase(dirKey));

    pages.push({
      slug,
      title: (data.title as string) ?? basename(entry, extname(entry)),
      description: (data.description as string) ?? '',
      section,
      order: (data.nav?.order as number) ?? (data.sidebar_position as number) ?? 999,
      filePath,
      content,
      renderedHtml: '',
      headings: [],
    });
  }

  return pages.sort((a, b) => a.order - b.order);
}

/**
 * Extract h2 and h3 headings (with id attributes) from rendered HTML.
 */
export function extractHeadings(html: string): TocEntry[] {
  const headings: TocEntry[] = [];
  const regex = /<h([23])\s[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/h\1>/gi;
  for (const match of html.matchAll(regex)) {
    const level = parseInt(match[1], 10);
    const id = match[2];
    // Strip HTML tags from the heading text
    const text = match[3].replace(/<[^>]+>/g, '').trim();
    headings.push({ id, text, level });
  }
  return headings;
}

/**
 * Render all doc pages' markdown content to HTML.
 * When scanned examples are provided, expands Eta template references
 * (`<%= example('id').file('path') %>`) before rendering markdown.
 */
export async function hydrateDocs(
  docs: DocPage[],
  scannedExamples?: ScannedExample[]
): Promise<DocPage[]> {
  const renderer = scannedExamples
    ? createGuideRenderer(scannedExamples)
    : null;

  const hydrated: DocPage[] = [];
  for (const doc of docs) {
    let expandedContent = doc.content;

    if (renderer) {
      try {
        expandedContent = renderer.render(doc.content);
      } catch (err) {
        console.warn(
          `[docs-site] Guide hydration failed for "${doc.slug}":`,
          (err as Error).message
        );
      }
    }

    let renderedHtml = '';
    try {
      renderedHtml = stripH1(await renderMarkdown(expandedContent));
    } catch (err) {
      console.warn(
        `[docs-site] Markdown rendering failed for "${doc.slug}":`,
        (err as Error).message
      );
    }
    hydrated.push({ ...doc, renderedHtml, headings: extractHeadings(renderedHtml) });
  }
  return hydrated;
}

/**
 * Build sidebar navigation from scanned docs and category metadata.
 */
export function buildDocsNavigation(
  docs: DocPage[],
  categories: Map<string, CategoryMeta>
): NavigationItem[] {
  const sections = new Map<string, NavigationItem>();

  for (const doc of docs) {
    const dirKey = dirname(doc.slug).replace(/\\/g, '/');

    if (!sections.has(doc.section)) {
      const category = categories.get(dirKey);
      sections.set(doc.section, {
        title: doc.section,
        order: category?.order ?? 999,
        children: [],
      });
    }
    const section = sections.get(doc.section);
    section?.children?.push({
      title: doc.title,
      path: `/docs/${doc.slug}`,
      order: doc.order,
    });
  }

  for (const section of sections.values()) {
    section.children?.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }

  return Array.from(sections.values()).sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999)
  );
}
