import { useData } from 'vike-react/useData';
import { FileExplorer } from '../../../components/FileExplorer';
import { Link } from '../../../components/Link';
import type { ExampleDetailData } from './+data';

export default function ExampleDetailPage() {
  const { example } = useData<ExampleDetailData>();

  if (!example) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">
          Example Not Found
        </h1>
        <p className="text-gray-400 mb-4">
          The requested example could not be found.
        </p>
        <Link
          href="/examples"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          Back to Examples
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <Link href="/examples" className="hover:text-gray-300">
          Examples
        </Link>
        <span>/</span>
        <span className="text-gray-300">{example.title}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-100 mb-3">
        {example.title}
      </h1>

      {example.description && (
        <p className="text-gray-400 mb-2 max-w-3xl">{example.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-6">
        <span>{example.files.length} files</span>
        {example.tags.length > 0 && (
          <span className="flex gap-1">
            {example.tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400"
              >
                {tag}
              </span>
            ))}
          </span>
        )}
      </div>

      <FileExplorer files={example.files} />
    </div>
  );
}
