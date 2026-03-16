import type { ReactNode } from 'react';

interface BlueprintFrameProps {
  children: ReactNode;
  title?: string;
  className?: string;
  showTitleBlock?: boolean;
}

/**
 * Decorative border frame with corner registration marks,
 * mimicking engineering drawing sheets.
 */
export function BlueprintFrame({
  children,
  title,
  className = '',
  showTitleBlock = false,
}: BlueprintFrameProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Corner registration marks — outside overflow-hidden so they aren't clipped */}
      <CornerMark position="top-left" />
      <CornerMark position="top-right" />
      <CornerMark position="bottom-left" />
      <CornerMark position="bottom-right" />

      <div className="border border-bp-line-dim/60 rounded-sm relative bg-[rgba(18,42,72,0.85)] overflow-hidden">
        {title && (
          <div className="flex items-center px-3 py-1.5 bg-bp-paper-light/60 border-b border-bp-line-dim/20">
            <span className="bp-annotation">{title}</span>
          </div>
        )}

        <div className="p-6">
          {children}
        </div>

        {showTitleBlock && (
          <div className="absolute -bottom-px -right-px">
            <TitleBlockInline />
          </div>
        )}
      </div>
    </div>
  );
}

export function CornerMark({
  position,
  size = 18,
  className = 'text-bp-line-dim',
}: {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: number;
  className?: string;
}) {
  const half = size / 2;
  const style: React.CSSProperties = {
    ...(position.includes('top') ? { top: -half } : { bottom: -half }),
    ...(position.includes('left') ? { left: -half } : { right: -half }),
  };

  return (
    <div
      className="absolute pointer-events-none"
      style={style}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
        <line x1={half} y1={0} x2={half} y2={size} stroke="currentColor" strokeWidth="1" />
        <line x1={0} y1={half} x2={size} y2={half} stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}

function TitleBlockInline() {
  const date = new Date().toISOString().slice(0, 10);
  return (
    <div className="border border-bp-line-dim/30 bg-bp-paper px-3 py-1.5 text-[0.5rem] font-code text-bp-line-dim uppercase leading-relaxed">
      <div className="text-bp-line text-[0.5625rem] tracking-wider">
        CLI-FORGE
      </div>
      <div className="w-full h-px bg-bp-line-dim/20 my-0.5" />
      <div className="flex gap-4">
        <span>Rev: 1.0</span>
        <span>Scale: 1:1</span>
      </div>
      <div className="flex gap-4">
        <span>Date: {date}</span>
      </div>
    </div>
  );
}
