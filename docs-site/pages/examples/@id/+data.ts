import type { PageContextServer } from 'vike/types';
import type { SiteExample } from '../../../server/utils/examples.js';

export type ExampleDetailData = { example: SiteExample | null };

export function data(pageContext: PageContextServer): ExampleDetailData {
  const { id } = pageContext.routeParams;
  const example = pageContext.globalContext.examples[id] ?? null;
  return { example };
}
