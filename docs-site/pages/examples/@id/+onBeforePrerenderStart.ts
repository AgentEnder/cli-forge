import type { PageContextServer } from 'vike/types';

export function onBeforePrerenderStart(
  globalContext: PageContextServer['globalContext']
): string[] {
  const examples = globalContext.examples;
  return Object.keys(examples).map((id) => `/examples/${id}`);
}
