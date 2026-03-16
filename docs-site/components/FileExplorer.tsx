import { forwardRef, useState } from 'react';
import type { SiteExampleFile } from '../server/utils/examples';
import { BlueprintFrame } from './BlueprintFrame';
import { type HighlightLines, slugifyFilename } from './CodeBlock';
import { CodePreviewPanel } from './CodePreviewPanel';
import { FileTree } from './FileTree';

interface FileExplorerProps {
  files: SiteExampleFile[];
  defaultFile?: string;
  className?: string;
  /** Controlled active file (optional). */
  activeFile?: string | null;
  /** Callback when user selects a file (controlled mode). */
  onActiveFileChange?: (file: string) => void;
  /** Lines to highlight in the active file. */
  highlightLines?: HighlightLines | null;
}

/**
 * Two-pane file explorer: tree on the left, code preview on the right.
 * Wrapped in a BlueprintFrame for the engineering drawing aesthetic.
 *
 * Supports both controlled mode (activeFile + onActiveFileChange) and
 * uncontrolled mode (internal state with optional defaultFile).
 */
export const FileExplorer = forwardRef<HTMLDivElement, FileExplorerProps>(
  function FileExplorer(
    {
      files,
      defaultFile,
      className = '',
      activeFile: controlledActive,
      onActiveFileChange,
      highlightLines,
    },
    ref
  ) {
    const initial =
      defaultFile ??
      files.find((f) => f.relativePath !== 'package.json')?.relativePath ??
      files[0]?.relativePath ??
      null;
    const [internalActive, setInternalActive] = useState<string | null>(initial);

    const isControlled = controlledActive !== undefined;
    const activeFile = isControlled ? controlledActive : internalActive;

    const handleSelectFile = (file: string) => {
      if (isControlled) {
        onActiveFileChange?.(file);
      } else {
        setInternalActive(file);
      }
    };

    const selectedFile = files.find((f) => f.relativePath === activeFile);

    return (
      <div ref={ref} className={className}>
        <BlueprintFrame>
          <div className="flex flex-col min-h-100 -m-6">
            {/* Unified header row */}
            <div className="flex shrink-0 border-b border-bp-line-dim/20 bg-bp-paper-light/60">
              <div className="w-52 shrink-0 flex items-center px-3 py-1.5 border-r border-bp-line-dim/20">
                <span className="bp-annotation">FILE EXPLORER</span>
              </div>
              <div className="flex-1 flex items-center justify-between px-3 py-1.5 min-w-0">
                {selectedFile && (
                  <span className="text-xs font-code text-bp-line-dim truncate">
                    {selectedFile.relativePath}
                  </span>
                )}
              </div>
            </div>

            {/* Content panes */}
            <div className="flex flex-1 min-h-0">
              {/* File tree */}
              <div className="w-52 shrink-0 border-r border-bp-line-dim/20 overflow-y-auto bg-[rgba(14,35,60,0.95)]">
                <FileTree
                  files={files}
                  activeFile={activeFile}
                  onSelectFile={handleSelectFile}
                />
              </div>

              {/* Code preview */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {selectedFile ? (
                  <CodePreviewPanel
                    filename={selectedFile.relativePath}
                    language={selectedFile.language}
                    code={selectedFile.content}
                    highlightedHtml={selectedFile.highlightedHtml}
                    showHeader={false}
                    highlightLines={highlightLines}
                    anchorPrefix={`explorer-${slugifyFilename(selectedFile.relativePath)}`}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-bp-line-dim">
                    <span className="bp-annotation">Select a file to preview</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </BlueprintFrame>
      </div>
    );
  }
);
