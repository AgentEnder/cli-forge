import { withApiExport } from 'vike-plugin-typedoc/server';
import type { PageContextServer } from 'vike/types';

export type SymbolDetailData = ReturnType<typeof data>;

export function data(pageContext: PageContextServer) {
  const { pkg: packageSlug, symbol: symbolSlug } = pageContext.routeParams;
  return withApiExport(pageContext, packageSlug, symbolSlug);
}
