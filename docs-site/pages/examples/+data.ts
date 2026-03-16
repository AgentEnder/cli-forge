import type { PageContextServer } from 'vike/types';
import type { SiteExample } from '../../server/utils/examples.js';

export type ExamplesData = { examples: SiteExample[] };

export function data(pageContext: PageContextServer): ExamplesData {
  const examples = Object.values(pageContext.globalContext.examples);
  return { examples };
}
