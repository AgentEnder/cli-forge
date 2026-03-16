import type { ProseBlock } from '../server/utils/examples';
import { ProseCodeBlock } from './ProseCodeBlock';

interface ProseRendererProps {
  blocks: ProseBlock[];
  onNavigateToFile?: (file: string, region?: string) => void;
}

/**
 * Renders structured ProseBlock[] as alternating prose HTML and
 * interactive code blocks. Prose text stays within max-w-4xl;
 * code blocks break out to full width.
 */
export function ProseRenderer({
  blocks,
  onNavigateToFile,
}: ProseRendererProps) {
  return (
    <div>
      {blocks.map((block, i) => {
        if (block.type === 'html') {
          return (
            <div
              key={i}
              className="prose-blueprint max-w-4xl"
              dangerouslySetInnerHTML={{ __html: block.html }}
            />
          );
        }

        return (
          <ProseCodeBlock
            key={i}
            file={block.file}
            region={block.region}
            regionLabel={block.regionLabel}
            language={block.language}
            code={block.code}
            highlightedHtml={block.highlightedHtml}
            startLine={block.startLine}
            endLine={block.endLine}
            onNavigate={onNavigateToFile}
          />
        );
      })}
    </div>
  );
}
