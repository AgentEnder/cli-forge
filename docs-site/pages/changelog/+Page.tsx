import { useData } from 'vike-react/useData';
import { Link } from '../../components/Link';
import { TableOfContents } from '../../components/TableOfContents';
import type { ChangelogData } from './+data';

export default function ChangelogPage() {
  const { doc } = useData<ChangelogData>();

  if (!doc) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-forge-flame-bright mb-2">
          Changelog Not Found
        </h1>
        <p className="text-forge-ash mb-4">
          The changelog could not be loaded.
        </p>
        <Link
          href="/"
          className="text-forge-ember-bright hover:text-forge-flame underline"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      <div className="flex-1 min-w-0">
        <h1 className="text-3xl font-bold text-forge-flame-bright font-[Cinzel] mb-6">
          {doc.title}
        </h1>

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
