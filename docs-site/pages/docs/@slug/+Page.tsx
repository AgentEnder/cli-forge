import { useData } from 'vike-react/useData';
import { Link } from '../../../components/Link';
import { TableOfContents } from '../../../components/TableOfContents';
import type { DocDetailData } from './+data';

export default function DocDetailPage() {
  const { doc } = useData<DocDetailData>();

  if (!doc) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">
          Page Not Found
        </h1>
        <p className="text-gray-400 mb-4">
          The requested documentation page could not be found.
        </p>
        <Link
          href="/docs"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          Back to Documentation
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      <div className="flex-1 min-w-0">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <Link href="/docs" className="hover:text-gray-300">
            Docs
          </Link>
          {doc.section !== 'Documentation' && doc.section !== '_toplevel' && (
            <>
              <span>/</span>
              <span className="text-gray-500">{doc.section}</span>
            </>
          )}
          <span>/</span>
          <span className="text-gray-300">{doc.title}</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-100 mb-6">{doc.title}</h1>

        <div
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
