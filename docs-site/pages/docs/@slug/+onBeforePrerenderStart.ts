import type { PageContextServer } from 'vike/types';

export function onBeforePrerenderStart(
  globalContext: PageContextServer['globalContext']
): string[] {
  const docs = globalContext.docs;
  return Object.keys(docs).map((slug) => `/docs/${slug}`);
}
