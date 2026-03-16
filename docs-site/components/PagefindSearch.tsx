import { useCallback, useEffect, useRef, useState } from 'react';
import { applyBaseUrl } from '../utils/base-url';

interface SearchResult {
  id: string;
  url: string;
  title: string;
  excerpt: string;
}

interface PagefindSearchResponse {
  results: Array<{
    id: string;
    data: () => Promise<{
      url: string;
      meta: { title?: string };
      excerpt: string;
    }>;
  }>;
}

interface PagefindModule {
  search: (query: string) => Promise<PagefindSearchResponse>;
  debouncedSearch: (
    query: string,
    options?: { debounceTimeoutMs?: number }
  ) => Promise<PagefindSearchResponse>;
}

declare global {
  interface Window {
    pagefind?: PagefindModule;
  }
}

/**
 * Blueprint-themed search with Cmd/Ctrl+K and keyboard navigation.
 */
export function PagefindSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pagefindReady, setPagefindReady] = useState(false);
  const [pagefindError, setPagefindError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const url = applyBaseUrl('/pagefind/pagefind.js');
        const pagefind = await import(/* @vite-ignore */ url);
        window.pagefind = pagefind as PagefindModule;
        setPagefindReady(true);
      } catch {
        console.debug('Pagefind not available — run build first');
        setPagefindError(true);
      }
    };
    load();
  }, []);

  const handleSearch = useCallback(
    async (q: string) => {
      setQuery(q);
      setSelectedIndex(0);
      if (!q.trim()) { setResults([]); setIsOpen(false); return; }
      if (!pagefindReady || !window.pagefind) { setIsOpen(true); return; }
      setIsLoading(true);
      setIsOpen(true);
      try {
        const response = await window.pagefind.debouncedSearch(q, { debounceTimeoutMs: 150 });
        if (!response?.results) { setResults([]); return; }
        const loaded = await Promise.all(
          response.results.slice(0, 8).map(async (r) => {
            const data = await r.data();
            return { id: r.id, url: data.url, title: data.meta?.title || 'Untitled', excerpt: data.excerpt };
          })
        );
        setResults(loaded);
      } catch { setResults([]); }
      finally { setIsLoading(false); }
    },
    [pagefindReady]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus(); setIsOpen(true); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setSelectedIndex((p) => Math.min(p + 1, results.length - 1)); break;
      case 'ArrowUp': e.preventDefault(); setSelectedIndex((p) => Math.max(p - 1, 0)); break;
      case 'Enter': e.preventDefault(); if (results[selectedIndex]) { window.location.href = results[selectedIndex].url; setIsOpen(false); } break;
      case 'Escape': e.preventDefault(); setIsOpen(false); inputRef.current?.blur(); break;
    }
  };

  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const el = resultsRef.current.children[selectedIndex] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, results.length]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-bp-line-dim pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          className="w-56 pl-9 pr-14 py-1.5 rounded text-xs font-code bg-bp-paper-light/60 border border-bp-line-dim/25 text-bp-line placeholder:text-bp-line-dim focus:border-bp-accent focus:outline-none transition-all"
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1 py-0.5 text-[0.5625rem] bg-bp-paper border border-bp-line-dim/25 rounded text-bp-line-dim pointer-events-none">
          ⌘K
        </kbd>
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50 w-96 max-h-96 overflow-y-auto bp-glass rounded border border-bp-line-dim/30">
          {pagefindError ? (
            <div className="p-4 text-center text-sm">
              <div className="text-bp-amber mb-1">Search unavailable</div>
              <div className="text-bp-line-dim text-xs">
                Build the site with <code className="text-bp-accent">pnpm build</code> to enable search.
              </div>
            </div>
          ) : isLoading ? (
            <div className="px-4 py-6 text-center text-bp-line-dim text-sm">Searching...</div>
          ) : results.length > 0 ? (
            <>
              <div className="px-3 py-1.5 text-[0.625rem] text-bp-line-dim border-b border-bp-line-dim/15 font-code uppercase tracking-wider">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              <div ref={resultsRef}>
                {results.map((result, i) => (
                  <button
                    key={result.id}
                    onClick={() => { window.location.href = result.url; setIsOpen(false); }}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full text-left px-3 py-2.5 border-b border-bp-line-dim/10 last:border-0 transition-colors ${
                      i === selectedIndex ? 'bg-bp-accent/10' : 'hover:bg-bp-surface/30'
                    }`}
                  >
                    <div className={`text-sm font-medium ${i === selectedIndex ? 'text-bp-line-bright' : 'text-bp-line'}`}>
                      {result.title}
                    </div>
                    <div className="text-xs text-bp-line-dim mt-0.5 line-clamp-2" dangerouslySetInnerHTML={{ __html: result.excerpt }} />
                  </button>
                ))}
              </div>
              <div className="px-3 py-1.5 text-[0.5625rem] text-bp-line-dim border-t border-bp-line-dim/15 flex items-center gap-3 font-code">
                <span><kbd className="px-1 bg-bp-paper rounded">↑↓</kbd> nav</span>
                <span><kbd className="px-1 bg-bp-paper rounded">↵</kbd> select</span>
                <span><kbd className="px-1 bg-bp-paper rounded">esc</kbd> close</span>
              </div>
            </>
          ) : query ? (
            <div className="px-4 py-6 text-center text-bp-line-dim text-sm">No results for &ldquo;{query}&rdquo;</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
