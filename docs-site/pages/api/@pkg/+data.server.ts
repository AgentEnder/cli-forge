import { withApiPackage } from 'vike-plugin-typedoc/server';
import type { PageContextServer } from 'vike/types';

export function data(pageContext: PageContextServer) {
  const { pkg: dirName } = pageContext.routeParams;
  const pkg = pageContext.globalContext.packages[dirName] ?? null;
  return { pkg, ...withApiPackage(pageContext, dirName) };
}

export type PageData = ReturnType<typeof data>;
