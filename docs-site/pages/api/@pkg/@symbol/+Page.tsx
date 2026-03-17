import { useApiExport } from 'vike-plugin-typedoc/client';
import { ApiExportPage } from '../../../../components/ApiExportPage';
import { Link } from '../../../../components/Link';

export default function SymbolDetail() {
  const { apiExport, packageSlug, packageName } = useApiExport();

  if (!apiExport) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-forge-flame-bright mb-4">
          Symbol Not Found
        </h1>
        <p className="text-forge-ash">
          The requested API symbol was not found.
        </p>
        <Link
          href={`/api/${packageSlug}`}
          className="inline-block mt-6 text-forge-ember-bright hover:text-forge-flame transition-colors text-sm"
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
