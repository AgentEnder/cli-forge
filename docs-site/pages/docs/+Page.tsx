import { useData } from 'vike-react/useData';
import { Link } from '../../components/Link';
import type { DocsData } from './+data';

export default function DocsPage() {
  const { docs } = useData<DocsData>();

  const sections = new Map<string, typeof docs>();
  for (const doc of docs) {
    if (!sections.has(doc.section)) {
      sections.set(doc.section, []);
    }
    sections.get(doc.section)!.push(doc);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-3">Documentation</h1>
      <p className="text-gray-400 mb-8 max-w-2xl">
        Guides, references, and tutorials for CLI Forge.
      </p>

      <div className="space-y-8">
        {Array.from(sections.entries()).map(([section, sectionDocs]) => (
          <div key={section}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              {section}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sectionDocs.map((doc) => (
                <Link
                  key={doc.slug}
                  href={`/docs/${doc.slug}`}
                  className="block no-underline"
                >
                  <div className="border border-gray-700 rounded p-4 hover:bg-gray-800/50 transition-colors h-full">
                    <h3 className="text-base font-semibold text-gray-200 mb-1">
                      {doc.title}
                    </h3>
                    {doc.description && (
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {doc.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
