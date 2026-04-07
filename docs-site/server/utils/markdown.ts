import rehypeParse from 'rehype-parse';
import rehypeShiki from '@shikijs/rehype';
import { rehypeGithubAlerts } from 'rehype-github-alerts';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import type { RemarkCodePropsOptions } from 'rehype-typedoc';
import { remarkCodeProps } from 'rehype-typedoc';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import type { Plugin } from 'unified';
import { unified } from 'unified';
import { forgeTheme } from './highlighter.js';

// Pre-configured rehype-typedoc plugins — set once at startup via configureRehypeTypedoc
let _rehypePlugins: Plugin[] | undefined;

// Module-level remark-code-props options — configured once, used by all renderMarkdown calls
let _remarkCodePropsOptions: RemarkCodePropsOptions | undefined;

/**
 * Configure rehype-typedoc plugins for auto-linking inline code to API docs.
 * Pass the result of `typedocContext.getRehypePlugins()`.
 * Call this once at startup (before rendering markdown) so that all
 * subsequent `renderMarkdown` calls automatically apply typedoc links.
 */
export function configureRehypeTypedoc(plugins: Plugin[]): void {
  _rehypePlugins = plugins;
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

  // Syntax highlighting via @shikijs/rehype
  // addLanguageClass preserves language info so rehypeTypedocCodeBlocks can skip non-TS blocks
  processor.use(rehypeShiki, { theme: forgeTheme, addLanguageClass: true });

  // Apply pre-configured rehype-typedoc plugins (inline linking + code block linking).
  // These run after shiki so code block symbol linking can operate on highlighted tokens.
  // Pass the whole list in one `use()` call so unified treats it as a PluggableList
  // (first-element-is-not-a-function path) rather than a [plugin, ...settings] tuple.
  if (_rehypePlugins?.length) {
    processor.use(_rehypePlugins as any);
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
  if (!_rehypePlugins?.length) return html;

  return unified()
    .use(rehypeParse, { fragment: true })
    .use(_rehypePlugins as any)
    .use(rehypeStringify)
    .processSync(html)
    .toString();
}
