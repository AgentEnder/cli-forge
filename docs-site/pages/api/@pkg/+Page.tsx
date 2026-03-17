import { useApiPackage } from 'vike-plugin-typedoc/client';
import { useData } from 'vike-react/useData';
import { ApiPackageLanding } from '../../../components/ApiPackageLanding';
import { Link } from '../../../components/Link';
import { TableOfContents } from '../../../components/TableOfContents';
import type { PageData } from './+data.server';

export default function PackageDetailPage() {
  const { pkg } = useData<PageData>();
  const { apiPackage } = useApiPackage();

  if (!pkg) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-forge-flame-bright mb-2">
          Package Not Found
        </h1>
        <p className="text-forge-ash mb-4">
          The requested package could not be found.
        </p>
        <Link
          href="/api"
          className="text-forge-ember-bright hover:text-forge-flame underline"
        >
          Back to API Reference
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      <div className="flex-1 min-w-0">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-forge-ash-dim mb-6">
          <Link href="/api" className="hover:text-forge-smoke">
            API
          </Link>
          <span>/</span>
          <span className="text-forge-smoke">{pkg.npmName}</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-forge-flame-bright font-[Cinzel] font-mono">
              {pkg.npmName}
            </h1>
            {pkg.description && (
              <p className="text-forge-ash mt-1">{pkg.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-forge-ash-dim">
            <span className="font-mono">v{pkg.version}</span>
            <a
              href={pkg.npmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-forge-ember-bright hover:text-forge-flame underline"
            >
              npm
            </a>
            <a
              href={pkg.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-forge-ember-bright hover:text-forge-flame underline"
            >
              GitHub
            </a>
          </div>
        </div>

        {/* Install command */}
        <div className="inline-block bg-forge-bg-surface/50 border border-forge-iron-light rounded px-3 py-1.5 mb-6">
          <code className="text-sm text-forge-smoke font-mono">
            npm install {pkg.npmName}
          </code>
        </div>

        {pkg.renderedHtml ? (
          <div
            className="prose-content max-w-4xl"
            dangerouslySetInnerHTML={{ __html: pkg.renderedHtml }}
          />
        ) : (
          <p className="text-forge-ash-dim">No README available for this package.</p>
        )}

        {/* API Exports from TypeDoc */}
        {apiPackage && apiPackage.exports.length > 0 && (
          <ApiPackageLanding apiPackage={apiPackage} />
        )}
      </div>

      {pkg.headings.length > 0 && (
        <aside className="hidden xl:block w-56 shrink-0">
          <div className="sticky top-20">
            <TableOfContents headings={pkg.headings} />
          </div>
        </aside>
      )}
    </div>
  );
}
