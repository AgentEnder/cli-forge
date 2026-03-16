import { useState } from 'react';
import { CodeBlock, slugifyFilename } from './CodeBlock';

interface ProseCodeBlockProps {
  file: string;
  region?: string;
  regionLabel?: string;
  language: string;
  code: string;
  highlightedHtml: string;
  startLine?: number;
  endLine?: number;
  onNavigate?: (file: string, region?: string) => void;
}

/**
 * Interactive code block for prose content. Shows a clickable
 * file/region header that navigates to the FileExplorer below.
 */
export function ProseCodeBlock({
  file,
  region,
  regionLabel,
  language,
  code,
  highlightedHtml,
  startLine,
  onNavigate,
}: ProseCodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const hasFile = file.length > 0;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNavigate = () => {
    if (hasFile && onNavigate) {
      onNavigate(file, region);
    }
  };

  // Build display label: "filename.ts" or "filename.ts › regionName"
  const displayLabel = regionLabel
    ? `${file} › ${regionLabel}`
    : region
      ? `${file} › ${region}`
      : file;

  return (
    <div className="my-5 relative">
      <div className="rounded-sm border border-gray-700 overflow-hidden bg-gray-900">
        {/* Header with file/region info */}
        {hasFile && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700">
            <button
              onClick={handleNavigate}
              className="flex items-center gap-1.5 text-xs font-mono text-blue-400 hover:text-white transition-colors group"
              title={`Open ${file} in File Explorer`}
            >
              {/* File icon */}
              <svg
                className="w-3 h-3 text-gray-400 group-hover:text-blue-400 transition-colors"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>{displayLabel}</span>
              {/* Arrow hint */}
              <svg
                className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M7 17l9.2-9.2M17 17V7.8H7.8" />
              </svg>
            </button>

            <button
              onClick={handleCopy}
              className="text-gray-400 hover:text-gray-200 transition-colors p-1"
              aria-label="Copy code"
              title="Copy code"
            >
              {copied ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              )}
            </button>
          </div>
        )}

        {/* Code body — delegate to CodeBlock without its own header */}
        <CodeBlock
          highlightedHtml={highlightedHtml}
          code={code}
          language={language}
          showHeader={!hasFile}
          showLineNumbers={true}
          lineNumberStart={startLine ?? 1}
          anchorPrefix={hasFile ? `prose-${slugifyFilename(file)}` : undefined}
          className="border-0 rounded-none"
        />
      </div>
    </div>
  );
}
