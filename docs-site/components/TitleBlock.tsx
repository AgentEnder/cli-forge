interface TitleBlockProps {
  sheet?: string;
  version?: string;
  author?: string;
  className?: string;
}

/**
 * Engineering drawing title block — the info panel typically found
 * in the bottom-right corner of technical drawings.
 */
export function TitleBlock({
  sheet = 'OVERVIEW',
  version = '1.0',
  author = 'AUTO',
  className = '',
}: TitleBlockProps) {
  const date = new Date().toISOString().slice(0, 10);

  return (
    <div
      className={`border border-bp-line-dim/30 bg-bp-paper/80 font-code text-[0.625rem] uppercase leading-relaxed ${className}`}
    >
      <div className="px-3 py-1.5 border-b border-bp-line-dim/20">
        <span className="text-bp-line text-xs tracking-[0.15em]">
          CLI-FORGE
        </span>
      </div>
      <div className="px-3 py-1.5 space-y-0.5 text-bp-line-dim">
        <div className="flex justify-between">
          <span>Sheet:</span>
          <span className="text-bp-line">{sheet}</span>
        </div>
        <div className="flex gap-6 justify-between">
          <div className="flex gap-2">
            <span>Rev:</span>
            <span className="text-bp-line">{version}</span>
          </div>
          <div className="flex gap-2">
            <span>Scale:</span>
            <span className="text-bp-line">1:1</span>
          </div>
        </div>
        <div className="flex gap-6 justify-between">
          <div className="flex gap-2">
            <span>Date:</span>
            <span className="text-bp-line">{date}</span>
          </div>
          <div className="flex gap-2">
            <span>Drn:</span>
            <span className="text-bp-line">{author}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
