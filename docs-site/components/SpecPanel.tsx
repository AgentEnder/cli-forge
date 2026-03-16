import type { CSSProperties, ReactNode } from 'react';

interface SpecPanelProps {
  children: ReactNode;
  label?: string;
  revision?: string;
  footer?: Array<{ key: string; value: string }>;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

/**
 * Themed card component styled as a technical spec sheet.
 * Clean blueprint lines, no glow effects.
 */
export function SpecPanel({
  children,
  label = 'SPEC',
  revision,
  footer,
  className = '',
  style,
  onClick,
}: SpecPanelProps) {
  const interactive = !!onClick;

  return (
    <div
      className={`
        bg-bp-paper-light border border-bp-line-dim/30 rounded-sm
        transition-all duration-200
        hover:border-bp-line-dim/60 hover:-translate-y-0.5
        ${interactive ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={style}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }
          : undefined
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-bp-line-dim/20">
        <span className="bp-annotation text-bp-accent">{label}</span>
        {revision && <span className="bp-annotation">REV {revision}</span>}
      </div>

      {/* Content */}
      <div className="px-4 py-3">{children}</div>

      {/* Footer */}
      {footer && footer.length > 0 && (
        <>
          <hr className="bp-dashed-sep mx-4" />
          <div className="px-4 py-2 flex gap-4 flex-wrap">
            {footer.map(({ key, value }) => (
              <div key={key} className="bp-annotation">
                <span className="text-bp-line-dim">{key}: </span>
                <span className="text-bp-line">{value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
