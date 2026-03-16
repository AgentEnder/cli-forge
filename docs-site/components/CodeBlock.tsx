import { useCallback, useEffect, useRef, useState } from 'react';

export interface HighlightLines {
  start: number;
  end: number;
}

interface CodeBlockProps {
  highlightedHtml?: string;
  code?: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  showHeader?: boolean;
  className?: string;
  /** Starting line number (default 1). Useful for region blocks that start mid-file. */
  lineNumberStart?: number;
  /** Line range to highlight (1-based, inclusive). */
  highlightLines?: HighlightLines | null;
  /** Prefix for line-number anchor IDs, e.g. "prose-utils-ts" → id="prose-utils-ts-L5". */
  anchorPrefix?: string;
}

/**
 * Slugify a filename for use as an anchor ID segment.
 * e.g. "toml-extractor.ts" → "toml-extractor-ts"
 */
export function slugifyFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/**
 * Parse a URL hash into an anchor prefix and line range.
 *
 * Supports:
 *   #prefix-L10       → { prefix, start: 10, end: 10 }
 *   #prefix-L10-L25   → { prefix, start: 10, end: 25 }
 *
 * The `-L\d+` segments are parsed from the end, so dashes in the
 * prefix (from slugified filenames) don't cause ambiguity.
 */
export function parseLineHash(
  hash: string
): { prefix: string; start: number; end: number } | null {
  if (!hash.startsWith('#')) return null;
  const value = hash.slice(1);

  // Range: prefix-L10-L25
  const rangeMatch = value.match(/^(.+)-L(\d+)-L(\d+)$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[2], 10);
    const end = parseInt(rangeMatch[3], 10);
    return {
      prefix: rangeMatch[1],
      start: Math.min(start, end),
      end: Math.max(start, end),
    };
  }

  // Single line: prefix-L10
  const singleMatch = value.match(/^(.+)-L(\d+)$/);
  if (singleMatch) {
    const line = parseInt(singleMatch[2], 10);
    return { prefix: singleMatch[1], start: line, end: line };
  }

  return null;
}

/**
 * Add line numbers to Shiki-highlighted HTML by wrapping each
 * `<span class="line">` in a flex row with an anchor-linked gutter number.
 *
 * Line number anchors get a data-line attribute for click handling.
 */
function addLineNumbersToShikiHtml(
  html: string,
  startLine: number,
  effectiveHighlight?: HighlightLines | null,
  anchorPrefix?: string
): string {
  let lineNum = startLine;
  return html.replace(/<span class="line">/g, () => {
    const num = lineNum++;
    const isHighlighted =
      effectiveHighlight &&
      num >= effectiveHighlight.start &&
      num <= effectiveHighlight.end;
    const lineClass = isHighlighted ? 'line highlighted-line' : 'line';
    const anchorId = anchorPrefix ? `${anchorPrefix}-L${num}` : undefined;
    const gutterTag = anchorId
      ? `<a id="${anchorId}" href="#${anchorId}" data-line="${num}" onclick="event.preventDefault()" class="line-number" style="display:inline-block;width:2rem;text-align:right;margin-right:1rem;color:rgba(143,164,190,0.4);user-select:none;flex-shrink:0;text-decoration:none">${num}</a>`
      : `<span class="line-number" style="display:inline-block;width:2rem;text-align:right;margin-right:1rem;color:rgba(143,164,190,0.4);user-select:none;flex-shrink:0">${num}</span>`;
    return `<span class="${lineClass}">${gutterTag}`;
  });
}

/**
 * Blueprint-themed code block with header bar and copy button.
 */
export function CodeBlock({
  highlightedHtml,
  code,
  language,
  filename,
  showLineNumbers = true,
  showHeader = true,
  className = '',
  lineNumberStart = 1,
  highlightLines,
  anchorPrefix,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const displayCode = code ?? '';
  const codeRef = useRef<HTMLDivElement>(null);
  // Track the hash-driven highlight for this block
  const [hashHighlight, setHashHighlight] = useState<HighlightLines | null>(
    null
  );
  // Track the first line clicked (for shift-click range selection)
  const rangeAnchorRef = useRef<number | null>(null);
  // Flag to suppress scroll when the hash change originated from a click within this block
  const selfClickRef = useRef(false);

  // Merge prop-driven and hash-driven highlights (hash takes priority when targeting this block)
  const effectiveHighlight = hashHighlight ?? highlightLines ?? null;

  // ── Hash parsing: check if the current URL hash targets this block ──
  const syncFromHash = useCallback(() => {
    if (!anchorPrefix) return;
    const parsed = parseLineHash(window.location.hash);
    if (parsed && parsed.prefix === anchorPrefix) {
      setHashHighlight({ start: parsed.start, end: parsed.end });
    } else {
      setHashHighlight(null);
    }
  }, [anchorPrefix]);

  useEffect(() => {
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [syncFromHash]);

  // Scroll to the first highlighted line when hash targets this block
  // (skip when the hash change came from clicking within this same block)
  useEffect(() => {
    if (!hashHighlight || !anchorPrefix) return;
    if (selfClickRef.current) {
      selfClickRef.current = false;
      return;
    }
    const targetId = `${anchorPrefix}-L${hashHighlight.start}`;
    // Small delay to let the DOM settle after render
    const timer = setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [hashHighlight, anchorPrefix]);

  // ── Click handler for line number anchors (event delegation on Shiki HTML) ──
  useEffect(() => {
    if (!codeRef.current || !anchorPrefix) return;
    const container = codeRef.current;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest(
        'a.line-number'
      ) as HTMLAnchorElement | null;
      if (!anchor) return;

      e.preventDefault();
      const lineNum = parseInt(anchor.dataset.line ?? '', 10);
      if (isNaN(lineNum)) return;

      selfClickRef.current = true;
      if (e.shiftKey && rangeAnchorRef.current != null) {
        // Shift-click: create range from anchor to this line
        const start = Math.min(rangeAnchorRef.current, lineNum);
        const end = Math.max(rangeAnchorRef.current, lineNum);
        const hash = `#${anchorPrefix}-L${start}-L${end}`;
        history.replaceState(null, '', hash);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } else {
        // Normal click: select single line, set as range anchor
        rangeAnchorRef.current = lineNum;
        const hash = `#${anchorPrefix}-L${lineNum}`;
        history.replaceState(null, '', hash);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [anchorPrefix]);

  // Apply highlight classes via DOM for non-line-numbered Shiki paths
  useEffect(() => {
    if (!effectiveHighlight || !codeRef.current) return;
    const lines = codeRef.current.querySelectorAll('.line');
    lines.forEach((el, i) => {
      const lineNum = lineNumberStart + i;
      if (
        lineNum >= effectiveHighlight.start &&
        lineNum <= effectiveHighlight.end
      ) {
        el.classList.add('highlighted-line');
      } else {
        el.classList.remove('highlighted-line');
      }
    });
  }, [effectiveHighlight, lineNumberStart]);

  const handleCopy = async () => {
    const textToCopy =
      code ??
      (highlightedHtml
        ? new DOMParser().parseFromString(highlightedHtml, 'text/html').body
            .textContent ?? ''
        : '');
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Post-process Shiki HTML to add line numbers
  const processedHtml =
    highlightedHtml && showLineNumbers
      ? addLineNumbersToShikiHtml(
          highlightedHtml,
          lineNumberStart,
          effectiveHighlight,
          anchorPrefix
        )
      : highlightedHtml;

  // ── Click handler for the JSX fallback path (plain text) ──
  const handlePlainLineClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    lineNum: number
  ) => {
    if (!anchorPrefix) return;
    e.preventDefault();

    selfClickRef.current = true;
    if (e.shiftKey && rangeAnchorRef.current != null) {
      const start = Math.min(rangeAnchorRef.current, lineNum);
      const end = Math.max(rangeAnchorRef.current, lineNum);
      history.replaceState(null, '', `#${anchorPrefix}-L${start}-L${end}`);
    } else {
      rangeAnchorRef.current = lineNum;
      history.replaceState(null, '', `#${anchorPrefix}-L${lineNum}`);
    }
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };

  return (
    <div
      className={`flex flex-col rounded border border-bp-line-dim/25 overflow-hidden bg-[rgba(18,42,72,0.95)] ${className}`}
    >
      {/* Header bar */}
      {showHeader && (filename || language) && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-bp-paper-light/60 border-b border-bp-line-dim/20">
          <div className="flex items-center gap-2">
            {filename && (
              <span className="text-xs font-code text-bp-line-dim">
                {filename}
              </span>
            )}
            {!filename && language && (
              <span className="text-[0.625rem] font-code text-bp-line-dim uppercase tracking-wider">
                {language}
              </span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="text-bp-line-dim hover:text-bp-line transition-colors p-1"
            aria-label="Copy code"
            title="Copy code"
          >
            {copied ? (
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Code content */}
      <div className="overflow-x-auto flex-1">
        {processedHtml ? (
          <div
            ref={codeRef}
            className="p-4 text-sm font-code leading-relaxed [&_code]:whitespace-normal [&_.line]:flex [&_.line]:whitespace-pre"
            dangerouslySetInnerHTML={{ __html: processedHtml }}
          />
        ) : (
          <pre className="p-4 text-sm font-code leading-relaxed text-bp-line">
            {showLineNumbers ? (
              <code>
                {displayCode.split('\n').map((line, i) => {
                  const num = lineNumberStart + i;
                  const isHighlighted =
                    effectiveHighlight &&
                    num >= effectiveHighlight.start &&
                    num <= effectiveHighlight.end;
                  const anchorId = anchorPrefix
                    ? `${anchorPrefix}-L${num}`
                    : undefined;
                  return (
                    <div
                      key={i}
                      className={`flex ${
                        isHighlighted ? 'highlighted-line' : ''
                      }`}
                    >
                      {anchorId ? (
                        <a
                          id={anchorId}
                          href={`#${anchorId}`}
                          data-line={num}
                          onClick={(e) => handlePlainLineClick(e, num)}
                          className="w-8 shrink-0 text-right mr-4 text-bp-line-dim/40 select-none no-underline hover:text-bp-accent transition-colors"
                        >
                          {num}
                        </a>
                      ) : (
                        <span className="w-8 shrink-0 text-right mr-4 text-bp-line-dim/40 select-none">
                          {num}
                        </span>
                      )}
                      <span>{line}</span>
                    </div>
                  );
                })}
              </code>
            ) : (
              <code>{displayCode}</code>
            )}
          </pre>
        )}
      </div>
    </div>
  );
}
