import { useEffect, type RefObject } from 'react';

interface DrawAnimationOptions {
  delay?: number;
  duration?: number;
  /** Only animate when element enters viewport */
  onIntersect?: boolean;
}

/**
 * Animates an SVG element's stroke-dashoffset from full to 0,
 * creating a "drawing" entrance effect.
 *
 * The SVG element must have a measurable stroke (e.g., <path>, <line>).
 */
export function useDrawAnimation(
  ref: RefObject<SVGElement | null>,
  options: DrawAnimationOptions = {}
) {
  const { delay = 0, duration = 1500, onIntersect = true } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) {
      el.style.strokeDashoffset = '0';
      return;
    }

    // Calculate total path length
    let length: number;
    if ('getTotalLength' in el && typeof el.getTotalLength === 'function') {
      length = (el as SVGGeometryElement).getTotalLength();
    } else {
      // Fallback for non-geometry elements (line, etc.)
      length = 1000;
    }

    // Set initial state (fully hidden)
    el.style.strokeDasharray = `${length}`;
    el.style.strokeDashoffset = `${length}`;

    const animate = () => {
      setTimeout(() => {
        el.style.transition = `stroke-dashoffset ${duration}ms ease`;
        el.style.strokeDashoffset = '0';
      }, delay);
    };

    if (onIntersect) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              animate();
              observer.disconnect();
            }
          }
        },
        { threshold: 0.2 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    } else {
      animate();
    }
  }, [ref, delay, duration, onIntersect]);
}
