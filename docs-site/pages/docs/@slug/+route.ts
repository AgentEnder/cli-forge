import type { PageContext } from 'vike/types';

export function route(pageContext: PageContext) {
  if (!pageContext.urlPathname.startsWith('/docs/')) return false;
  const splat = pageContext.urlPathname.slice('/docs/'.length);
  if (!splat) return false;
  return { routeParams: { '*': splat } };
}
