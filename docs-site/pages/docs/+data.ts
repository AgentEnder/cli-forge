import type { PageContextServer } from 'vike/types';
import type { DocPage } from '../../server/utils/docs.js';

export type DocsData = { docs: DocPage[] };

export function data(pageContext: PageContextServer): DocsData {
  const docsMap = pageContext.globalContext.docs;
  const docs = Object.values(docsMap).sort((a, b) => a.order - b.order);
  return { docs };
}
