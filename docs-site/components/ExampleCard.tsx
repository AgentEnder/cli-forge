import { Link } from './Link';
import { SpecPanel } from './SpecPanel';
import type { SiteExample } from '../server/utils/examples';

interface ExampleCardProps {
  example: SiteExample;
}

/**
 * Card component for the examples index page.
 */
export function ExampleCard({ example }: ExampleCardProps) {
  const fileCount = example.files.length;

  return (
    <Link href={`/examples/${example.id}`} className="block no-underline">
      <SpecPanel
        label="EXAMPLE"
        revision={example.extractorName}
        footer={[
          { key: 'FILES', value: String(fileCount) },
          { key: 'EXTRACTOR', value: example.extractorName },
          ...(example.tags.length > 0
            ? [{ key: 'TAGS', value: example.tags.join(', ') }]
            : []),
        ]}
        className="h-full hover:bg-bp-surface/30 transition-colors"
      >
        <h3 className="text-base font-heading text-bp-line mb-2 normal-case tracking-normal">
          {example.title}
        </h3>
        {example.description && (
          <p className="text-sm text-bp-line-dim leading-relaxed">
            {example.description}
          </p>
        )}
      </SpecPanel>
    </Link>
  );
}
