import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { applyBaseUrl } from '../utils/base-url';

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  active?: boolean;
}

export function Link({ children, active, href, className = '', ...props }: LinkProps) {
  return (
    <a
      href={href ? applyBaseUrl(href) : href}
      className={`transition-colors duration-200 ${active ? 'font-medium' : 'opacity-70 hover:opacity-100'} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
