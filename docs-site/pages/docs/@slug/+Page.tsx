import { useEffect, useRef } from 'react';
import { useData } from 'vike-react/useData';
import { Link } from '../../../components/Link';
import { TableOfContents } from '../../../components/TableOfContents';
import type { DocDetailData } from './+data';

/**
 * Hydrate `.code-tabs` containers rendered from markdown.
 * Each container has `.code-tab[data-tab]` children. We prepend a
 * row of buttons and wire up click handlers to toggle visibility.
 */
function hydrateCodeTabs(root: HTMLElement): void {
  for (const container of root.querySelectorAll<HTMLElement>('.code-tabs')) {
    const tabs = Array.from(
      container.querySelectorAll<HTMLElement>(':scope > .code-tab[data-tab]')
    );
    if (tabs.length === 0) continue;

    // Already hydrated?
    if (container.querySelector('.code-tab-buttons')) continue;

    const defaultTab = container.dataset.default ?? '';

    // Build button bar
    const bar = document.createElement('div');
    bar.className = 'code-tab-buttons';

    for (const tab of tabs) {
      const name = tab.dataset.tab ?? '';
      const btn = document.createElement('button');
      btn.textContent = name;
      btn.addEventListener('click', () => {
        for (const t of tabs) t.classList.toggle('active', t === tab);
        for (const b of bar.querySelectorAll('button'))
          b.classList.toggle('active', b === btn);
      });
      bar.appendChild(btn);
    }

    container.prepend(bar);

    // Activate default tab (or first)
    const initial =
      tabs.find((t) => t.dataset.tab === defaultTab) ?? tabs[0];
    initial.classList.add('active');
    bar
      .querySelector<HTMLButtonElement>(
        `button:nth-child(${tabs.indexOf(initial) + 1})`
      )
      ?.classList.add('active');
  }
}

export default function DocDetailPage() {
  const { doc } = useData<DocDetailData>();
  const contentRef = useRef<HTMLDivElement>(null);

  if (!doc) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-forge-flame-bright mb-2">
          Page Not Found
        </h1>
        <p className="text-forge-ash mb-4">
          The requested documentation page could not be found.
        </p>
        <Link
          href="/docs"
          className="text-forge-ember-bright hover:text-forge-flame underline"
        >
          Back to Documentation
        </Link>
      </div>
    );
  }

  // Hydrate interactive elements (e.g. code tabs) after HTML is injected
  useEffect(() => {
    if (contentRef.current) hydrateCodeTabs(contentRef.current);
  }, [doc.renderedHtml]);

  return (
    <div className="flex gap-8">
      <div className="flex-1 min-w-0">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-forge-ash-dim mb-6">
          <Link href="/docs" className="hover:text-forge-smoke">
            Docs
          </Link>
          {doc.section !== 'Documentation' && doc.section !== '_toplevel' && (
            <>
              <span>/</span>
              <span className="text-forge-ash-dim">{doc.section}</span>
            </>
          )}
          <span>/</span>
          <span className="text-forge-smoke">{doc.title}</span>
        </nav>

        <h1 className="text-3xl font-bold text-forge-flame-bright font-[Cinzel] mb-6">{doc.title}</h1>

        <div
          ref={contentRef}
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: doc.renderedHtml }}
        />
      </div>

      {doc.headings.length > 0 && (
        <aside className="hidden xl:block w-56 shrink-0">
          <div className="sticky top-20">
            <TableOfContents headings={doc.headings} />
          </div>
        </aside>
      )}
    </div>
  );
}
