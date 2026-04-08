/**
 * Core type resolution utilities for option configs.
 * Uses structural typing to avoid circular imports.
 */

/**
 * Check if a type is `any`.
 * Uses the property that `1 & any` is `any`, and `0 extends any` is true.
 */
type IsAny<T> = 0 extends 1 & T ? true : false;

/**
 * Force TypeScript to fully expand a type.
 * This helps with deferred type evaluation in recursive types.
 */
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

/**
 * Deeply expand a type, including nested objects.
 */
export type ExpandDeep<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: ExpandDeep<O[K]> }
    : never
  : T;

/**
 * Infer the choice type from an option config.
 * Choices can be an array (including readonly) or a function returning an array.
 */
export type InferChoice<T> = T extends { choices: readonly (infer C)[] }
  ? C
  : T extends { choices: () => readonly (infer C)[] }
  ? C
  : never;

/**
 * Infer the coerced type. If coerce function exists, use its return type.
 * Otherwise fall back to the provided fallback type.
 *
 * Uses optional property matching `coerce?:` to handle configs where coerce
 * is defined as optional (like ObjectOptionConfig).
 *
 * Special handling:
 * - [R] extends [never]: When coerce is missing/undefined, R infers as never
 * - R extends undefined: When coerce explicitly returns undefined
 */
export type InferCoerce<T, TFallback> = T extends {
  coerce?: (v: any) => infer R;
}
  ? [R] extends [never]
    ? TFallback
    : R extends undefined
    ? TFallback
    : R
  : TFallback;

/**
 * Map an option config to its base TypeScript type.
 * Uses structural typing to avoid circular imports.
 */
export type BaseType<T> = T extends { type: 'string' }
  ? string
  : T extends { type: 'number' }
  ? number
  : T extends { type: 'boolean' }
  ? boolean
  : T extends { type: 'array'; items: 'string' }
  ? string[]
  : T extends { type: 'array'; items: 'number' }
  ? number[]
  : T extends {
      type: 'object';
      properties: infer P;
    }
  ? P extends Record<string, unknown>
    ? ResolveProperties<P>
    : never
  : T extends { type: 'oneOf'; valueTypes: infer V }
  ? V extends readonly { type: string }[]
    ? DistributeResolveOptionType<V[number]>
    : never
  : never;

/**
 * Forces `ResolveOptionType` to distribute over a union.
 * `ResolveOptionType` is not naturally distributive because its outer
 * conditional checks `InferChoice<T>` (not a naked type parameter).
 * Wrapping in `T extends any` makes `T` naked, so TypeScript evaluates
 * each union member separately — essential for oneOf where value type
 * entries with choices must not swallow entries without.
 */
type DistributeResolveOptionType<T> = T extends any
  ? ResolveOptionType<T>
  : never;

/**
 * Resolve a single option config to its final type.
 * Priority: choices > coerce > base type
 *
 * For array options, choices narrow the element type rather than replacing
 * the entire type. e.g. `{ type: 'array', items: 'string', choices: ['a', 'b'] as const }`
 * resolves to `('a' | 'b')[]`, not `'a' | 'b'`.
 */
export type ResolveOptionType<T> = InferChoice<T> extends never
  ? InferCoerce<T, BaseType<T>>
  : T extends { type: 'array' }
    ? InferChoice<T>[]
    : InferChoice<T>;

/**
 * Wrap a resolved type with undefined if the option is optional.
 * Required options or options with defaults are never undefined.
 *
 * Uses `'key' extends keyof TConfig` instead of `TConfig extends { key: unknown }`
 * to properly detect OPTIONAL properties. The latter check fails for optional
 * properties because `{ default?: X }` doesn't guarantee `default` exists.
 */
export type WithOptional<TResolved, TConfig> = TConfig extends {
  required: true;
}
  ? TResolved
  : 'default' extends keyof TConfig
  ? TResolved
  : TResolved | undefined;

/**
 * Resolve all properties of an object option to their types.
 * Each property becomes its resolved type, wrapped with optional handling.
 *
 * Special case: when TProperties is `any` (from `OptionConfig<any, any, any, any>`),
 * we return `unknown` to avoid creating an index signature that would hide
 * the actual properties inferred from the value.
 */
export type ResolveProperties<TProperties> = IsAny<TProperties> extends true
  ? unknown
  : {
      [K in keyof TProperties]: WithOptional<
        ResolveOptionType<TProperties[K]>,
        TProperties[K]
      >;
    };

/**
 * Compute the full value type for an object option.
 */
export type ObjectValueType<TProperties> = ResolveProperties<TProperties>;

/**
 * Keys of T whose value type includes `undefined`.
 */
type UndefinedKeys<T> = {
  [K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];

/**
 * Keys of T whose value type does NOT include `undefined`.
 */
type DefinedKeys<T> = {
  [K in keyof T]: undefined extends T[K] ? never : K;
}[keyof T];

/**
 * Makes properties whose type includes `undefined` optional.
 * This allows omitting properties like `{ foo?: string | undefined }` from object literals
 * instead of requiring `{ foo: undefined }`.
 *
 * Uses `Pick` to avoid producing empty `{}` intersection members in TypeDoc output.
 * When one side has no matching keys, `Pick<T, never>` collapses to `{}` inside a
 * two-part `& {}` — the mapped type wrapper `{ [K in keyof ...]: ... }` forces
 * TypeScript to flatten the intersection into a single object type, eliminating
 * the empty half entirely and keeping tooltips clean.
 */
export type MakeUndefinedPropertiesOptional<T> = {
  [K in keyof (Partial<Pick<T, UndefinedKeys<T>>> &
    Pick<T, DefinedKeys<T>>)]: (Partial<Pick<T, UndefinedKeys<T>>> &
    Pick<T, DefinedKeys<T>>)[K];
};
