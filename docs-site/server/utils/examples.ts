import { renderProseFiles } from '@functional-examples/documentation';
import type { ParsedRegion } from 'functional-examples';
import {
  ExampleFile,
  findConfigFile,
  loadConfig,
  resolveConfig,
  scanExamples,
  ScannedExample,
} from 'functional-examples';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { getHighlighter } from './highlighter';
import { linkifyCodeHtml, renderMarkdown } from './markdown';
import { parseProseToBlocks } from './prose-parser';

export type { ParsedRegion };

/** Shape of an example file with pre-highlighted HTML */
export class SiteExampleFile {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly raw: string | undefined;
  readonly parsed: string | undefined;
  readonly hunks: ParsedRegion[];
  readonly language: string;
  readonly highlightedHtml: string;

  constructor(data: {
    absolutePath: string;
    relativePath: string;
    raw?: string;
    parsed?: string;
    hunks?: ParsedRegion[];
    language: string;
    highlightedHtml: string;
  }) {
    this.absolutePath = data.absolutePath;
    this.relativePath = data.relativePath;
    this.raw = data.raw;
    this.parsed = data.parsed;
    this.hunks = data.hunks ?? [];
    this.language = data.language;
    this.highlightedHtml = data.highlightedHtml;
  }

  /** Resolved display content: parsed (markers stripped) -> raw -> empty string */
  get content(): string {
    return this.parsed ?? this.raw ?? '';
  }
}

/** A structured segment of prose content */
export type ProseBlock =
  | { type: 'html'; html: string }
  | {
      type: 'code';
      file: string;
      region?: string;
      regionLabel?: string;
      language: string;
      code: string;
      highlightedHtml: string;
      startLine?: number;
      endLine?: number;
    };

/** An example enriched with docs-site rendering data */
export interface SiteExample {
  id: string;
  title: string;
  description: string;
  /** Pre-rendered description HTML (markdown → HTML) */
  renderedDescriptionHtml: string;
  extractorName: string;
  displayPath: string;
  files: SiteExampleFile[];
  tags: string[];
  hasReadme: boolean;
  renderedProseHtml: string | null;
  proseBlocks: ProseBlock[] | null;
}

const LANG_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.json': 'json',
  '.jsonc': 'json',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.toml': 'toml',
  '.md': 'markdown',
  '.css': 'css',
  '.html': 'html',
  '.sh': 'bash',
  '.bash': 'bash',
};

function detectLanguage(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return LANG_MAP[ext] ?? 'text';
}

async function loadFileContent(file: ExampleFile): Promise<string> {
  if (file.parsed) return file.parsed;
  if (file.raw) return file.raw;
  try {
    return await readFile(file.absolutePath, 'utf-8');
  } catch {
    return `// Could not read file: ${file.relativePath}`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function transformFile(
  file: ExampleFile,
  highlighter: Awaited<ReturnType<typeof getHighlighter>>
): Promise<SiteExampleFile> {
  const rawContent = await loadFileContent(file);
  const language = detectLanguage(file.relativePath);

  let highlightedHtml: string;
  try {
    highlightedHtml = highlighter.codeToHtml(rawContent, {
      lang: language,
      theme: 'blueprint',
      transformers: [
        {
          name: 'add-language-class',
          code(node) {
            this.addClassToHast(node, `language-${language}`);
            return node;
          },
        },
      ],
    });
    highlightedHtml = linkifyCodeHtml(highlightedHtml);
  } catch {
    highlightedHtml = `<pre><code>${escapeHtml(rawContent)}</code></pre>`;
  }

  return new SiteExampleFile({
    absolutePath: file.absolutePath,
    relativePath: file.relativePath,
    raw: file.raw,
    parsed: file.parsed,
    hunks: file.hunks,
    language,
    highlightedHtml,
  });
}

export interface LoadExamplesResult {
  siteExamples: SiteExample[];
  scannedExamples: ScannedExample[];
}

export async function loadExamples(): Promise<LoadExamplesResult> {
  const workspaceRoot = resolve(process.cwd(), '..');
  const configPath = await findConfigFile(workspaceRoot);
  if (!configPath) {
    console.warn('[docs-site] No functional-examples config found');
    return { siteExamples: [], scannedExamples: [] };
  }

  const rawConfig = await loadConfig(configPath);
  const resolved = await resolveConfig(rawConfig);
  const result = await scanExamples(resolved);

  console.log(
    `[docs-site] Scanned ${result.stats.examplesFound} examples in ${result.stats.durationMs}ms`
  );

  if (result.errors.length > 0) {
    console.warn(
      `[docs-site] ${result.errors.length} scan errors:`,
      result.errors.map((e) => e.message)
    );
  }

  const highlighter = await getHighlighter();
  const examples: SiteExample[] = [];

  for (const ex of result.examples) {
    if ((ex.metadata as Record<string, unknown>)?.hidden) continue;

    const files = await Promise.all(
      ex.files.map((f) => transformFile(f, highlighter))
    );

    const metadata = (ex.metadata ?? {}) as Record<string, unknown>;
    const tags = Array.isArray(metadata.tags)
      ? (metadata.tags as string[])
      : [];

    // Render prose files (README.md) through the documentation engine
    let renderedProseHtml: string | null = null;
    let proseBlocks: ProseBlock[] | null = null;
    try {
      const { renderedProse } = renderProseFiles(ex.files, metadata);
      if (renderedProse.length > 0) {
        const proseMarkdown = renderedProse.join('\n\n');
        renderedProseHtml = await renderMarkdown(proseMarkdown);
        proseBlocks = await parseProseToBlocks(
          proseMarkdown,
          ex.files,
          metadata
        );
      }
    } catch (err) {
      throw new Error(
        `[docs-site] Prose rendering failed for "${ex.id}": ${
          (err as Error).message
        }`,
        { cause: err }
      );
    }

    // Render the description through markdown pipeline
    const description = ex.description ?? '';
    let renderedDescriptionHtml = '';
    if (description) {
      try {
        renderedDescriptionHtml = await renderMarkdown(description);
      } catch {
        renderedDescriptionHtml = `<p>${description}</p>`;
      }
    }

    examples.push({
      id: ex.id,
      title: ex.title,
      description,
      renderedDescriptionHtml,
      extractorName: ex.extractorName,
      displayPath: ex.displayPath,
      files,
      tags,
      hasReadme: files.some(
        (f) => f.relativePath.toLowerCase() === 'readme.md'
      ),
      renderedProseHtml,
      proseBlocks,
    });
  }

  return { siteExamples: examples, scannedExamples: result.examples };
}
