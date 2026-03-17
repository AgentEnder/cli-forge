import type { SiteExample } from '../server/utils/examples';
import { Link } from './Link';

interface ExampleCardProps {
  example: SiteExample;
}

export function ExampleCard({ example }: ExampleCardProps) {
  return (
    <Link href={`/examples/${example.id}`} className="block no-underline">
      <div className="border border-forge-iron-light rounded p-4 hover:bg-forge-bg-surface/50 transition-colors h-full">
        <h3 className="text-base font-semibold mb-2">{example.title}</h3>
        {example.description && (
          <p className="text-sm text-forge-ash leading-relaxed line-clamp-3">{example.description}</p>
        )}
        <div className="flex gap-2 mt-3 text-xs text-forge-ash-dim">
          <span>{example.files.length} files</span>
          {example.tags.length > 0 && <span>· {example.tags.join(', ')}</span>}
        </div>
      </div>
    </Link>
  );
}
