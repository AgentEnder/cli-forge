import { useData } from 'vike-react/useData';
import { Link } from '../../components/Link';
import type { DocsData } from './+data';

export default function DocsPage() {
  const { docs } = useData<DocsData>();

  const toplevel = docs.filter((d) => d.section === '_toplevel');
  const sections = new Map<string, typeof docs>();
  for (const doc of docs) {
    if (doc.section === '_toplevel') continue;
    if (!sections.has(doc.section)) {
      sections.set(doc.section, []);
    }
    sections.get(doc.section)!.push(doc);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-forge-flame-bright mb-3 font-[Cinzel]">Documentation</h1>
      <p className="text-forge-ash mb-8 max-w-2xl">
        Guides, references, and tutorials for CLI Forge.
      </p>

      {/* Top-level pages (Home, Changelog) */}
      {toplevel.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          {toplevel.map((doc) => (
            <Link key={doc.slug} href={`/docs/${doc.slug}`} className="block no-underline">
              <div className="border border-forge-iron-light rounded p-4 hover:bg-forge-bg-surface/50 transition-colors h-full">
                <h3 className="text-base font-semibold text-forge-flame-bright mb-1">{doc.title}</h3>
                {doc.description && (
                  <p className="text-sm text-forge-ash leading-relaxed">{doc.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="space-y-8">
        {Array.from(sections.entries()).map(([section, sectionDocs]) => (
          <div key={section}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-forge-ash-dim mb-3">
              {section}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sectionDocs.map((doc) => (
                <Link
                  key={doc.slug}
                  href={`/docs/${doc.slug}`}
                  className="block no-underline"
                >
                  <div className="border border-forge-iron-light rounded p-4 hover:bg-forge-bg-surface/50 transition-colors h-full">
                    <h3 className="text-base font-semibold text-forge-flame-bright mb-1">
                      {doc.title}
                    </h3>
                    {doc.description && (
                      <p className="text-sm text-forge-ash leading-relaxed">
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
