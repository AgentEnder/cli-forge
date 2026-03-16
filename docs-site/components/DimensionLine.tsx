import { useRef } from 'react';
import { useDrawAnimation } from '../hooks/useDrawAnimation';

interface DimensionLineProps {
  direction?: 'horizontal' | 'vertical';
  label?: string;
  length?: number;
  delay?: number;
  className?: string;
}

/**
 * SVG-based decorative annotation line with tick marks,
 * like dimension lines on engineering drawings.
 */
export function DimensionLine({
  direction = 'horizontal',
  label,
  length = 200,
  delay = 0,
  className = '',
}: DimensionLineProps) {
  const lineRef = useRef<SVGLineElement>(null);
  useDrawAnimation(lineRef, { delay, duration: 1200 });

  const isH = direction === 'horizontal';
  const tick = 6;
  const viewBox = isH
    ? `0 0 ${length} ${tick * 2 + 2}`
    : `0 0 ${tick * 2 + 2} ${length}`;
  const w = isH ? length : tick * 2 + 2;
  const h = isH ? tick * 2 + 2 : length;
  const cy = tick + 1;
  const cx = tick + 1;

  return (
    <div className={`inline-flex items-center justify-center ${className}`} aria-hidden="true">
      <svg width={w} height={h} viewBox={viewBox} className="overflow-visible">
        {isH ? (
          <>
            <line x1={0} y1={cy - tick} x2={0} y2={cy + tick} stroke="var(--color-bp-line-dim)" strokeWidth="1" />
            <line ref={lineRef} x1={0} y1={cy} x2={length} y2={cy} stroke="var(--color-bp-line-dim)" strokeWidth="0.5" />
            <line x1={length} y1={cy - tick} x2={length} y2={cy + tick} stroke="var(--color-bp-line-dim)" strokeWidth="1" />
          </>
        ) : (
          <>
            <line x1={cx - tick} y1={0} x2={cx + tick} y2={0} stroke="var(--color-bp-line-dim)" strokeWidth="1" />
            <line ref={lineRef} x1={cx} y1={0} x2={cx} y2={length} stroke="var(--color-bp-line-dim)" strokeWidth="0.5" />
            <line x1={cx - tick} y1={length} x2={cx + tick} y2={length} stroke="var(--color-bp-line-dim)" strokeWidth="1" />
          </>
        )}
        {label && (
          <text
            x={isH ? length / 2 : cx}
            y={isH ? cy - tick - 4 : length / 2}
            textAnchor="middle"
            dominantBaseline={isH ? 'auto' : 'central'}
            fill="var(--color-bp-line-dim)"
            fontSize="9"
            fontFamily="var(--font-heading)"
            letterSpacing="0.1em"
          >
            {label.toUpperCase()}
          </text>
        )}
      </svg>
    </div>
  );
}
