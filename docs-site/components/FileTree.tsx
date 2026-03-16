import { useState } from 'react';

interface FileTreeEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeEntry[];
}

interface FileTreeProps {
  files: Array<{ relativePath: string }>;
  activeFile: string | null;
  onSelectFile: (path: string) => void;
}

export function FileTree({ files, activeFile, onSelectFile }: FileTreeProps) {
  const tree = buildTree(files.map((f) => f.relativePath));

  return (
    <div className="py-2 text-sm font-code">
      {tree.map((entry) => (
        <TreeNode
          key={entry.path}
          entry={entry}
          activeFile={activeFile}
          onSelectFile={onSelectFile}
          depth={0}
        />
      ))}
    </div>
  );
}

function TreeNode({
  entry,
  activeFile,
  onSelectFile,
  depth,
}: {
  entry: FileTreeEntry;
  activeFile: string | null;
  onSelectFile: (path: string) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const isActive = activeFile === entry.path;
  const paddingLeft = 8 + depth * 16;

  if (entry.isDirectory) {
    return (
      <div>
        <button
          className="w-full flex items-center gap-1.5 py-1 hover:bg-bp-surface/30 transition-colors text-bp-line-dim"
          style={{ paddingLeft }}
          onClick={() => setExpanded(!expanded)}
        >
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5l8 7-8 7z" />
          </svg>
          <FolderIcon />
          <span>{entry.name}</span>
        </button>
        {expanded &&
          entry.children?.map((child) => (
            <TreeNode
              key={child.path}
              entry={child}
              activeFile={activeFile}
              onSelectFile={onSelectFile}
              depth={depth + 1}
            />
          ))}
      </div>
    );
  }

  return (
    <button
      className={`
        w-full flex items-center gap-1.5 py-1 transition-all text-left border-l-2
        ${
          isActive
            ? 'text-bp-line border-bp-accent bg-bp-accent/5 animate-pulse-accent'
            : 'text-bp-line-dim hover:text-bp-line hover:bg-bp-surface/20 border-transparent'
        }
      `}
      style={{ paddingLeft: paddingLeft + 12 }}
      onClick={() => onSelectFile(entry.path)}
    >
      <FileIcon name={entry.name} />
      <span className="truncate">{entry.name}</span>
    </button>
  );
}

function FolderIcon() {
  return (
    <svg className="w-4 h-4 text-bp-amber/80 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
    </svg>
  );
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase();
  let color = 'text-bp-line-dim';
  if (ext === 'ts' || ext === 'tsx') color = 'text-bp-accent';
  else if (ext === 'js' || ext === 'jsx') color = 'text-bp-amber';
  else if (ext === 'json' || ext === 'jsonc') color = 'text-bp-amber/70';
  else if (ext === 'yml' || ext === 'yaml') color = 'text-bp-green';
  else if (ext === 'md') color = 'text-bp-line';

  return (
    <svg className={`w-4 h-4 ${color} shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function buildTree(paths: string[]): FileTreeEntry[] {
  const root: FileTreeEntry[] = [];

  for (const path of paths.sort()) {
    const parts = path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const partPath = parts.slice(0, i + 1).join('/');

      let existing = current.find((e) => e.name === name);
      if (!existing) {
        existing = {
          name,
          path: partPath,
          isDirectory: !isLast,
          children: isLast ? undefined : [],
        };
        current.push(existing);
      }

      if (!isLast) {
        if (!existing.children) existing.children = [];
        current = existing.children;
      }
    }
  }

  return root;
}
