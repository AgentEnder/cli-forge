import { templateHelpers } from '@functional-examples/documentation';
import type { ExampleFile } from 'functional-examples';
import type { ProseBlock } from './examples';
import { getHighlighter } from './highlighter';
import { linkifyCodeHtml, renderMarkdown } from './markdown';

/**
 * Index entry mapping trimmed code content to its source file/region.
 */
interface ContentIndexEntry {
  file: string;
  language: string;
  region?: string;
  regionLabel?: string;
  startLine?: number;
  endLine?: number;
}

/**
 * Build a content index from example files and their hunks.
 *
 * Maps trimmed code content -> source metadata so we can identify
 * which file/region a fenced block in the prose markdown came from.
 */
function buildContentIndex(
  files: ExampleFile[],
  metadata: Record<string, unknown>
): Map<string, ContentIndexEntry> {
  const index = new Map<string, ContentIndexEntry>();

  for (const file of files) {
    // Index the full file content (what file() helper produces)
    const fullContent = (file.parsed ?? file.raw ?? '').trim();
    if (fullContent) {
      const ext = file.relativePath.lastIndexOf('.');
      const language =
        ext !== -1 ? file.relativePath.slice(ext + 1) : 'text';
      index.set(fullContent, {
        file: file.relativePath,
        language,
      });
    }

    // Index each hunk/region (what region() helper produces)
    if (file.hunks) {
      for (const hunk of file.hunks) {
        const hunkContent = hunk.content.trim();
        if (hunkContent) {
          const ext = file.relativePath.lastIndexOf('.');
          const language =
            ext !== -1 ? file.relativePath.slice(ext + 1) : 'text';
          index.set(hunkContent, {
            file: file.relativePath,
            language,
            region: hunk.id,
            regionLabel: templateHelpers.hunkDescription(metadata, hunk.id),
            startLine: hunk.startLine,
            endLine: hunk.endLine,
          });
        }
      }
    }
  }

  return index;
}

/**
 * Regex for fenced code blocks in markdown.
 * Captures: [1] language (word chars before any space/newline), [2] content between fences.
 * Allows optional metadata after the language (e.g. `title="file.ts"`).
 */
const FENCED_BLOCK_RE = /^```(\w*)[^\n]*\n([\s\S]*?)^```$/gm;

interface FencedBlock {
  language: string;
  content: string;
  /** Start index in the source markdown */
  start: number;
  /** End index (exclusive) in the source markdown */
  end: number;
}

/**
 * Parse all fenced code blocks out of a markdown string.
 */
function parseFencedBlocks(markdown: string): FencedBlock[] {
  const blocks: FencedBlock[] = [];
  for (const m of markdown.matchAll(FENCED_BLOCK_RE)) {
    blocks.push({
      language: m[1] || 'text',
      content: m[2],
      start: m.index ?? 0,
      end: (m.index ?? 0) + m[0].length,
    });
  }
  return blocks;
}

/**
 * Parse expanded prose markdown into structured ProseBlock segments.
 *
 * Takes the raw markdown output from renderProseFiles (with file/region
 * helpers already expanded to fenced blocks) and splits it into alternating
 * HTML prose and decorated code blocks.
 */
export async function parseProseToBlocks(
  proseMarkdown: string,
  files: ExampleFile[],
  metadata: Record<string, unknown>
): Promise<ProseBlock[]> {
  const index = buildContentIndex(files, metadata);
  const fenced = parseFencedBlocks(proseMarkdown);

  if (fenced.length === 0) {
    // No code blocks -- just render the whole thing as HTML
    const html = await renderMarkdown(proseMarkdown);
    return [{ type: 'html', html }];
  }

  const highlighter = await getHighlighter();
  const blocks: ProseBlock[] = [];
  let cursor = 0;

  for (const block of fenced) {
    // Prose text before this code block
    if (block.start > cursor) {
      const proseMd = proseMarkdown.slice(cursor, block.start);
      const trimmed = proseMd.trim();
      if (trimmed) {
        const html = await renderMarkdown(trimmed);
        blocks.push({ type: 'html', html });
      }
    }

    // Match code content against known files/regions
    const trimmedContent = block.content.trim();
    const entry = index.get(trimmedContent);

    let highlightedHtml: string;
    try {
      highlightedHtml = highlighter.codeToHtml(trimmedContent, {
        lang: block.language,
        theme: 'blueprint',
        transformers: [
          {
            name: 'add-language-class',
            code(node) {
              this.addClassToHast(node, `language-${block.language}`);
              return node;
            },
          },
        ],
      });
      highlightedHtml = linkifyCodeHtml(highlightedHtml);
    } catch {
      highlightedHtml = `<pre><code>${escapeHtml(trimmedContent)}</code></pre>`;
    }

    if (entry) {
      // Known file/region -- produce a decorated code block
      blocks.push({
        type: 'code',
        file: entry.file,
        region: entry.region,
        regionLabel: entry.regionLabel,
        language: block.language,
        code: trimmedContent,
        highlightedHtml,
        startLine: entry.startLine,
        endLine: entry.endLine,
      });
    } else {
      // Unknown code block -- still render as code but without file decoration
      blocks.push({
        type: 'code',
        file: '',
        language: block.language,
        code: trimmedContent,
        highlightedHtml,
      });
    }

    cursor = block.end;
  }

  // Trailing prose after the last code block
  if (cursor < proseMarkdown.length) {
    const proseMd = proseMarkdown.slice(cursor);
    const trimmed = proseMd.trim();
    if (trimmed) {
      const html = await renderMarkdown(trimmed);
      blocks.push({ type: 'html', html });
    }
  }

  return blocks;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
