import { useApiExport } from 'vike-plugin-typedoc/client';
import { ApiExportPage } from '../../../../components/ApiExportPage';
import { Link } from '../../../../components/Link';

export default function SymbolDetail() {
  const { apiExport, packageSlug, packageName } = useApiExport();

  if (!apiExport) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-100 mb-4">
          Symbol Not Found
        </h1>
        <p className="text-gray-400">
          The requested API symbol was not found.
        </p>
        <Link
          href={`/api/${packageSlug}`}
          className="inline-block mt-6 text-blue-400 hover:text-blue-300 transition-colors text-sm"
        >
          &larr; Back to {packageName}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ApiExportPage
        apiExport={apiExport}
        packagePath={`/api/${packageSlug}`}
        packageName={packageName}
      />
    </div>
  );
}
