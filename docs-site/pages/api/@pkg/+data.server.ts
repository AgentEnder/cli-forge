import type { PageContextServer } from 'vike/types';

export function data(pageContext: PageContextServer) {
  const { pkg: dirName } = pageContext.routeParams;
  const pkg = pageContext.globalContext.packages[dirName] ?? null;
  return { pkg };
}

export type PageData = ReturnType<typeof data>;
