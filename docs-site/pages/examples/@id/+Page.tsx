import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useData } from 'vike-react/useData';
import {
  parseLineHash,
  slugifyFilename,
  type HighlightLines,
} from '../../../components/CodeBlock';
import { FileExplorer } from '../../../components/FileExplorer';
import { Link } from '../../../components/Link';
import { ProseRenderer } from '../../../components/ProseRenderer';
import { TableOfContents } from '../../../components/TableOfContents';
import type { ExampleDetailData } from './+data';

const EXPLORER_PREFIX = 'explorer-';

/**
 * Resolve a hash like `#explorer-scan-ts-L10` to { file, highlight }.
 * Matches the slug portion against the example's files.
 */
function resolveExplorerHash(
  hash: string,
  files: { relativePath: string }[]
): { file: string; highlight: HighlightLines | null } | null {
  const parsed = parseLineHash(hash);
  if (!parsed || !parsed.prefix.startsWith(EXPLORER_PREFIX)) return null;

  const slug = parsed.prefix.slice(EXPLORER_PREFIX.length);
  const file = files.find(
    (f) => slugifyFilename(f.relativePath) === slug
  );
  if (!file) return null;

  return {
    file: file.relativePath,
    highlight: { start: parsed.start, end: parsed.end },
  };
}

export default function ExampleDetailPage() {
  const { example } = useData<ExampleDetailData>();

  const files = useMemo(() => example?.files ?? [], [example?.files]);

  // Default to first non-package.json file (matches FileExplorer's uncontrolled default)
  const fallbackFile =
    files.find((f) => f.relativePath !== 'package.json')?.relativePath ??
    files[0]?.relativePath ??
    null;

  const [activeFile, setActiveFile] = useState<string | null>(fallbackFile);
  const [highlightLines, setHighlightLines] = useState<HighlightLines | null>(
    null
  );
  const fileExplorerRef = useRef<HTMLDivElement>(null);

  // On mount, check if URL hash targets the explorer and select that file
  useEffect(() => {
    const resolved = resolveExplorerHash(window.location.hash, files);
    if (resolved) {
      setActiveFile(resolved.file);
    }
  }, [files]);

  // Listen for hash changes targeting the explorer (e.g. from prose anchor clicks)
  useEffect(() => {
    const handleHashChange = () => {
      const resolved = resolveExplorerHash(window.location.hash, files);
      if (resolved) {
        setActiveFile(resolved.file);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [files]);

  const handleNavigateToFile = useCallback(
    (file: string, regionId?: string) => {
      setActiveFile(file);

      // Look up line range from the file's hunks
      if (regionId && example) {
        const siteFile = example.files.find((f) => f.relativePath === file);
        const hunk = siteFile?.hunks?.find(
          (h: { id: string }) => h.id === regionId
        );
        if (hunk) {
          setHighlightLines({
            start: hunk.startLine,
            end: hunk.endLine,
          });
        } else {
          setHighlightLines(null);
        }
      } else {
        setHighlightLines(null);
      }

      // Scroll to file explorer
      requestAnimationFrame(() => {
        fileExplorerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    },
    [example]
  );

  const handleActiveFileChange = useCallback((file: string) => {
    setActiveFile(file);
    setHighlightLines(null);
  }, []);

  if (!example) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-forge-flame-bright mb-2">
          Example Not Found
        </h1>
        <p className="text-forge-ash mb-4">
          The requested example could not be found.
        </p>
        <Link
          href="/examples"
          className="text-forge-ember-bright hover:text-forge-flame underline"
        >
          Back to Examples
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      <div className="flex-1 min-w-0">
      {/* Prose content -- capped at readable width */}
      <div className="max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-forge-ash-dim mb-6">
          <Link href="/examples" className="hover:text-forge-smoke">
            Examples
          </Link>
          <span>/</span>
          <span className="text-forge-smoke">{example.title}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-forge-flame-bright font-[Cinzel] mb-3">
            {example.title}
          </h1>
          {example.renderedDescriptionHtml && (
            <div
              className="prose-content max-w-2xl text-forge-ash"
              dangerouslySetInnerHTML={{ __html: example.renderedDescriptionHtml }}
            />
          )}
        </div>

        {/* Metadata stamps */}
        <div className="flex gap-3 flex-wrap mb-6">
          <span className="inline-block px-2 py-0.5 border border-forge-iron-light text-xs uppercase text-forge-ember-bright">
            {example.extractorName}
          </span>
          <span className="inline-block px-2 py-0.5 border border-forge-iron-light text-xs uppercase text-forge-ash">
            {example.files.length} FILES
          </span>
          {example.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block px-2 py-0.5 border border-forge-iron-light text-xs uppercase text-forge-success"
            >
              {tag}
            </span>
          ))}
          <Link
            href={`/playground?example=${example.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-forge-flame hover:bg-forge-flame-bright text-forge-bg text-xs font-semibold uppercase rounded transition-colors no-underline"
          >
            Try in Playground
          </Link>
        </div>
      </div>

      {/* Rendered prose -- structured blocks break out of max-w for code */}
      {example.proseBlocks ? (
        <div className="mb-10">
          <ProseRenderer
            blocks={example.proseBlocks}
            onNavigateToFile={handleNavigateToFile}
          />
          <hr className="border-dashed border-forge-iron-light mt-8 max-w-4xl" />
        </div>
      ) : example.renderedProseHtml ? (
        <div className="mb-10 max-w-4xl">
          <div
            className="prose-content"
            dangerouslySetInnerHTML={{ __html: example.renderedProseHtml }}
          />
          <hr className="border-dashed border-forge-iron-light mt-8" />
        </div>
      ) : null}

      <div className="max-w-4xl">
        <div className="prose-content">
          <h2>All Example Files</h2>
        </div>
      </div>

      {/* File Explorer -- full width, not capped */}
      <FileExplorer
        ref={fileExplorerRef}
        files={example.files}
        activeFile={activeFile}
        onActiveFileChange={handleActiveFileChange}
        highlightLines={highlightLines}
        className="mb-8"
      />
      </div>

      {example.headings.length > 0 && (
        <aside className="hidden xl:block w-56 shrink-0">
          <div className="sticky top-20">
            <TableOfContents headings={example.headings} />
          </div>
        </aside>
      )}
    </div>
  );
}
