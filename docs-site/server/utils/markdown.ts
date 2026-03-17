import rehypeParse from 'rehype-parse';
import rehypeShiki from '@shikijs/rehype';
import { rehypeGithubAlerts } from 'rehype-github-alerts';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import type { RehypeTypedocOptions, RemarkCodePropsOptions } from 'rehype-typedoc';
import { rehypeTypedoc, rehypeTypedocCodeBlocks, remarkCodeProps } from 'rehype-typedoc';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { forgeTheme } from './highlighter.js';

// Module-level rehype-typedoc options — configured once, used by all renderMarkdown calls
let _rehypeOptions: RehypeTypedocOptions | undefined;

// Module-level remark-code-props options — configured once, used by all renderMarkdown calls
let _remarkCodePropsOptions: RemarkCodePropsOptions | undefined;

/**
 * Configure rehype-typedoc options for auto-linking inline code to API docs.
 * Call this once at startup (before rendering markdown) so that all
 * subsequent `renderMarkdown` calls automatically apply typedoc links.
 */
export function configureRehypeTypedoc(
  options: RehypeTypedocOptions
): void {
  _rehypeOptions = options;
}

/**
 * Configure remark-code-props options (e.g. `resolveSignature` for `::typedoc` directives).
 * Call this once at startup so that all subsequent `renderMarkdown` calls
 * can resolve type signatures from TypeDoc data.
 */
export function configureRemarkCodeProps(
  options: RemarkCodePropsOptions
): void {
  _remarkCodePropsOptions = options;
}

/**
 * Convert a Markdown string to syntax-highlighted HTML.
 *
 * The unified pipeline:
 *   remarkParse -> remarkGfm -> remarkDirective -> remarkCodeProps
 *     -> remarkRehype (with raw HTML pass-through) -> rehypeRaw -> rehypeGithubAlerts
 *     -> rehypeTypedoc (inline code linking, if configured)
 *     -> @shikijs/rehype (syntax highlighting)
 *     -> rehypeTypedocCodeBlocks (code block symbol linking, if configured)
 *     -> rehypeStringify
 */
export async function renderMarkdown(md: string): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkCodeProps, _remarkCodePropsOptions ?? {})
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeGithubAlerts, {});

  // Add rehype-typedoc for inline code linking if options have been configured
  if (_rehypeOptions) {
    processor.use(rehypeTypedoc, _rehypeOptions);
  }

  // Syntax highlighting via @shikijs/rehype
  // addLanguageClass preserves language info so rehypeTypedocCodeBlocks can skip non-TS blocks
  processor.use(rehypeShiki, { theme: forgeTheme, addLanguageClass: true });

  // Add code block symbol linking after shiki highlighting
  if (_rehypeOptions) {
    processor.use(rehypeTypedocCodeBlocks, _rehypeOptions);
  }

  processor.use(rehypeStringify);

  const file = await processor.process(md);
  return String(file);
}

/**
 * Strip top-level `<h1>` elements from rendered HTML.
 *
 * Page layouts render their own `<h1>` from structured data (title, package
 * name, etc.), so the `<h1>` produced by markdown is always redundant.
 */
export function stripH1(html: string): string {
  return html.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>\s*/gi, '');
}

/**
 * Post-process Shiki-highlighted HTML to add symbol links.
 *
 * Use this for code blocks produced by `highlighter.codeToHtml()` outside
 * the unified markdown pipeline (e.g. file explorer, prose code blocks).
 * Parses the HTML into HAST, runs rehypeTypedocCodeBlocks, then serializes.
 *
 * Returns the input unchanged if rehype-typedoc is not configured.
 */
export function linkifyCodeHtml(html: string): string {
  if (!_rehypeOptions) return html;

  return unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeTypedocCodeBlocks, _rehypeOptions)
    .use(rehypeStringify)
    .processSync(html)
    .toString();
}
