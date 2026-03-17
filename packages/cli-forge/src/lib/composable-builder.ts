import type { ParsedArgs } from '@cli-forge/parser';
import { CLI } from './public-api';

/**
 * Extracts the TChildren type parameter from a CLI type.
 */
export type ExtractChildren<T> = T extends CLI<any, any, infer C, any>
  ? C
  : never;

/**
 * Extracts the TArgs type parameter from a CLI type.
 */
export type ExtractArgs<T> = T extends CLI<infer A, any, any, any> ? A : never;

/**
 * Type for a composable builder function that transforms a CLI.
 * Used with `chain` to compose multiple builders.
 */
export type ComposableBuilder<
  TArgs2 extends ParsedArgs,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  TAddedChildren = {}
> = <TInit extends ParsedArgs, THandlerReturn, TChildren, TParent>(
  init: CLI<TInit, THandlerReturn, TChildren, TParent>
) => CLI<TInit & TArgs2, THandlerReturn, TChildren & TAddedChildren, TParent>;

/**
 * Creates a composable builder function that can be used with `chain`.
 * Can be used to add options, commands, or any other CLI modifications.
 * Children added by the builder function are properly tracked in the type.
 *
 * The builder function runs once at creation time against a recording Proxy.
 * Subsequent applications replay the captured operations, ensuring inline
 * middleware closures have stable references for Set-based deduplication.
 *
 * @typeParam TArgs2 - The args type after the builder runs
 * @typeParam TChildren2 - The children type added by the builder
 */
export function makeComposableBuilder<
  TArgs2 extends ParsedArgs,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  TChildren2 = {}
>(
  fn: (
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    init: CLI<ParsedArgs, any, {}, any>
  ) => CLI<TArgs2, any, TChildren2, any>
) {
  // Run builder once against a recording proxy to capture operations.
  // Replaying these ensures inline closures (e.g. middleware) keep stable
  // references across applications, enabling Set-based deduplication.
  const operations: { method: string; args: any[] }[] = [];
  const proxy = new Proxy({} as CLI, {
    get(_target, prop) {
      return (...args: any[]) => {
        operations.push({ method: prop as string, args });
        return proxy;
      };
    },
  });
  fn(proxy);

  return <TInit extends ParsedArgs, THandlerReturn, TChildren, TParent>(
    init: CLI<TInit, THandlerReturn, TChildren, TParent>
  ) => {
    let current: any = init;
    for (const op of operations) {
      current = current[op.method](...op.args);
    }
    return current as unknown as CLI<
      TInit & TArgs2,
      THandlerReturn,
      TChildren & TChildren2,
      TParent
    >;
  };
}
