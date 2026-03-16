import { applyBaseUrl } from '../utils/base-url';

interface LogoProps {
  size?: number;
  className?: string;
  transparent?: boolean;
}

/**
 * Blueprint-themed logo mark rendered as an <img> referencing
 * the static SVG in /public/logo.svg (or logo-transparent.svg).
 */
export function Logo({ size = 32, className = '', transparent = false }: LogoProps) {
  const src = transparent ? '/logo-transparent.svg' : '/logo.svg';
  return (
    <img
      src={applyBaseUrl(src)}
      alt="cli-forge"
      width={size}
      height={size}
      className={className}
    />
  );
}
