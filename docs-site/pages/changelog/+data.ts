import type { PageContextServer } from 'vike/types';
import type { DocPage } from '../../server/utils/docs.js';

export type ChangelogData = { doc: DocPage | null };

export function data(pageContext: PageContextServer): ChangelogData {
  const doc = pageContext.globalContext.docs['changelog'] ?? null;
  return { doc };
}
