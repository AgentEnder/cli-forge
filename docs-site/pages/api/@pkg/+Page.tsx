import { useData } from 'vike-react/useData';
import { Link } from '../../../components/Link';
import type { PageData } from './+data.server';

export default function PackageDetailPage() {
  const { pkg } = useData<PageData>();

  if (!pkg) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">
          Package Not Found
        </h1>
        <p className="text-gray-400 mb-4">
          The requested package could not be found.
        </p>
        <Link
          href="/api"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          Back to API Reference
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <Link href="/api" className="hover:text-gray-300">
          API
        </Link>
        <span>/</span>
        <span className="text-gray-300">{pkg.npmName}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 font-mono">
            {pkg.npmName}
          </h1>
          {pkg.description && (
            <p className="text-gray-400 mt-1">{pkg.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="font-mono">v{pkg.version}</span>
          <a
            href={pkg.npmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            npm
          </a>
          <a
            href={pkg.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            GitHub
          </a>
        </div>
      </div>

      {pkg.renderedHtml ? (
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: pkg.renderedHtml }}
        />
      ) : (
        <p className="text-gray-500">No README available for this package.</p>
      )}
    </div>
  );
}
