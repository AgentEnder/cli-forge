import { CodeBlock, type HighlightLines } from './CodeBlock';

interface CodePreviewPanelProps {
  filename: string;
  language: string;
  code: string;
  highlightedHtml: string;
  showHeader?: boolean;
  highlightLines?: HighlightLines | null;
  /** Prefix for line-number anchor IDs. */
  anchorPrefix?: string;
}

/**
 * The right pane of the FileExplorer — shows the selected file's
 * code with blueprint-themed syntax highlighting.
 */
export function CodePreviewPanel({
  filename,
  language,
  code,
  highlightedHtml,
  showHeader = true,
  highlightLines,
  anchorPrefix,
}: CodePreviewPanelProps) {
  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <CodeBlock
        filename={filename}
        language={language}
        code={code}
        highlightedHtml={highlightedHtml}
        showHeader={showHeader}
        highlightLines={highlightLines}
        anchorPrefix={anchorPrefix}
        className="flex-1 border-0 rounded-none"
      />
    </div>
  );
}
