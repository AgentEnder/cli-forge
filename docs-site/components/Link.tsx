import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { applyBaseUrl } from '../utils/base-url';

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  active?: boolean;
}

/**
 * Navigation link that automatically prepends the site base URL.
 * Uses standard <a> tags — Vike handles client-side navigation
 * via its built-in link interceptor.
 */
export function Link({
  children,
  active,
  href,
  className = '',
  ...props
}: LinkProps) {
  return (
    <a
      href={href ? applyBaseUrl(href) : href}
      className={`
        transition-colors duration-200
        ${active ? 'text-bp-line font-medium' : 'text-bp-line/70 hover:text-bp-line'}
        ${className}
      `}
      {...props}
    >
      {children}
    </a>
  );
}
