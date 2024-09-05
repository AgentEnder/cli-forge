// This file pains me quite a bit. Before any feedback is given, consider the following:
// - There is currently no way to infer the types of a `...rest` parameter individually.
// - This is how rxjs does it, and that's because its really the only way in current TS / JS
//   - See: https://github.com/ReactiveX/rxjs/blob/master/packages%2Fobservable%2Fsrc%2Fobservable.ts#L788
// - This isn't maintained or even written by hand, aside from the final implementation. The various
//   overload signatures are copilot generated.

import { OptionConfig } from '../option-types';
import { ArgvParser, ParsedArgs } from '../parser';

type UnaryFunction<T, R> = (arg: T) => R;

/**
 * Applies a series of functions to an initial value, passing the result of each function to the next.
 *
 * Used to convert code that looks like:
 * ```typescript
 * const a = addB(addC({ a: 'a' }));
 * ```
 * to:
 * ```typescript
 * const a = chain({ a: 'a' }, addB, addC);
 * ```
 *
 * See [composable-options](/examples/composable-options) for an example of how this can be used.
 *
 * @param initial Initial value to pass through the chain
 * @param fns Functions to apply to the initial value, and each subsequent value
 * @returns Updated value after all functions have been applied
 * @hidden docs for {@link chain} are found on the main signature.
 */
export function chain<T0, R>(initial: T0, fn0: UnaryFunction<T0, R>): R;

/**
 * Applies a series of functions to an initial value, passing the result of each function to the next.
 *
 * Used to convert code that looks like:
 * ```typescript
 * const a = addB(addC({ a: 'a' }));
 * ```
 * to:
 * ```typescript
 * const a = chain({ a: 'a' }, addB, addC);
 * ```
 *
 * See [composable-options](/examples/composable-options) for an example of how this can be used.
 *
 * @param initial Initial value to pass through the chain
 * @param fns Functions to apply to the initial value, and each subsequent value
 * @returns Updated value after all functions have been applied
 * @hidden docs for {@link chain} are found on the main signature.
 */
export function chain<T0, T1, R>(
  initial: T0,
  fn0: UnaryFunction<T0, T1>,
  fn1: UnaryFunction<T1, R>
): R;

/**
 * Applies a series of functions to an initial value, passing the result of each function to the next.
 *
 * Used to convert code that looks like:
 * ```typescript
 * const a = addB(addC({ a: 'a' }));
 * ```
 * to:
 * ```typescript
 * const a = chain({ a: 'a' }, addB, addC);
 * ```
 *
 * See [composable-options](/examples/composable-options) for an example of how this can be used.
 *
 * @param initial Initial value to pass through the chain
 * @param fns Functions to apply to the initial value, and each subsequent value
 * @returns Updated value after all functions have been applied
 * @hidden docs for {@link chain} are found on the main signature.
 */
export function chain<T0, T1, T2, R>(
  initial: T0,
  fn0: UnaryFunction<T0, T1>,
  fn1: UnaryFunction<T1, T2>,
  fn2: UnaryFunction<T2, R>
): R;

/**
 * Applies a series of functions to an initial value, passing the result of each function to the next.
 *
 * Used to convert code that looks like:
 * ```typescript
 * const a = addB(addC({ a: 'a' }));
 * ```
 * to:
 * ```typescript
 * const a = chain({ a: 'a' }, addB, addC);
 * ```
 *
 * See [composable-options](/examples/composable-options) for an example of how this can be used.
 *
 * @param initial Initial value to pass through the chain
 * @param fns Functions to apply to the initial value, and each subsequent value
 * @returns Updated value after all functions have been applied
 * @hidden docs for {@link chain} are found on the main signature.
 */
export function chain<T0, T1, T2, T3, R>(
  initial: T0,
  fn0: UnaryFunction<T0, T1>,
  fn1: UnaryFunction<T1, T2>,
  fn2: UnaryFunction<T2, T3>,
  fn3: UnaryFunction<T3, R>
): R;

/**
 * Applies a series of functions to an initial value, passing the result of each function to the next.
 *
 * Used to convert code that looks like:
 * ```typescript
 * const a = addB(addC({ a: 'a' }));
 * ```
 * to:
 * ```typescript
 * const a = chain({ a: 'a' }, addB, addC);
 * ```
 *
 * See [composable-options](/examples/composable-options) for an example of how this can be used.
 *
 * @param initial Initial value to pass through the chain
 * @param fns Functions to apply to the initial value, and each subsequent value
 * @returns Updated value after all functions have been applied
 * @hidden docs for {@link chain} are found on the main signature.
 */
export function chain<T0, T1, T2, T3, T4, R>(
  initial: T0,
  fn0: UnaryFunction<T0, T1>,
  fn1: UnaryFunction<T1, T2>,
  fn2: UnaryFunction<T2, T3>,
  fn3: UnaryFunction<T3, T4>,
  fn4: UnaryFunction<T4, R>
): R;

/**
 * Applies a series of functions to an initial value, passing the result of each function to the next.
 *
 * Used to convert code that looks like:
 * ```typescript
 * const a = addB(addC({ a: 'a' }));
 * ```
 * to:
 * ```typescript
 * const a = chain({ a: 'a' }, addB, addC);
 * ```
 *
 * See [composable-options](/examples/composable-options) for an example of how this can be used.
 *
 * @param initial Initial value to pass through the chain
 * @param fns Functions to apply to the initial value, and each subsequent value
 * @returns Updated value after all functions have been applied
 * @hidden docs for {@link chain} are found on the main signature.
 */
export function chain<T0, T1, T2, T3, T4, T5, R>(
  initial: T0,
  fn0: UnaryFunction<T0, T1>,
  fn1: UnaryFunction<T1, T2>,
  fn2: UnaryFunction<T2, T3>,
  fn3: UnaryFunction<T3, T4>,
  fn4: UnaryFunction<T4, T5>,
  fn5: UnaryFunction<T5, R>
): R;

/**
 * Applies a series of functions to an initial value, passing the result of each function to the next.
 *
 * Used to convert code that looks like:
 * ```typescript
 * const a = addB(addC({ a: 'a' }));
 * ```
 * to:
 * ```typescript
 * const a = chain({ a: 'a' }, addB, addC);
 * ```
 *
 * See [composable-options](/examples/composable-options) for an example of how this can be used.
 *
 * @param initial Initial value to pass through the chain
 * @param fns Functions to apply to the initial value, and each subsequent value
 * @returns Updated value after all functions have been applied
 * @hidden docs for {@link chain} are found on the main signature.
 */
export function chain<T0, T1, T2, T3, T4, T5, T6, R>(
  initial: T0,
  fn0: UnaryFunction<T0, T1>,
  fn1: UnaryFunction<T1, T2>,
  fn2: UnaryFunction<T2, T3>,
  fn3: UnaryFunction<T3, T4>,
  fn4: UnaryFunction<T4, T5>,
  fn5: UnaryFunction<T5, T6>,
  fn6: UnaryFunction<T6, R>
): R;

/**
 * Applies a series of functions to an initial value, passing the result of each function to the next.
 *
 * Used to convert code that looks like:
 * ```typescript
 * const a = addB(addC({ a: 'a' }));
 * ```
 * to:
 * ```typescript
 * const a = chain({ a: 'a' }, addB, addC);
 * ```
 *
 * See [composable-options](/examples/composable-options) for an example of how this can be used.
 *
 * @param initial Initial value to pass through the chain
 * @param fns Functions to apply to the initial value, and each subsequent value
 * @returns Updated value after all functions have been applied
 * @hidden docs for {@link chain} are found on the main signature.
 */
export function chain<T0, T1, T2, T3, T4, T5, T6, T7, R>(
  initial: T0,
  fn0: UnaryFunction<T0, T1>,
  fn1: UnaryFunction<T1, T2>,
  fn2: UnaryFunction<T2, T3>,
  fn3: UnaryFunction<T3, T4>,
  fn4: UnaryFunction<T4, T5>,
  fn5: UnaryFunction<T5, T6>,
  fn6: UnaryFunction<T6, T7>,
  fn7: UnaryFunction<T7, R>
): R;

/**
 * Applies a series of functions to an initial value, passing the result of each function to the next.
 *
 * Used to convert code that looks like:
 * ```typescript
 * const a = addB(addC({ a: 'a' }));
 * ```
 * to:
 * ```typescript
 * const a = chain({ a: 'a' }, addB, addC);
 * ```
 *
 * See [composable-options](/examples/composable-options) for an example of how this can be used.
 *
 * @param initial Initial value to pass through the chain
 * @param fns Functions to apply to the initial value, and each subsequent value
 * @returns Updated value after all functions have been applied
 * @hidden docs for {@link chain} are found on the main signature.
 */
export function chain<T0, T1, T2, T3, T4, T5, T6, T7, T8, R>(
  initial: T0,
  fn0: UnaryFunction<T0, T1>,
  fn1: UnaryFunction<T1, T2>,
  fn2: UnaryFunction<T2, T3>,
  fn3: UnaryFunction<T3, T4>,
  fn4: UnaryFunction<T4, T5>,
  fn5: UnaryFunction<T5, T6>,
  fn6: UnaryFunction<T6, T7>,
  fn7: UnaryFunction<T7, T8>,
  fn8: UnaryFunction<T8, R>
): R;

/**
 * Applies a series of functions to an initial value, passing the result of each function to the next.
 *
 * Used to convert code that looks like:
 * ```typescript
 * const a = addB(addC({ a: 'a' }));
 * ```
 * to:
 * ```typescript
 * const a = chain({ a: 'a' }, addB, addC);
 * ```
 *
 * See [composable-options](/examples/composable-options) for an example of how this can be used.
 *
 * @param initial Initial value to pass through the chain
 * @param fns Functions to apply to the initial value, and each subsequent value
 * @returns Updated value after all functions have been applied
 * @hidden docs for {@link chain} are found on the main signature.
 */
export function chain<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9, R>(
  initial: T0,
  fn0: UnaryFunction<T0, T1>,
  fn1: UnaryFunction<T1, T2>,
  fn2: UnaryFunction<T2, T3>,
  fn3: UnaryFunction<T3, T4>,
  fn4: UnaryFunction<T4, T5>,
  fn5: UnaryFunction<T5, T6>,
  fn6: UnaryFunction<T6, T7>,
  fn7: UnaryFunction<T7, T8>,
  fn8: UnaryFunction<T8, T9>,
  fn9: UnaryFunction<T9, R>
): R;

/**
 * Applies a series of functions to an initial value, passing the result of each function to the next.
 *
 * Used to convert code that looks like:
 * ```typescript
 * const a = addB(addC({ a: 'a' }));
 * ```
 * to:
 * ```typescript
 * const a = chain({ a: 'a' }, addB, addC);
 * ```
 *
 * See [composable-options](/examples/composable-options) for an example of how this can be used.
 *
 * @param initial Initial value to pass through the chain
 * @param fns Functions to apply to the initial value, and each subsequent value
 * @returns Updated value after all functions have been applied
 * @hidden docs for {@link chain} are found on the main signature.
 */
export function chain<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, R>(
  initial: T0,
  fn0: UnaryFunction<T0, T1>,
  fn1: UnaryFunction<T1, T2>,
  fn2: UnaryFunction<T2, T3>,
  fn3: UnaryFunction<T3, T4>,
  fn4: UnaryFunction<T4, T5>,
  fn5: UnaryFunction<T5, T6>,
  fn6: UnaryFunction<T6, T7>,
  fn7: UnaryFunction<T7, T8>,
  fn8: UnaryFunction<T8, T9>,
  fn9: UnaryFunction<T9, T10>,
  fn10: UnaryFunction<T10, R>
): R;

/**
 * Applies a series of functions to an initial value, passing the result of each function to the next.
 *
 * Used to convert code that looks like:
 * ```typescript
 * const a = addB(addC({ a: 'a' }));
 * ```
 * to:
 * ```typescript
 * const a = chain({ a: 'a' }, addB, addC);
 * ```
 *
 * See [composable-options](/examples/composable-options) for an example of how this can be used.
 *
 * @param initial Initial value to pass through the chain
 * @param fns Functions to apply to the initial value, and each subsequent value
 * @returns Updated value after all functions have been applied
 * @hidden docs for {@link chain} are found on the main signature.
 */
export function chain<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, R>(
  initial: T0,
  fn0: UnaryFunction<T0, T1>,
  fn1: UnaryFunction<T1, T2>,
  fn2: UnaryFunction<T2, T3>,
  fn3: UnaryFunction<T3, T4>,
  fn4: UnaryFunction<T4, T5>,
  fn5: UnaryFunction<T5, T6>,
  fn6: UnaryFunction<T6, T7>,
  fn7: UnaryFunction<T7, T8>,
  fn8: UnaryFunction<T8, T9>,
  fn9: UnaryFunction<T9, T10>,
  fn10: UnaryFunction<T10, T11>,
  fn11: UnaryFunction<T11, R>
): R;

/**
 * Applies a series of functions to an initial value, passing the result of each function to the next.
 *
 * Used to convert code that looks like:
 * ```typescript
 * const a = addB(addC({ a: 'a' }));
 * ```
 * to:
 * ```typescript
 * const a = chain({ a: 'a' }, addB, addC);
 * ```
 *
 * See [composable-options](/examples/composable-options) for an example of how this can be used.
 *
 * @param initial Initial value to pass through the chain
 * @param fns Functions to apply to the initial value, and each subsequent value
 * @returns Updated value after all functions have been applied
 * @hidden docs for {@link chain} are found on the main signature.
 */
export function chain<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, R>(
  initial: T0,
  fn0: UnaryFunction<T0, T1>,
  fn1: UnaryFunction<T1, T2>,
  fn2: UnaryFunction<T2, T3>,
  fn3: UnaryFunction<T3, T4>,
  fn4: UnaryFunction<T4, T5>,
  fn5: UnaryFunction<T5, T6>,
  fn6: UnaryFunction<T6, T7>,
  fn7: UnaryFunction<T7, T8>,
  fn8: UnaryFunction<T8, T9>,
  fn9: UnaryFunction<T9, T10>,
  fn10: UnaryFunction<T10, T11>,
  fn11: UnaryFunction<T11, T12>,
  fn12: UnaryFunction<T12, R>
): R;

/**
 * Applies a series of functions to an initial value, passing the result of each function to the next.
 *
 * Used to convert code that looks like:
 * ```typescript
 * const a = addB(addC({ a: 'a' }));
 * ```
 * to:
 * ```typescript
 * const a = chain({ a: 'a' }, addB, addC);
 * ```
 *
 * See [composable-options](/examples/composable-options) for an example of how this can be used.
 *
 * @param initial Initial value to pass through the chain
 * @param fns Functions to apply to the initial value, and each subsequent value
 * @returns Updated value after all functions have been applied
 * @hidden docs for {@link chain} are found on the main signature.
 */
export function chain<
  T0,
  T1,
  T2,
  T3,
  T4,
  T5,
  T6,
  T7,
  T8,
  T9,
  T10,
  T11,
  T12,
  T13,
  R
>(
  initial: T0,
  fn0: UnaryFunction<T0, T1>,
  fn1: UnaryFunction<T1, T2>,
  fn2: UnaryFunction<T2, T3>,
  fn3: UnaryFunction<T3, T4>,
  fn4: UnaryFunction<T4, T5>,
  fn5: UnaryFunction<T5, T6>,
  fn6: UnaryFunction<T6, T7>,
  fn7: UnaryFunction<T7, T8>,
  fn8: UnaryFunction<T8, T9>,
  fn9: UnaryFunction<T9, T10>,
  fn10: UnaryFunction<T10, T11>,
  fn11: UnaryFunction<T11, T12>,
  fn12: UnaryFunction<T12, T13>,
  fn13: UnaryFunction<T13, R>
): R;

/**
 * Applies a series of functions to an initial value, passing the result of each function to the next.
 *
 * Used to convert code that looks like:
 * ```typescript
 * const a = addB(addC({ a: 'a' }));
 * ```
 * to:
 * ```typescript
 * const a = chain({ a: 'a' }, addB, addC);
 * ```
 *
 * See [composable-options](/examples/composable-options) for an example of how this can be used.
 *
 * @param initial Initial value to pass through the chain
 * @param fns Functions to apply to the initial value, and each subsequent value
 * @returns Updated value after all functions have been applied
 * @hidden docs for {@link chain} are found on the main signature.
 */
export function chain<
  T0,
  T1,
  T2,
  T3,
  T4,
  T5,
  T6,
  T7,
  T8,
  T9,
  T10,
  T11,
  T12,
  T13,
  T14,
  R
>(
  initial: T0,
  fn0: UnaryFunction<T0, T1>,
  fn1: UnaryFunction<T1, T2>,
  fn2: UnaryFunction<T2, T3>,
  fn3: UnaryFunction<T3, T4>,
  fn4: UnaryFunction<T4, T5>,
  fn5: UnaryFunction<T5, T6>,
  fn6: UnaryFunction<T6, T7>,
  fn7: UnaryFunction<T7, T8>,
  fn8: UnaryFunction<T8, T9>,
  fn9: UnaryFunction<T9, T10>,
  fn10: UnaryFunction<T10, T11>,
  fn11: UnaryFunction<T11, T12>,
  fn12: UnaryFunction<T12, T13>,
  fn13: UnaryFunction<T13, T14>,
  fn14: UnaryFunction<T14, R>
): R;

/**
 * Applies a series of functions to an initial value, passing the result of each function to the next.
 *
 * Used to convert code that looks like:
 * ```typescript
 * const a = addB(addC({ a: 'a' }));
 * ```
 * to:
 * ```typescript
 * const a = chain({ a: 'a' }, addB, addC);
 * ```
 *
 * See [composable-options](/examples/composable-options) for an example of how this can be used.
 *
 * @param {T0} initial Initial value to pass through the chain
 * @param fns Functions to apply to the initial value, and each subsequent value
 * @returns {R} Updated value after all functions have been applied
 */
export function chain<
  T0,
  T1,
  T2,
  T3,
  T4,
  T5,
  T6,
  T7,
  T8,
  T9,
  T10,
  T11,
  T12,
  T13,
  T14,
  T15,
  R
>(
  initial: T0,
  fn0: UnaryFunction<T0, T1>,
  fn1: UnaryFunction<T1, T2>,
  fn2: UnaryFunction<T2, T3>,
  fn3: UnaryFunction<T3, T4>,
  fn4: UnaryFunction<T4, T5>,
  fn5: UnaryFunction<T5, T6>,
  fn6: UnaryFunction<T6, T7>,
  fn7: UnaryFunction<T7, T8>,
  fn8: UnaryFunction<T8, T9>,
  fn9: UnaryFunction<T9, T10>,
  fn10: UnaryFunction<T10, T11>,
  fn11: UnaryFunction<T11, T12>,
  fn12: UnaryFunction<T12, T13>,
  fn13: UnaryFunction<T13, T14>,
  fn14: UnaryFunction<T14, T15>,
  fn15: UnaryFunction<T15, R>
): R;

/**
 * Applies a series of functions to an initial value, passing the result of each function to the next.
 *
 * Used to convert code that looks like:
 * ```typescript
 * const a = addB(addC({ a: 'a' }));
 * ```
 * to:
 * ```typescript
 * const a = chain({ a: 'a' }, addB, addC);
 * ```
 *
 * See [composable-options](/examples/composable-options) for an example of how this can be used.
 *
 * NOTE: Seeing a return type of `unknown`? This is likely due to the number of functions passed to
 * `chain` exceeding the number of overloads provided. There is a technical limitation in TypeScript
 * that means we need to provide a finite number of overloads. While we anticipate that 16 overloads
 * should be enough for most use cases, if you need more you can combine chains together like below:
 * ```typescript
 * const a = chain(
 *    { a: 'a' },
 *   addB,
 *   (iv) => chain(iv, addC, addD, addE),
 * );
 * ```
 *
 * @param initial Initial value to pass through the chain
 * @param fns Functions to apply to the initial value, and each subsequent value
 * @returns Updated value after all functions have been applied
 */
export function chain<T0>(
  initial: T0,
  ...fns: UnaryFunction<any, any>[]
): unknown {
  return fns.reduce((acc, fn) => fn(acc), initial);
}

/**
 * A composition helper to be used with {@link chain}.
 *
 * @param name The name of the option to add
 * @param config The configuration for the option
 * @returns A unary function that adds an option to an {@link ArgvParser}.
 */
export function makeComposableOption<
  const TKey extends string,
  const TOptionConfig extends OptionConfig
>(name: TKey, config: TOptionConfig) {
  return <const T extends ParsedArgs>(argv: ArgvParser<T>) =>
    argv.option(name, config);
}
