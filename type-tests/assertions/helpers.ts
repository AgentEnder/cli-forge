/**
 * Assertion utility types for type testing.
 * These types help validate that TypeScript infers the correct types.
 */

/**
 * Asserts that type T is exactly equal to type U.
 * Will cause a compile error if types don't match.
 */
export type AssertEqual<T, U> = (<V>() => V extends T ? 1 : 2) extends <
  V,
>() => V extends U ? 1 : 2
  ? true
  : false;

/**
 * Asserts that type T extends type U.
 * Will cause a compile error if T does not extend U.
 */
export type AssertExtends<T, U> = T extends U ? true : false;

/**
 * Asserts that a value is of type T.
 * Useful for runtime checks combined with compile-time validation.
 */
export function assertType<T>(value: T): void {
  // No-op at runtime, used purely for compile-time type checking
}

/**
 * Helper to create a test that ensures a type matches expectations.
 * Usage: const test: IsTrue<AssertEqual<Actual, Expected>> = true;
 */
export type IsTrue<T extends true> = T;

/**
 * Helper to create a test that ensures a type is false.
 * Usage: const test: IsFalse<AssertEqual<Actual, NotExpected>> = true;
 */
export type IsFalse<T extends false> = T;

/**
 * Assert two types are exactly equal.
 * This version produces more readable error messages than AssertEqual.
 */
export type AssertEqualAlt<TActual, TExpected> =
  [TActual] extends [TExpected]
    ? [TExpected] extends [TActual]
      ? true
      : { error: "Type mismatch"; actual: TActual; expected: TExpected }
    : { error: "Type mismatch"; actual: TActual; expected: TExpected };

/**
 * Assert a type is NOT a Record/index signature.
 */
export type AssertNotIndexSignature<T> =
  string extends keyof T
    ? { error: "Unexpected index signature"; got: T }
    : true;

/**
 * Assert a specific property exists with exact type.
 */
export type AssertProperty<T, K extends string, TExpected> =
  K extends keyof T
    ? AssertEqual<T[K], TExpected>
    : { error: "Missing property"; property: K; on: T };

/**
 * Assert a type contains specific properties.
 */
export type AssertHasProperties<T, TProps extends Record<string, unknown>> =
  { [K in keyof TProps]: K extends keyof T ? AssertEqual<T[K], TProps[K]> : { error: "Missing property"; property: K } };
