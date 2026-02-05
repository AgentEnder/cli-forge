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
  // eslint-disable-next-line @typescript-eslint/ban-types
  TAddedChildren = {}
> = <TInit extends ParsedArgs, THandlerReturn, TChildren, TParent>(
  init: CLI<TInit, THandlerReturn, TChildren, TParent>
) => CLI<TInit & TArgs2, THandlerReturn, TChildren & TAddedChildren, TParent>;

/**
 * Creates a composable builder function that can be used with `chain`.
 * Can be used to add options, commands, or any other CLI modifications.
 * Children added by the builder function are properly tracked in the type.
 *
 * @typeParam TArgs2 - The args type after the builder runs
 * @typeParam TChildren2 - The children type added by the builder
 */
export function makeComposableBuilder<
  TArgs2 extends ParsedArgs,
  // eslint-disable-next-line @typescript-eslint/ban-types
  TChildren2 = {}
>(
  fn: (
    // eslint-disable-next-line @typescript-eslint/ban-types
    init: CLI<ParsedArgs, any, {}, any>
  ) => CLI<TArgs2, any, TChildren2, any>
) {
  return <TInit extends ParsedArgs, THandlerReturn, TChildren, TParent>(
    init: CLI<TInit, THandlerReturn, TChildren, TParent>
  ) =>
    // eslint-disable-next-line @typescript-eslint/ban-types
    fn(init as unknown as CLI<ParsedArgs, any, {}, any>) as unknown as CLI<
      TInit & TArgs2,
      THandlerReturn,
      TChildren & TChildren2,
      TParent
    >;
}
