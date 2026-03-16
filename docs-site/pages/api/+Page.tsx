import { useData } from 'vike-react/useData';
import { Link } from '../../components/Link';
import type { ApiData } from './+data.server';

export default function ApiPage() {
  const { packages } = useData<ApiData>();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-3">API Reference</h1>
      <p className="text-gray-400 mb-8 max-w-2xl">
        Browse the packages that make up CLI Forge.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packages.map((pkg) => (
          <Link
            key={pkg.dirName}
            href={`/api/${pkg.dirName}`}
            className="block no-underline"
          >
            <div className="border border-gray-700 rounded p-5 hover:bg-gray-800/50 transition-colors h-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-mono text-gray-200">
                  {pkg.npmName}
                </h3>
                <span className="text-xs text-gray-500 font-mono">
                  v{pkg.version}
                </span>
              </div>
              {pkg.description && (
                <p className="text-sm text-gray-400 leading-relaxed">
                  {pkg.description}
                </p>
              )}
              <div className="mt-3 text-xs text-gray-500">
                <span>npm: {pkg.npmName}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {packages.length === 0 && (
        <p className="text-gray-500 text-center py-12">
          No packages found.
        </p>
      )}
    </div>
  );
}
