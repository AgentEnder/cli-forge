import {
  findConfigFile,
  loadConfig,
  resolveConfig,
  scanExamples,
  type ScannedExample,
  type ExampleFile,
} from 'functional-examples';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { getHighlighter } from './highlighter';

export class SiteExampleFile {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly raw: string | undefined;
  readonly parsed: string | undefined;
  readonly language: string;
  readonly highlightedHtml: string;

  constructor(data: {
    absolutePath: string;
    relativePath: string;
    raw?: string;
    parsed?: string;
    language: string;
    highlightedHtml: string;
  }) {
    this.absolutePath = data.absolutePath;
    this.relativePath = data.relativePath;
    this.raw = data.raw;
    this.parsed = data.parsed;
    this.language = data.language;
    this.highlightedHtml = data.highlightedHtml;
  }

  get content(): string {
    return this.parsed ?? this.raw ?? '';
  }
}

export interface SiteExample {
  id: string;
  title: string;
  description: string;
  extractorName: string;
  displayPath: string;
  files: SiteExampleFile[];
  tags: string[];
}

export interface ProseBlock {
  type: 'html' | 'code';
  html: string;
  file: string;
  region?: string;
  regionLabel?: string;
  language: string;
  code: string;
  highlightedHtml: string;
  startLine?: number;
  endLine?: number;
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
  } catch {
    highlightedHtml = `<pre><code>${escapeHtml(rawContent)}</code></pre>`;
  }

  return new SiteExampleFile({
    absolutePath: file.absolutePath,
    relativePath: file.relativePath,
    raw: file.raw,
    parsed: file.parsed,
    language,
    highlightedHtml,
  });
}

export async function loadExamples(): Promise<SiteExample[]> {
  const workspaceRoot = resolve(process.cwd(), '..');
  const configPath = await findConfigFile(workspaceRoot);
  if (!configPath) {
    console.warn('[docs-site] No functional-examples config found');
    return [];
  }

  const rawConfig = await loadConfig(configPath);
  const resolved = await resolveConfig(rawConfig);
  const result = await scanExamples(resolved);

  console.log(
    `[docs-site] Scanned ${result.stats.examplesFound} examples in ${result.stats.durationMs}ms`
  );

  const highlighter = await getHighlighter();
  const examples: SiteExample[] = [];

  for (const ex of result.examples) {
    if (ex.metadata.hidden) continue;

    const files = await Promise.all(
      ex.files.map((f) => transformFile(f, highlighter))
    );

    const metadata = (ex.metadata ?? {}) as Record<string, unknown>;
    const tags = Array.isArray(metadata.tags)
      ? (metadata.tags as string[])
      : [];

    examples.push({
      id: ex.id,
      title: ex.title,
      description: ex.description,
      extractorName: ex.extractorName,
      displayPath: ex.displayPath,
      files,
      tags,
    });
  }

  return examples;
}
