import { useEffect, useState } from 'react';
import type { TocEntry } from '../server/utils/docs';

interface TableOfContentsProps {
  headings: TocEntry[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px', threshold: 0 }
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-forge-ash-dim mb-3">
        On this page
      </p>
      {headings.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          className={`block text-sm py-0.5 transition-colors ${
            heading.level === 3 ? 'pl-3' : ''
          } ${
            activeId === heading.id
              ? 'text-forge-ember-bright'
              : 'text-forge-ash-dim hover:text-forge-smoke'
          }`}
        >
          {heading.text}
        </a>
      ))}
    </nav>
  );
}
