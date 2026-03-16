import type { PageContextServer } from 'vike/types';
import type { DocPage } from '../../../server/utils/docs.js';

export type DocDetailData = { doc: DocPage | null };

export function data(pageContext: PageContextServer): DocDetailData {
  const slug = pageContext.routeParams['*'] ?? '';
  const doc = pageContext.globalContext.docs[slug] ?? null;
  return { doc };
}
